import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/payments.dto';
import { TxStatus, PayoutStatus, PayoutState, Role, NotificationType, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveBankDetails(userId: string, dto: { bankCode: string; accountNumber: string }) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) throw new NotFoundException('Provider profile not found');

    await this.prisma.provider.update({
      where: { userId },
      data: { bankCode: dto.bankCode, accountNumber: dto.accountNumber },
    });

    return { message: 'Bank details saved successfully' };
  }

  async getBankDetails(userId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      select: { bankCode: true, accountNumber: true },
    });
    if (!provider) throw new NotFoundException('Provider profile not found');
    return { bankCode: provider.bankCode || null, accountNumber: provider.accountNumber || null };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoReleasePayouts() {
    this.logger.log('Running scheduled payout auto-release check');
    await this.autoReleasePayouts().catch((err) => {
      this.logger.error('Failed to run auto-release payouts scheduler', err);
    });
  }

  /**
   * Log every payment event to PaymentLog for audit trail
   */
  private async log(
    event: string,
    status: string,
    payload: Record<string, unknown>,
    transactionId?: string,
    gatewayRef?: string,
  ) {
    try {
      await this.prisma.paymentLog.create({
        data: {
          event,
          status,
          payload: payload as Prisma.InputJsonValue,
          transactionId: transactionId ?? null,
          gatewayRef: gatewayRef ?? null,
        },
      });
    } catch (err) {
      // Logging should never break the payment flow
      this.logger.error('Failed to write payment log', err);
    }
  }

  /**
   * Verify a Flutterwave transaction by calling their /v3/transactions/:id/verify endpoint.
   * Returns the verified transaction data or null if verification fails.
   */
  private async verifyFlutterwaveTransaction(flwTransactionId: string): Promise<{
    status: string;
    amount: number;
    currency: string;
    tx_ref: string;
  } | null> {
    const secretKey = process.env.FLW_SECRET_KEY || '';
    try {
      const response = await fetch(
        `https://api.flutterwave.com/v3/transactions/${flwTransactionId}/verify`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(`Flutterwave verify returned status ${response.status} for tx ${flwTransactionId}`);
        return null;
      }

      const json = await response.json();
      if (json.status === 'success' && json.data) {
        return {
          status: json.data.status,
          amount: json.data.amount,
          currency: json.data.currency,
          tx_ref: json.data.tx_ref,
        };
      }
      return null;
    } catch (err) {
      this.logger.error(`Flutterwave verify request failed for tx ${flwTransactionId}`, err);
      return null;
    }
  }

  async initiate(consumerId: string, dto: InitiatePaymentDto) {
    if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: dto.providerId },
      select: { id: true, priceRangeMin: true, priceRangeMax: true, isAvailable: true },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (!provider.isAvailable) {
      throw new BadRequestException('This provider is currently unavailable');
    }

    // Server-side price validation against the provider's price range
    if (provider.priceRangeMin != null && provider.priceRangeMax != null) {
      if (dto.amount < provider.priceRangeMin) {
        throw new BadRequestException(
          `Amount is below the provider's minimum price of ₦${(provider.priceRangeMin / 100).toLocaleString('en-NG')}`,
        );
      }
      if (dto.amount > provider.priceRangeMax) {
        throw new BadRequestException(
          `Amount exceeds the provider's maximum price of ₦${(provider.priceRangeMax / 100).toLocaleString('en-NG')}`,
        );
      }
    }

    const gatewayRef = `SABI-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    const transaction = await this.prisma.transaction.create({
      data: {
        consumerId,
        providerId: dto.providerId,
        inquiryId: dto.inquiryId,
        amount: dto.amount,
        gatewayRef,
        gatewayStatus: 'pending',
        status: TxStatus.PENDING,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: consumerId,
        type: NotificationType.PAYMENT_INITIATED,
        message: `Payment of ₦${(dto.amount / 100).toLocaleString('en-NG')} initiated.`,
      },
    });

    // Log payment initiation
    await this.log('PAYMENT_INITIATED', 'PENDING', {
      consumerId,
      providerId: dto.providerId,
      amount: dto.amount,
      gatewayRef,
    }, transaction.id, gatewayRef);

    this.logger.log(`Payment initiated: ${gatewayRef}`);

    return {
      transactionId: transaction.id,
      gatewayRef,
      amount: dto.amount,
      paymentUrl: `https://checkout.flutterwave.com/pay/${gatewayRef}`,
    };
  }

  async handleWebhook(body: any, signature: string) {
    // Step 1: Verify webhook signature using HMAC-SHA256 with timing-safe comparison
    const secret = process.env.FLW_WEBHOOK_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    let signatureValid = false;
    try {
      signatureValid = crypto.timingSafeEqual(
        Buffer.from(signature || ''),
        Buffer.from(expectedSignature),
      );
    } catch {
      signatureValid = false;
    }

    if (!signatureValid) {
      this.logger.warn('Invalid webhook signature received');
      await this.log('WEBHOOK_SIGNATURE_INVALID', 'REJECTED', {
        receivedSignature: signature?.substring(0, 16) + '...',
        bodyEvent: body?.event,
      });
      return { status: 'error', message: 'Invalid signature' };
    }

    // Log raw webhook receipt
    await this.log('WEBHOOK_RECEIVED', 'PROCESSING', {
      event: body.event,
      txRef: body.data?.tx_ref,
      flwRef: body.data?.flw_ref,
      flwId: body.data?.id,
    }, undefined, body.data?.tx_ref);

    const { event, data } = body;

    if (event === 'charge.completed' && data.tx_ref) {
      // Step 2: Idempotency check — find the original pending transaction
      const existing = await this.prisma.transaction.findUnique({
        where: { gatewayRef: data.tx_ref },
        include: { provider: { select: { userId: true } } },
      });

      if (!existing) {
        this.logger.warn(`Transaction ${data.tx_ref} not found for webhook`);
        await this.log('WEBHOOK_TX_NOT_FOUND', 'SKIPPED', { txRef: data.tx_ref });
        return { status: 'ok' };
      }

      // Idempotency: if the transaction is already in a final state, skip
      if (existing.status !== TxStatus.PENDING) {
        this.logger.warn(`Transaction ${data.tx_ref} already processed (status: ${existing.status})`);
        await this.log('WEBHOOK_ALREADY_PROCESSED', 'SKIPPED', {
          txRef: data.tx_ref,
          currentStatus: existing.status,
        }, existing.id, data.tx_ref);
        return { status: 'ok' };
      }

      // Step 3: Verify the transaction with Flutterwave API — never trust webhook body alone
      let verifiedData: Awaited<ReturnType<typeof this.verifyFlutterwaveTransaction>> = null;
      if (data.id) {
        verifiedData = await this.verifyFlutterwaveTransaction(String(data.id));
      }

      await this.log('WEBHOOK_VERIFICATION_RESULT', verifiedData ? 'VERIFIED' : 'UNVERIFIED', {
        txRef: data.tx_ref,
        flwId: data.id,
        verifiedStatus: verifiedData?.status,
        verifiedAmount: verifiedData?.amount,
        originalAmount: existing.amount,
      }, existing.id, data.tx_ref);

      // Step 4: Cross-check amount from Flutterwave against the server-side record
      let newStatus: TxStatus;
      if (
        verifiedData &&
        verifiedData.status === 'successful' &&
        verifiedData.tx_ref === data.tx_ref
      ) {
        // Amount check: Flutterwave returns amount in major currency units (Naira),
        // our DB stores in kobo. Convert and compare.
        const verifiedAmountKobo = Math.round(verifiedData.amount * 100);
        if (verifiedAmountKobo !== existing.amount) {
          this.logger.error(
            `Amount mismatch for ${data.tx_ref}: expected ${existing.amount} kobo, got ${verifiedAmountKobo} kobo from Flutterwave`,
          );
          await this.log('WEBHOOK_AMOUNT_MISMATCH', 'FAILED', {
            txRef: data.tx_ref,
            expectedKobo: existing.amount,
            receivedKobo: verifiedAmountKobo,
          }, existing.id, data.tx_ref);
          newStatus = TxStatus.FAILED;
        } else {
          newStatus = TxStatus.SUCCESSFUL;
        }
      } else {
        newStatus = TxStatus.FAILED;
      }

      // Step 5: Update transaction and create notifications in a single atomic transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { gatewayRef: data.tx_ref },
          data: {
            status: newStatus,
            gatewayStatus: verifiedData?.status || data.status || 'unknown',
          },
        });

        if (newStatus === TxStatus.SUCCESSFUL) {
          await tx.notification.create({
            data: {
              userId: existing.consumerId,
              type: NotificationType.PAYMENT_CONFIRMED,
              message: `Payment of ₦${(existing.amount / 100).toLocaleString('en-NG')} confirmed. The funds are held in escrow.`,
            },
          });
          await tx.notification.create({
            data: {
              userId: existing.provider.userId,
              type: NotificationType.PAYMENT_CONFIRMED,
              message: `A consumer paid ₦${(existing.amount / 100).toLocaleString('en-NG')} for your services. Funds are held in escrow.`,
            },
          });
        } else {
          await tx.notification.create({
            data: {
              userId: existing.consumerId,
              type: NotificationType.PAYMENT_FAILED,
              message: `Payment of ₦${(existing.amount / 100).toLocaleString('en-NG')} failed.`,
            },
          });
        }
      });

      await this.log('WEBHOOK_PROCESSED', newStatus === TxStatus.SUCCESSFUL ? 'SUCCESS' : 'FAILED', {
        txRef: data.tx_ref,
        finalStatus: newStatus,
        verified: !!verifiedData,
      }, existing.id, data.tx_ref);
    }

    return { status: 'ok' };
  }

  async findOne(id: string, userId: string, role: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        consumer: { select: { id: true, name: true } },
        provider: { select: { id: true, userId: true, tradeCategory: true } },
        payouts: true,
      },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (
      role !== Role.ADMIN &&
      transaction.consumerId !== userId &&
      transaction.provider.userId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this transaction');
    }

    return transaction;
  }

  async getConsumerHistory(userId: string) {
    return this.prisma.transaction.findMany({
      where: { consumerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        provider: {
          select: {
            tradeCategory: true,
            slug: true,
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async getProviderHistory(userId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    return this.prisma.transaction.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
      include: {
        consumer: { select: { name: true } },
      },
    });
  }

  async releasePayout(id: string, userId: string, role: string = Role.CONSUMER) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: { id: true, consumerId: true, status: true, amount: true, providerId: true, gatewayRef: true },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    if (role !== Role.ADMIN && transaction.consumerId !== userId) {
      throw new ForbiddenException('Only the consumer can release payout');
    }
    if (transaction.status !== TxStatus.SUCCESSFUL) {
      throw new BadRequestException('Transaction must be successful before releasing payout');
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: transaction.providerId },
      select: { userId: true, bankCode: true, accountNumber: true },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    if (!provider.bankCode || !provider.accountNumber) {
      throw new BadRequestException('Provider has not set up their bank details yet');
    }

    const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || '10', 10);
    const platformFee = Math.round(transaction.amount * (platformFeePercent / 100));
    const payoutAmount = transaction.amount - platformFee;

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id },
        data: {
          payoutStatus: PayoutStatus.RELEASED,
          payoutReleasedAt: new Date(),
        },
      });

      await tx.payout.create({
        data: {
          providerId: transaction.providerId,
          transactionId: transaction.id,
          amount: payoutAmount,
          platformFee,
          status: PayoutState.COMPLETED,
          bankCode: provider.bankCode!,
          accountNumber: provider.accountNumber!,
          processedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: provider.userId,
          type: NotificationType.PAYOUT_RELEASED,
          message: `Payout of ₦${(payoutAmount / 100).toLocaleString('en-NG')} has been released to your bank account.`,
        },
      });
    });

    await this.log('PAYOUT_RELEASED', 'SUCCESS', {
      transactionId: id,
      payoutAmount,
      platformFee,
    }, id, transaction.gatewayRef);

    this.logger.log(`Payout released for transaction ${id}: ${payoutAmount} (fee: ${platformFee})`);

    return { message: 'Payout released', amount: payoutAmount, platformFee };
  }

  async dispute(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: { id: true, consumerId: true, status: true, gatewayRef: true, providerId: true },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    if (transaction.consumerId !== userId) {
      throw new ForbiddenException('Only the consumer can dispute this transaction');
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: transaction.providerId },
      select: { userId: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id },
        data: { status: TxStatus.DISPUTED },
      });

      await tx.notification.create({
        data: {
          userId: transaction.consumerId,
          type: NotificationType.DISPUTE_RAISED,
          message: `A dispute has been raised on your payment. An admin will review it.`,
        },
      });

      if (provider) {
        await tx.notification.create({
          data: {
            userId: provider.userId,
            type: NotificationType.DISPUTE_RAISED,
            message: `A dispute has been raised on transaction ${id.slice(0, 8)}... An admin will review it.`,
          },
        });
      }
    });

    await this.log('DISPUTE_RAISED', 'DISPUTED', {
      transactionId: id,
      consumerId: userId,
    }, id, transaction.gatewayRef);

    return { message: 'Dispute raised. An admin will review your case.' };
  }

  async refund(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: { id: true, status: true, gatewayRef: true, consumerId: true, providerId: true, amount: true },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: transaction.providerId },
      select: { userId: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id },
        data: { status: TxStatus.REFUNDED },
      });

      await tx.notification.create({
        data: {
          userId: transaction.consumerId,
          type: NotificationType.REFUND_ISSUED,
          message: `Your payment of ₦${(transaction.amount / 100).toLocaleString('en-NG')} has been refunded.`,
        },
      });

      if (provider) {
        await tx.notification.create({
          data: {
            userId: provider.userId,
            type: NotificationType.REFUND_ISSUED,
            message: `A refund of ₦${(transaction.amount / 100).toLocaleString('en-NG')} has been issued for transaction ${id.slice(0, 8)}...`,
          },
        });
      }
    });

    await this.log('REFUND_ISSUED', 'REFUNDED', {
      transactionId: id,
    }, id, transaction.gatewayRef);

    return { message: 'Refund issued' };
  }

  async autoReleasePayouts() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: TxStatus.SUCCESSFUL,
        payoutStatus: PayoutStatus.PENDING,
        createdAt: { lt: sevenDaysAgo },
      },
    });

    for (const tx of transactions) {
      try {
        const provider = await this.prisma.provider.findUnique({
          where: { id: tx.providerId },
          select: { userId: true, bankCode: true, accountNumber: true },
        });
        if (!provider || !provider.bankCode || !provider.accountNumber) {
          this.logger.warn(`Skipping auto-release for ${tx.id}: provider missing bank details`);
          continue;
        }

        const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || '10', 10);
        const platformFee = Math.round(tx.amount * (platformFeePercent / 100));
        const payoutAmount = tx.amount - platformFee;

        await this.prisma.$transaction(async (prismaTx) => {
          await prismaTx.transaction.update({
            where: { id: tx.id },
            data: {
              payoutStatus: PayoutStatus.RELEASED,
              payoutReleasedAt: new Date(),
            },
          });

          await prismaTx.payout.create({
            data: {
              providerId: tx.providerId,
              transactionId: tx.id,
              amount: payoutAmount,
              platformFee,
              status: PayoutState.COMPLETED,
          bankCode: provider.bankCode!,
          accountNumber: provider.accountNumber!,
              processedAt: new Date(),
            },
          });

          await prismaTx.notification.create({
            data: {
              userId: provider.userId,
              type: NotificationType.PAYOUT_RELEASED,
              message: `Payout of ₦${(payoutAmount / 100).toLocaleString('en-NG')} has been auto-released for transaction ${tx.id.slice(0, 8)}...`,
            },
          });
        });

        await this.log('PAYOUT_AUTO_RELEASED', 'SUCCESS', {
          transactionId: tx.id,
          payoutAmount,
          platformFee,
        }, tx.id, tx.gatewayRef);

        this.logger.log(`Auto-released payout for transaction ${tx.id}`);
      } catch (err) {
        this.logger.error(`Failed to auto-release payout for transaction ${tx.id}`, err);
      }
    }
  }
}
