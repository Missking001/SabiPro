"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    onModuleInit() {
        setInterval(() => {
            this.autoReleasePayouts().catch((err) => {
                this.logger.error('Failed to run auto-release payouts scheduler', err);
            });
        }, 60 * 60 * 1000);
        this.logger.log('Payout auto-release scheduler initialized');
    }
    async log(event, status, payload, transactionId, gatewayRef) {
        try {
            await this.prisma.paymentLog.create({
                data: {
                    event,
                    status,
                    payload: payload,
                    transactionId: transactionId ?? null,
                    gatewayRef: gatewayRef ?? null,
                },
            });
        }
        catch (err) {
            this.logger.error('Failed to write payment log', err);
        }
    }
    async verifyFlutterwaveTransaction(flwTransactionId) {
        const secretKey = process.env.FLW_SECRET_KEY || '';
        try {
            const response = await fetch(`https://api.flutterwave.com/v3/transactions/${flwTransactionId}/verify`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                },
            });
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
        }
        catch (err) {
            this.logger.error(`Flutterwave verify request failed for tx ${flwTransactionId}`, err);
            return null;
        }
    }
    async initiate(consumerId, dto) {
        if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
            throw new common_1.BadRequestException('Invalid payment amount');
        }
        const provider = await this.prisma.provider.findUnique({
            where: { id: dto.providerId },
            select: { id: true, priceRange: true, isAvailable: true },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        if (!provider.isAvailable) {
            throw new common_1.BadRequestException('This provider is currently unavailable');
        }
        if (provider.priceRange) {
            const priceRangeParts = provider.priceRange.split('-').map((p) => parseInt(p.trim(), 10));
            if (priceRangeParts.length === 2 && priceRangeParts.every((p) => !isNaN(p))) {
                const [minKobo, maxKobo] = priceRangeParts;
                if (dto.amount < minKobo) {
                    throw new common_1.BadRequestException(`Amount is below the provider's minimum price of ₦${(minKobo / 100).toLocaleString('en-NG')}`);
                }
                if (dto.amount > maxKobo) {
                    throw new common_1.BadRequestException(`Amount exceeds the provider's maximum price of ₦${(maxKobo / 100).toLocaleString('en-NG')}`);
                }
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
                status: client_1.TxStatus.PENDING,
            },
        });
        await this.prisma.notification.create({
            data: {
                userId: consumerId,
                type: client_1.NotificationType.PAYMENT_INITIATED,
                message: `Payment of ₦${(dto.amount / 100).toLocaleString('en-NG')} initiated.`,
            },
        });
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
    async handleWebhook(body, signature) {
        const secret = process.env.FLW_WEBHOOK_SECRET || '';
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(body))
            .digest('hex');
        let signatureValid = false;
        try {
            signatureValid = crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(expectedSignature));
        }
        catch {
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
        await this.log('WEBHOOK_RECEIVED', 'PROCESSING', {
            event: body.event,
            txRef: body.data?.tx_ref,
            flwRef: body.data?.flw_ref,
            flwId: body.data?.id,
        }, undefined, body.data?.tx_ref);
        const { event, data } = body;
        if (event === 'charge.completed' && data.tx_ref) {
            const existing = await this.prisma.transaction.findUnique({
                where: { gatewayRef: data.tx_ref },
                include: { provider: { select: { userId: true } } },
            });
            if (!existing) {
                this.logger.warn(`Transaction ${data.tx_ref} not found for webhook`);
                await this.log('WEBHOOK_TX_NOT_FOUND', 'SKIPPED', { txRef: data.tx_ref });
                return { status: 'ok' };
            }
            if (existing.status !== client_1.TxStatus.PENDING) {
                this.logger.warn(`Transaction ${data.tx_ref} already processed (status: ${existing.status})`);
                await this.log('WEBHOOK_ALREADY_PROCESSED', 'SKIPPED', {
                    txRef: data.tx_ref,
                    currentStatus: existing.status,
                }, existing.id, data.tx_ref);
                return { status: 'ok' };
            }
            let verifiedData = null;
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
            let newStatus;
            if (verifiedData &&
                verifiedData.status === 'successful' &&
                verifiedData.tx_ref === data.tx_ref) {
                const verifiedAmountKobo = Math.round(verifiedData.amount * 100);
                if (verifiedAmountKobo !== existing.amount) {
                    this.logger.error(`Amount mismatch for ${data.tx_ref}: expected ${existing.amount} kobo, got ${verifiedAmountKobo} kobo from Flutterwave`);
                    await this.log('WEBHOOK_AMOUNT_MISMATCH', 'FAILED', {
                        txRef: data.tx_ref,
                        expectedKobo: existing.amount,
                        receivedKobo: verifiedAmountKobo,
                    }, existing.id, data.tx_ref);
                    newStatus = client_1.TxStatus.FAILED;
                }
                else {
                    newStatus = client_1.TxStatus.SUCCESSFUL;
                }
            }
            else {
                newStatus = client_1.TxStatus.FAILED;
            }
            await this.prisma.$transaction(async (tx) => {
                await tx.transaction.update({
                    where: { gatewayRef: data.tx_ref },
                    data: {
                        status: newStatus,
                        gatewayStatus: verifiedData?.status || data.status || 'unknown',
                    },
                });
                if (newStatus === client_1.TxStatus.SUCCESSFUL) {
                    await tx.notification.create({
                        data: {
                            userId: existing.consumerId,
                            type: client_1.NotificationType.PAYMENT_CONFIRMED,
                            message: `Payment of ₦${(existing.amount / 100).toLocaleString('en-NG')} confirmed. The funds are held in escrow.`,
                        },
                    });
                    await tx.notification.create({
                        data: {
                            userId: existing.provider.userId,
                            type: client_1.NotificationType.PAYMENT_CONFIRMED,
                            message: `A consumer paid ₦${(existing.amount / 100).toLocaleString('en-NG')} for your services. Funds are held in escrow.`,
                        },
                    });
                }
                else {
                    await tx.notification.create({
                        data: {
                            userId: existing.consumerId,
                            type: client_1.NotificationType.PAYMENT_FAILED,
                            message: `Payment of ₦${(existing.amount / 100).toLocaleString('en-NG')} failed.`,
                        },
                    });
                }
            });
            await this.log('WEBHOOK_PROCESSED', newStatus === client_1.TxStatus.SUCCESSFUL ? 'SUCCESS' : 'FAILED', {
                txRef: data.tx_ref,
                finalStatus: newStatus,
                verified: !!verifiedData,
            }, existing.id, data.tx_ref);
        }
        return { status: 'ok' };
    }
    async findOne(id, userId, role) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                consumer: { select: { id: true, name: true } },
                provider: { select: { id: true, userId: true, tradeCategory: true } },
                payouts: true,
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (role !== client_1.Role.ADMIN &&
            transaction.consumerId !== userId &&
            transaction.provider.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this transaction');
        }
        return transaction;
    }
    async getConsumerHistory(userId) {
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
    async getProviderHistory(userId) {
        const provider = await this.prisma.provider.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider profile not found');
        }
        return this.prisma.transaction.findMany({
            where: { providerId: provider.id },
            orderBy: { createdAt: 'desc' },
            include: {
                consumer: { select: { name: true } },
            },
        });
    }
    async releasePayout(id, userId) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            select: { id: true, consumerId: true, status: true, amount: true, providerId: true, gatewayRef: true },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (transaction.consumerId !== userId) {
            throw new common_1.ForbiddenException('Only the consumer can release payout');
        }
        if (transaction.status !== client_1.TxStatus.SUCCESSFUL) {
            throw new common_1.BadRequestException('Transaction must be successful before releasing payout');
        }
        const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || '10', 10);
        const platformFee = Math.round(transaction.amount * (platformFeePercent / 100));
        const payoutAmount = transaction.amount - platformFee;
        await this.prisma.$transaction(async (tx) => {
            await tx.transaction.update({
                where: { id },
                data: {
                    payoutStatus: client_1.PayoutStatus.RELEASED,
                    payoutReleasedAt: new Date(),
                },
            });
            await tx.payout.create({
                data: {
                    providerId: transaction.providerId,
                    transactionId: transaction.id,
                    amount: payoutAmount,
                    platformFee,
                    status: client_1.PayoutState.COMPLETED,
                    bankCode: '011',
                    accountNumber: '3000201029',
                    processedAt: new Date(),
                },
            });
            const provider = await tx.provider.findUnique({
                where: { id: transaction.providerId },
                select: { userId: true },
            });
            if (provider) {
                await tx.notification.create({
                    data: {
                        userId: provider.userId,
                        type: client_1.NotificationType.PAYOUT_RELEASED,
                        message: `Payout of ₦${(payoutAmount / 100).toLocaleString('en-NG')} has been released to your bank account.`,
                    },
                });
            }
        });
        await this.log('PAYOUT_RELEASED', 'SUCCESS', {
            transactionId: id,
            payoutAmount,
            platformFee,
        }, id, transaction.gatewayRef);
        this.logger.log(`Payout released for transaction ${id}: ${payoutAmount} (fee: ${platformFee})`);
        return { message: 'Payout released', amount: payoutAmount, platformFee };
    }
    async dispute(id, userId) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            select: { id: true, consumerId: true, status: true, gatewayRef: true },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (transaction.consumerId !== userId) {
            throw new common_1.ForbiddenException('Only the consumer can dispute this transaction');
        }
        await this.prisma.transaction.update({
            where: { id },
            data: { status: client_1.TxStatus.DISPUTED },
        });
        await this.log('DISPUTE_RAISED', 'DISPUTED', {
            transactionId: id,
            consumerId: userId,
        }, id, transaction.gatewayRef);
        return { message: 'Dispute raised. An admin will review your case.' };
    }
    async refund(id) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            select: { id: true, status: true, gatewayRef: true },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        await this.prisma.transaction.update({
            where: { id },
            data: { status: client_1.TxStatus.REFUNDED },
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
                status: client_1.TxStatus.SUCCESSFUL,
                payoutStatus: client_1.PayoutStatus.PENDING,
                createdAt: { lt: sevenDaysAgo },
            },
        });
        for (const tx of transactions) {
            try {
                const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || '10', 10);
                const platformFee = Math.round(tx.amount * (platformFeePercent / 100));
                const payoutAmount = tx.amount - platformFee;
                await this.prisma.$transaction(async (prismaTx) => {
                    await prismaTx.transaction.update({
                        where: { id: tx.id },
                        data: {
                            payoutStatus: client_1.PayoutStatus.RELEASED,
                            payoutReleasedAt: new Date(),
                        },
                    });
                    await prismaTx.payout.create({
                        data: {
                            providerId: tx.providerId,
                            transactionId: tx.id,
                            amount: payoutAmount,
                            platformFee,
                            status: client_1.PayoutState.COMPLETED,
                            bankCode: '011',
                            accountNumber: '3000201029',
                            processedAt: new Date(),
                        },
                    });
                    const provider = await prismaTx.provider.findUnique({
                        where: { id: tx.providerId },
                        select: { userId: true },
                    });
                    if (provider) {
                        await prismaTx.notification.create({
                            data: {
                                userId: provider.userId,
                                type: client_1.NotificationType.PAYOUT_RELEASED,
                                message: `Payout of ₦${(payoutAmount / 100).toLocaleString('en-NG')} has been auto-released for transaction ${tx.id.slice(0, 8)}...`,
                            },
                        });
                    }
                });
                await this.log('PAYOUT_AUTO_RELEASED', 'SUCCESS', {
                    transactionId: tx.id,
                    payoutAmount,
                    platformFee,
                }, tx.id, tx.gatewayRef);
                this.logger.log(`Auto-released payout for transaction ${tx.id}`);
            }
            catch (err) {
                this.logger.error(`Failed to auto-release payout for transaction ${tx.id}`, err);
            }
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map