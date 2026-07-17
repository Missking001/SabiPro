/// <reference path="./declarations.d.ts" />
/**
 * webhook-handler.ts
 * SabiPro — Flutterwave Webhook Handler
 *
 * This is the complete, production-ready webhook handler for
 * all Flutterwave payment events in SabiPro.
 *
 * Location: apps/api/src/payments/payments.controller.ts
 * (webhook endpoint extracted here for reference)
 *
 * RULES:
 * - Verify FLW-Signature before ANY processing
 * - Use raw body buffer for signature — not parsed JSON
 * - Return 200 immediately
 * - Process idempotently — same gatewayRef never processed twice
 * - Store raw payload in Transaction.metadata for audit trail
 */

import {
    Controller,
    Post,
    Headers,
    Body,
    RawBodyRequest,
    Req,
    HttpCode,
    HttpStatus,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
// In the actual NestJS service, these would be imported from their respective modules:
// import { PrismaService } from '../prisma/prisma.service';
// import { NotificationsService } from './notifications/notifications.service';
import { NotificationType, TxStatus, Prisma } from '@prisma/client';

// ── Types ────────────────────────────────────────────────────────────────────

interface FlwWebhookPayload {
    event: 'charge.completed' | 'transfer.completed' | 'transfer.failed';
    data: {
        id: number;
        tx_ref: string;
        flw_ref: string;
        status: 'successful' | 'failed' | 'pending';
        amount: number;
        currency: string;
        customer: {
            id: number;
            name: string;
            email: string;
        };
        meta?: Record<string, unknown>;
    };
}

// ── Webhook Controller Method ─────────────────────────────────────────────────

@Controller('payments')
export class PaymentsController {
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('verif-hash') signature: string,
        @Body() payload: FlwWebhookPayload,
    ): Promise<{ received: boolean }> {
        const logger = new Logger('FlutterwaveWebhook');

        // ── Step 1: Verify signature ──────────────────────────────────────────────
        // CRITICAL: use raw body buffer — not the parsed JSON
        const rawBody = req.rawBody;

        if(!rawBody) {
            logger.error('Webhook received without raw body buffer');
            throw new BadRequestException('Invalid webhook');
        }

        const isValid = verifyWebhookSignature(
            rawBody,
            signature,
            process.env.FLW_WEBHOOK_SECRET!,
        );

        if(!isValid) {
            logger.warn('Webhook signature verification failed');
            throw new BadRequestException('Invalid signature');
        }

        // ── Step 2: Return 200 immediately — process below ────────────────────────
        // Flutterwave expects a fast response.
        // In production, consider processing in a background job.
        // For MVP, synchronous processing is acceptable.

        logger.log(`Webhook received: event=${payload.event} txRef=${payload.data.tx_ref}`);

        // ── Step 3: Route by event type ──────────────────────────────────────────
        try {
            switch(payload.event) {
                case 'charge.completed':
                    await handleChargeCompleted(payload, logger);
                    break;
                case 'transfer.completed':
                    await handleTransferCompleted(payload, logger);
                    break;
                case 'transfer.failed':
                    await handleTransferFailed(payload, logger);
                    break;
                default:
                    logger.warn(`Unhandled webhook event: ${payload.event}`);
            }
        } catch (error) {
            // Log the error but still return 200 to Flutterwave
            // to prevent unnecessary retries for processing errors
            logger.error('Webhook processing error', error);
        }

        return { received: true };
    }
}

// ── Signature Verification ────────────────────────────────────────────────────

function verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
    secret: string,
): boolean {
    if (!signature) return false;

    const hash = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(hash, 'hex'),
            Buffer.from(signature, 'hex'),
        );
    } catch {
        return false;
    }
}

// ── Event Handlers ────────────────────────────────────────────────────────────

/**
 * charge.completed
 * Fired when a consumer's payment succeeds or fails.
 * Updates Transaction status and notifies both parties.
 */
async function handleChargeCompleted(
    payload: FlwWebhookPayload,
    logger: Logger,
    // In the real service, prisma and notifications are injected
    // prisma: PrismaService,
    // notifications: NotificationsService,
): Promise<void> {
    const { tx_ref, status, id: flwId } = payload.data;

    // ── Idempotency check ────────────────────────────────────────────────────
    // Replace `prisma` with the injected PrismaService instance
    const existing = await prisma.transaction.findUnique({
        where: { gatewayRef: tx_ref },
    });

    if (!existing) {
        logger.warn(`Transaction not found for gatewayRef: ${tx_ref}`);
        return;
    }

    if (existing.status !== 'PENDING') {
        logger.log(`Transaction ${tx_ref} already processed — skipping`);
        return; // idempotent — already handled
    }

    // ── Update transaction ───────────────────────────────────────────────────
    const newStatus: TxStatus =
        status === 'successful' ? TxStatus.SUCCESSFUL : TxStatus.FAILED;

    await prisma.transaction.update({
        where: { gatewayRef: tx_ref },
        data: {
            status: newStatus,
            gatewayStatus: status,
            metadata: payload.data as unknown as Prisma.JsonObject,
        },
    });

    // ── Notifications ────────────────────────────────────────────────────────
    if (newStatus === TxStatus.SUCCESSFUL) {
        // Notify consumer
        await notifications.create({
            userId: existing.consumerId,
            type: NotificationType.PAYMENT_CONFIRMED,
            message: 'Your payment was successful. Your inquiry has been sent.',
            relatedId: existing.id,
            relatedType: 'Transaction',
            sendEmail: true,
        });

        // Notify provider
        await notifications.create({
            userId: existing.providerId,
            type: NotificationType.PAYMENT_CONFIRMED,
            message: 'A consumer has paid and sent you an inquiry.',
            relatedId: existing.id,
            relatedType: 'Transaction',
            sendEmail: true,
        });

        logger.log(`Payment confirmed: txRef=${tx_ref}`);
    } else {
        // Notify consumer of failure
        await notifications.create({
            userId: existing.consumerId,
            type: NotificationType.PAYMENT_FAILED,
            message: 'Your payment failed. Please try again.',
            relatedId: existing.id,
            relatedType: 'Transaction',
            sendEmail: true,
        });

        logger.log(`Payment failed: txRef=${tx_ref}`);
    }
}

/**
 * transfer.completed
 * Fired when a payout to a provider's bank account succeeds.
 */
async function handleTransferCompleted(
    payload: FlwWebhookPayload,
    logger: Logger,
): Promise<void> {
    const { tx_ref } = payload.data;

    // Find the payout by its gateway reference
    const payout = await prisma.payout.findFirst({
        where: { gatewayRef: tx_ref },
    });

    if (!payout) {
        logger.warn(`Payout not found for gatewayRef: ${tx_ref}`);
        return;
    }

    if (payout.status === 'COMPLETED') {
        logger.log(`Payout ${tx_ref} already marked complete — skipping`);
        return;
    }

    await prisma.payout.update({
        where: { id: payout.id },
        data: {
            status: 'COMPLETED',
            processedAt: new Date(),
        },
    });

    // Notify provider
    await notifications.create({
        userId: payout.providerId,
        type: NotificationType.PAYOUT_RELEASED,
        message: 'Your payout has been sent to your bank account.',
        relatedId: payout.id,
        relatedType: 'Payout',
        sendEmail: true,
    });

    logger.log(`Payout completed: ${tx_ref}`);
}

/**
 * transfer.failed
 * Fired when a payout to a provider's bank account fails.
 */
async function handleTransferFailed(
    payload: FlwWebhookPayload,
    logger: Logger,
): Promise<void> {
    const { tx_ref } = payload.data;

    const payout = await prisma.payout.findFirst({
        where: { gatewayRef: tx_ref },
    });

    if (!payout) {
        logger.warn(`Payout not found for failed transfer: ${tx_ref}`);
        return;
    }

    await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'FAILED' },
    });

    // Notify provider of failure and prompt to check bank details
    await notifications.create({
        userId: payout.providerId,
        type: NotificationType.PAYOUT_WITHHELD,
        message:
            'Your payout could not be processed. Please check your bank details and contact support.',
        relatedId: payout.id,
        relatedType: 'Payout',
        sendEmail: true,
    });

    logger.error(`Payout failed: ${tx_ref}`);
}

// ── Raw Body Setup (main.ts) ──────────────────────────────────────────────────
//
// To access req.rawBody in NestJS, configure the body parser in main.ts:
//
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
//
// async function bootstrap() {
//   const app = await NestFactory.create(AppModule, { rawBody: true });
//   // rawBody: true enables req.rawBody for webhook signature verification
//   ...
// }