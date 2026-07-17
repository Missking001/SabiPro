---
trigger: always_on
---

# SKILL.md — Flutterwave Integration

> Use this skill whenever you are building or modifying any payment,
> webhook, or payout feature in SabiPro. Read this entire file before
> writing a single line of payment code.

---

## Overview

SabiPro uses Flutterwave as its payment gateway for the pay-on-booking
escrow flow. The integration covers:

1. Initiating a payment (redirect to Flutterwave hosted checkout)
2. Receiving and verifying webhook events
3. Verifying a transaction after redirect
4. Initiating a payout to a provider's bank account

All Flutterwave SDK calls are isolated in `apps/api/src/payments/flutterwave.service.ts`.
The frontend never calls Flutterwave directly.

---

## Environment Variables Required

```
FLW_PUBLIC_KEY=FLWPUBK_TEST-...      # Safe for frontend use only for inline embed (not used in MVP)
FLW_SECRET_KEY=FLWSECK_TEST-...      # Backend only — NEVER expose to client
FLW_WEBHOOK_SECRET=...               # Used to verify webhook signatures
```

Test credentials are available from your Flutterwave dashboard under Settings → API Keys.

---

## Package Installation

```bash
# Install in apps/api
npm install flutterwave-node-v3

# Types (if needed)
npm install --save-dev @types/flutterwave-node-v3
```

---

## FlutterwaveService

All Flutterwave API calls must go through this service.
Never call the Flutterwave SDK directly from a controller or another service.

```typescript
// apps/api/src/payments/flutterwave.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Flutterwave from 'flutterwave-node-v3';

@Injectable()
export class FlutterwaveService {
  private readonly flw: Flutterwave;
  private readonly logger = new Logger(FlutterwaveService.name);

  constructor() {
    this.flw = new Flutterwave(
      process.env.FLW_PUBLIC_KEY,
      process.env.FLW_SECRET_KEY,
    );
  }

  // See resources/webhook-handler.ts for webhook verification
}
```

---

## 1. Initiating a Payment

```typescript
// In FlutterwaveService

async initiatePayment(payload: InitiatePaymentDto): Promise<string> {
  const txRef = `sabipro-${Date.now()}-${payload.consumerId}`;

  const response = await this.flw.Charge.initialize({
    tx_ref: txRef,
    amount: payload.amountInKobo / 100,   // Flutterwave uses naira — convert from kobo
    currency: 'NGN',
    redirect_url: `${process.env.ALLOWED_ORIGIN}/payments/verify`,
    customer: {
      email: payload.consumerEmail,
      name: payload.consumerName,
    },
    customizations: {
      title: 'SabiPro',
      description: `Payment to ${payload.providerName}`,
      logo: 'https://sabipro.com/logo.png',
    },
    meta: {
      consumerId: payload.consumerId,
      providerId: payload.providerId,
      inquiryId: payload.inquiryId ?? null,
    },
  });

  if (response.status !== 'success') {
    this.logger.error('Payment initiation failed', response);
    throw new Error('Payment initiation failed');
  }

  return response.data.link; // redirect consumer to this URL
}
```

### PaymentsService — initiate endpoint

```typescript
// apps/api/src/payments/payments.service.ts

async initiate(consumerId: string, dto: InitiatePaymentDto) {
  // 1. Create a PENDING transaction record first
  const transaction = await this.prisma.transaction.create({
    data: {
      consumerId,
      providerId: dto.providerId,
      inquiryId: dto.inquiryId ?? null,
      amount: dto.amountInKobo,
      currency: 'NGN',
      status: 'PENDING',
      gatewayRef: `sabipro-${Date.now()}-${consumerId}`, // temp — updated after FLW call
      gatewayStatus: 'pending',
    },
  });

  // 2. Get Flutterwave payment URL
  const paymentUrl = await this.flutterwaveService.initiatePayment({
    ...dto,
    txRef: transaction.gatewayRef,
  });

  return { transactionId: transaction.id, paymentUrl };
}
```

---

## 2. Verifying a Transaction (after redirect)

Flutterwave redirects back to `redirect_url?transaction_id=xxx&status=xxx`.
Always verify server-side — never trust the query params alone.

```typescript
// In FlutterwaveService

async verifyTransaction(transactionId: string): Promise<FlwVerifyResponse> {
  const response = await this.flw.Transaction.verify({ id: transactionId });

  if (response.status !== 'success') {
    throw new Error(`Verification failed: ${response.message}`);
  }

  return response.data;
}
```

```typescript
// In PaymentsService — called from redirect handler

async verifyAndUpdate(flwTransactionId: string, txRef: string) {
  const data = await this.flutterwaveService.verifyTransaction(flwTransactionId);

  // Confirm the tx_ref matches what we generated
  if (data.tx_ref !== txRef) {
    throw new BadRequestException('Transaction reference mismatch');
  }

  await this.prisma.transaction.update({
    where: { gatewayRef: txRef },
    data: {
      status: data.status === 'successful' ? 'SUCCESSFUL' : 'FAILED',
      gatewayStatus: data.status,
      metadata: data as unknown as Prisma.JsonObject,
    },
  });
}
```

---

## 3. Webhook Handler

See `resources/webhook-handler.ts` for the complete implementation.

Key rules:
- Verify `FLW-Signature` header using HMAC-SHA256 before ANY processing
- Use the **raw body buffer** for signature verification — not the parsed JSON
- Return `200` immediately — never make Flutterwave wait
- Check `gatewayRef` for idempotency — never process the same ref twice
- Store the raw webhook payload in `Transaction.metadata` for audit

Supported event types to handle:

| Event | Action |
|-------|--------|
| `charge.completed` | Update Transaction to SUCCESSFUL, notify consumer + provider |
| `transfer.completed` | Update Payout to COMPLETED |
| `transfer.failed` | Update Payout to FAILED, notify provider |

---

## 4. Initiating a Payout

```typescript
// In FlutterwaveService

async initiatePayout(payload: InitiatePayoutDto): Promise<string> {
  const response = await this.flw.Transfer.initiate({
    account_bank: payload.bankCode,
    account_number: payload.accountNumber,
    amount: payload.amountInKobo / 100,   // convert kobo to naira
    currency: 'NGN',
    narration: `SabiPro payout — job completed`,
    reference: `payout-${payload.payoutId}-${Date.now()}`,
    callback_url: `${process.env.API_BASE_URL}/api/payments/webhook`,
    debit_currency: 'NGN',
  });

  if (response.status !== 'success') {
    this.logger.error('Payout initiation failed', response);
    throw new Error('Payout initiation failed');
  }

  return response.data.reference;
}
```

### Payout trigger rules
- Triggered when consumer calls `POST /api/payments/:id/release`
- OR auto-triggered after `PAYOUT_AUTO_RELEASE_DAYS` (7) days
- Platform fee is deducted before payout: `payoutAmount = amount - platformFee`
- Platform fee percentage from `process.env.PLATFORM_FEE_PERCENT`

```typescript
const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENT ?? '10');
const platformFee = Math.floor((transaction.amount * platformFeePercent) / 100);
const payoutAmount = transaction.amount - platformFee;
```

---

## 5. Bank Account Verification

Verify provider bank details before storing:

```typescript
// In FlutterwaveService

async verifyBankAccount(accountNumber: string, bankCode: string) {
  const response = await this.flw.Misc.verify_Account({
    account_number: accountNumber,
    account_bank: bankCode,
  });

  if (response.status !== 'success') {
    throw new BadRequestException('Bank account verification failed');
  }

  return response.data; // { account_name, account_number }
}
```

---

## 6. Test Cards (Sandbox)

Use these in Flutterwave sandbox to simulate different payment outcomes:

| Scenario | Card Number | CVV | Expiry | PIN | OTP |
|----------|------------|-----|--------|-----|-----|
| Successful payment | 5531 8866 5214 2950 | 564 | 09/32 | 3310 | 12345 |
| Failed payment | 5258 5859 2266 6506 | 883 | 09/31 | 3310 | 12345 |
| Insufficient funds | 4187 4274 1556 4246 | 828 | 09/31 | 3310 | 12345 |

Test bank transfer:
- Bank: 044 (Access Bank)
- Account number: 0690000031
- OTP: 12345

---

## 7. Error Handling

```typescript
// ✓ Always wrap Flutterwave calls in try/catch
try {
  const url = await this.flutterwaveService.initiatePayment(payload);
  return { paymentUrl: url };
} catch (error) {
  this.logger.error('Payment initiation error', error);
  throw new InternalServerErrorException(
    'Payment could not be initiated. Please try again later',
  );
}

// ✓ Never expose Flutterwave error messages directly to the client
// ✓ Log the full error internally
// ✓ Return a generic user-friendly message
```

---

## 8. Common Mistakes to Avoid

```
✗ Sending amounts in kobo to Flutterwave — Flutterwave uses naira (divide by 100)
✗ Using the parsed JSON body for webhook signature verification — use raw buffer
✗ Processing a webhook without verifying the FLW-Signature header
✗ Processing the same gatewayRef twice — always check for idempotency
✗ Exposing FLW_SECRET_KEY in frontend code
✗ Calling Flutterwave SDK directly from a controller
✗ Making Flutterwave wait for webhook processing — return 200 immediately
✗ Using floats for money anywhere in the codebase
```

---

## 9. Flutterwave Dashboard Settings (Required)

Before testing or going live, configure in your Flutterwave dashboard:

1. **Webhook URL**: `https://sabipro-api.onrender.com/api/payments/webhook`
2. **Redirect URL**: `https://sabipro.vercel.app/payments/verify`
3. **Webhook events**: Enable `charge.completed`, `transfer.completed`, `transfer.failed`
4. **Webhook secret hash**: Copy to `FLW_WEBHOOK_SECRET` in `.env`