# Stripe Provider - Complete Usage Guide

Stripe is one of the world's most popular payment infrastructure providers. This document contains all the information you need to use Stripe integration within Nitrokit Core.

## Table of Contents

- [Features](#features)
- [Installation and Configuration](#installation-and-configuration)
- [Basic Usage](#basic-usage)
- [Checkout Session Management](#checkout-session-management)
- [Webhook Operations](#webhook-operations)
- [Refund Operations](#refund-operations)
- [Transaction Query](#transaction-query)
- [Test Environment](#test-environment)
- [Security](#security)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)

## Features

✅ **Hosted Checkout**: Stripe's ready-made payment page  
✅ **Multi-Currency**: 135+ currency support  
✅ **Webhook Verification**: Secure event verification  
✅ **Refund Support**: Full and partial refund operations  
✅ **Test Mode**: Safe testing with sandbox environment  
✅ **TypeScript**: Full type support  
✅ **SCA Ready**: Strong Customer Authentication (PSD2)  
✅ **Global Payment Methods**: Card, Apple Pay, Google Pay, SEPA and more

## Installation and Configuration

### 1. Creating Stripe Account

1. Open a free account at [stripe.com](https://stripe.com)
2. Log in to Dashboard
3. Get your test and production keys from API keys section

### 2. Setting Up Environment Variables

Create your `.env` file and add your Stripe credentials:

```env
# Stripe API Credentials (Required)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhook Secret (Important!)
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional Settings
STRIPE_API_VERSION=2024-11-20.acacia
STRIPE_TEST=1  # Test mode: 1 or true
```

> **Note:**
>
> - Test keys start with `sk_test_` and `pk_test_`
> - Production keys start with `sk_live_` and `pk_live_`
> - You can get webhook secret from Stripe Dashboard > Developers > Webhooks

### 3. Setting Up Webhook in Stripe Dashboard

1. Stripe Dashboard > **Developers** > **Webhooks**
2. Click **Add endpoint** button
3. Endpoint URL: `https://yourdomain.com/api/payment/webhook`
4. Events to listen to:
    - `checkout.session.completed`
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `charge.refunded`
5. Copy webhook signing secret and add to `.env` file

## Basic Usage

### Simple Payment Creation

```typescript
import { PaymentService, StripeProvider } from '@nitrokit/core/services/payment';

// Initialize provider (automatically reads from .env)
const stripeProvider = new StripeProvider();

// Create payment service
const paymentService = new PaymentService(stripeProvider);

// Create payment request
const result = await paymentService.createPayment({
    orderId: 'ORDER-12345', // Unique order ID
    amount: 10000, // $100.00 (in cents)
    email: 'customer@example.com', // Customer email
    successUrl: 'https://yoursite.com/payment/success',
    failUrl: 'https://yoursite.com/payment/cancel'
});

// Check result and redirect
if (result.success) {
    console.log('Checkout Session ID:', result.token);
    console.log('Payment URL:', result.paymentUrl);

    // Redirect user to Stripe Checkout page
    window.location.href = result.paymentUrl!;
} else {
    console.error('Error:', result.reason);
    console.error('Error code:', result.errorCode);
}
```

### Detailed Payment Creation

```typescript
const result = await paymentService.createPayment({
    // Required Fields
    orderId: 'ORDER-12345',
    amount: 29900, // $299.00
    email: 'customer@example.com',
    successUrl: 'https://yoursite.com/success?session_id={CHECKOUT_SESSION_ID}',
    failUrl: 'https://yoursite.com/cancel',

    // Optional Fields
    userName: 'John Doe',
    userPhone: '+1234567890',
    currency: 'USD', // USD, EUR, GBP, TRY, etc.

    // Basket information (product list)
    basket: [
        { name: 'Premium Subscription', price: 20000, quantity: 1 },
        { name: 'Extra Features', price: 9900, quantity: 1 }
    ]
});
```

## Checkout Session Management

### Basket Format

```typescript
interface PaymentBasketItem {
    name: string; // Product name
    price: number; // Unit price (in cents/kuruş)
    quantity: number; // Quantity
}
```

### Example: E-commerce Basket

```typescript
const basket = [
    {
        name: 'MacBook Pro 14"',
        price: 199900, // $1,999.00
        quantity: 1
    },
    {
        name: 'USB-C Cable',
        price: 1900, // $19.00
        quantity: 2
    }
];

const result = await paymentService.createPayment({
    orderId: 'ORDER-789',
    amount: 203700, // Total: $1999 + ($19 x 2) = $2,037.00
    email: 'customer@example.com',
    successUrl: 'https://yoursite.com/success',
    failUrl: 'https://yoursite.com/cancel',
    currency: 'USD',
    basket: basket
});
```

### Currencies

Stripe supports 135+ currencies. Most common ones:

| Currency      | Code | Example Amount                |
| ------------- | ---- | ----------------------------- |
| US Dollar     | USD  | 10000 = $100.00               |
| Euro          | EUR  | 10000 = €100.00               |
| British Pound | GBP  | 10000 = £100.00               |
| Turkish Lira  | TRY  | 10000 = ₺100.00               |
| Japanese Yen  | JPY  | 10000 = ¥10,000 (no decimals) |

> **Note:** Japanese Yen (JPY) and similar currencies don't use decimals.

## Webhook Operations

Webhooks are real-time notifications from Stripe. They should be used to securely verify payment status.

### Next.js API Route Example

```typescript
// app/api/payment/webhook/route.ts
import { PaymentService, StripeProvider } from '@nitrokit/core/services/payment';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        // Verify webhook (use Stripe SDK in production)
        // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

        const payload = JSON.parse(body);
        const paymentService = new PaymentService(new StripeProvider());

        // Process based on event type
        switch (payload.type) {
            case 'checkout.session.completed': {
                const session = payload.data.object;

                // Payment successful - complete order
                await completeOrder(session.client_reference_id, {
                    sessionId: session.id,
                    paymentIntentId: session.payment_intent,
                    amountTotal: session.amount_total,
                    currency: session.currency,
                    customerEmail: session.customer_details.email
                });

                console.log(`✅ Payment successful: ${session.client_reference_id}`);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = payload.data.object;

                // Payment failed
                await failOrder(
                    paymentIntent.metadata.order_id,
                    paymentIntent.last_payment_error?.message
                );

                console.log(`❌ Payment failed: ${paymentIntent.metadata.order_id}`);
                break;
            }

            case 'charge.refunded': {
                const charge = payload.data.object;

                // Refund processed
                await handleRefund(charge.metadata.order_id, charge.amount_refunded);

                console.log(`💰 Refund processed: ${charge.metadata.order_id}`);
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
    }
}

async function completeOrder(orderId: string, paymentData: any) {
    // Complete order in your database
}

async function failOrder(orderId: string, reason: string) {
    // Mark order as failed
}

async function handleRefund(orderId: string, amount: number) {
    // Record refund transaction
}
```

### Express.js Example

```typescript
import express from 'express';
import { PaymentService, StripeProvider } from '@nitrokit/core/services/payment';

const app = express();

// Webhook requires RAW body (don't use JSON middleware!)
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];

    try {
        // Verify with Stripe SDK
        // const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

        const payload = JSON.parse(req.body.toString());

        if (payload.type === 'checkout.session.completed') {
            const session = payload.data.object;
            await completeOrder(session.client_reference_id);
        }

        res.json({ received: true });
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});
```

### Webhook Event Types

| Event                                      | Description                                   |
| ------------------------------------------ | --------------------------------------------- |
| `checkout.session.completed`               | Checkout successfully completed               |
| `checkout.session.async_payment_succeeded` | Async payment successful (bank transfer etc.) |
| `payment_intent.succeeded`                 | Payment Intent successful                     |
| `payment_intent.payment_failed`            | Payment failed                                |
| `charge.refunded`                          | Refund processed                              |
| `charge.dispute.created`                   | Chargeback created                            |

## Refund Operations

### Full Refund

```typescript
const refundResult = await paymentService.refund({
    orderId: 'pi_1234567890' // Payment Intent ID
});

console.log('Refund status:', refundResult);
```

### Partial Refund

```typescript
// Refund $50.00 from $299.00 payment
const refundResult = await paymentService.refund({
    orderId: 'pi_1234567890',
    amount: 5000 // $50.00 (in cents)
});

if (refundResult.status === 'succeeded') {
    console.log('Refund successful');
} else {
    console.error('Refund failed:', refundResult);
}
```

### Refund Rules

- ⚠️ Refund can be made after successful payment
- ⚠️ Partial refund can be made multiple times (without exceeding total amount)
- ⚠️ Refund time may take 5-10 business days depending on bank/card
- ⚠️ Stripe fee is not refunded (except dispute cases)

## Transaction Query

Query the status of a payment:

```typescript
// Query with Payment Intent ID
const transaction = await paymentService.queryTransaction('pi_1234567890');

// or with Checkout Session ID
const session = await paymentService.queryTransaction('cs_test_1234567890');

console.log('Transaction status:', transaction);
```

### Example Payment Intent Result

```json
{
    "id": "pi_1234567890",
    "object": "payment_intent",
    "amount": 10000,
    "currency": "usd",
    "status": "succeeded",
    "created": 1700000000,
    "payment_method": "pm_1234567890"
}
```

### Example Checkout Session Result

```json
{
    "id": "cs_test_1234567890",
    "object": "checkout.session",
    "payment_status": "paid",
    "amount_total": 10000,
    "currency": "usd",
    "customer_email": "customer@example.com",
    "payment_intent": "pi_1234567890"
}
```

## Test Environment

### Activating Test Mode

**Method 1: Environment variable**

```env
STRIPE_TEST=1
STRIPE_SECRET_KEY=sk_test_...
```

**Method 2: Constructor**

```typescript
const provider = new StripeProvider({
    secretKey: 'sk_test_...',
    publishableKey: 'pk_test_...',
    webhookSecret: 'whsec_test_...',
    testMode: true
});
```

### Test Cards

Cards you can use in Stripe test environment:

| Scenario                       | Card Number         | Result             |
| ------------------------------ | ------------------- | ------------------ |
| Successful payment             | 4242 4242 4242 4242 | Successful         |
| Successful payment (3D Secure) | 4000 0027 6000 3184 | Requires 3D Secure |
| Insufficient funds             | 4000 0000 0000 9995 | Declined           |
| Card declined                  | 4000 0000 0000 0002 | Generic decline    |
| CVV error                      | 4000 0000 0000 0127 | CVV check fails    |
| Expiry date error              | 4000 0000 0000 0069 | Expired card       |

**Other information:**

- Expiry date: Any future date (e.g., 12/26)
- CVV: Any 3-digit number (e.g., 123)
- ZIP: Any 5-digit number (e.g., 12345)

### Test vs Production Differences

- Real money transfers are not made in test mode
- Test cards only work in test mode
- Test webhooks can be simulated with Stripe CLI
- Test API keys start with `sk_test_`

## Security

### Protecting API Keys

```typescript
// ❌ WRONG: Don't use secret key on client-side
const provider = new StripeProvider({
    secretKey: 'sk_live_hardcoded' // Dangerous!
});

// ✅ CORRECT: Use env on server-side
const provider = new StripeProvider(); // Automatically reads from .env
```

### Using Publishable Key

Use only publishable key on client-side:

```typescript
// Client-side (React example)
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
```

### Webhook Signature Verification

Always verify webhook signature in production:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const event = stripe.webhooks.constructEvent(
    requestBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
);
```

### HTTPS Requirement

Always use HTTPS in production environment:

```typescript
// ✅ CORRECT
successUrl: 'https://yoursite.com/success';

// ❌ WRONG (in production)
successUrl: 'http://yoursite.com/success';
```

## Error Handling

### Validation Errors

```typescript
try {
    const result = await paymentService.createPayment({
        orderId: '', // Invalid
        amount: -100, // Invalid
        email: 'not-email', // Invalid
        successUrl: 'invalid',
        failUrl: 'invalid'
    });
} catch (error) {
    if (error instanceof Error) {
        console.error('Validation error:', error.message);
    }
}
```

### API Errors

```typescript
const result = await paymentService.createPayment(params);

if (!result.success) {
    console.error('API Error:', result.reason);
    console.error('Error Code:', result.errorCode);
    console.error('Raw response:', result.raw);

    // Show to user
    if (result.errorCode === 'invalid_api_key') {
        alert('Configuration error. Please contact support.');
    } else {
        alert(`Payment failed: ${result.reason}`);
    }
}
```

### Common Errors and Solutions

| Error                                   | Cause                   | Solution                |
| --------------------------------------- | ----------------------- | ----------------------- |
| `invalid_api_key`                       | Wrong API key           | Check API key           |
| `Invalid email format`                  | Invalid email           | Fix email format        |
| `Amount must be positive`               | Negative amount         | Send positive value     |
| `payment_method_not_available`          | Payment method disabled | Activate from Dashboard |
| `webhook signature verification failed` | Wrong webhook secret    | Check webhook secret    |

## Advanced Usage

### Manual Configuration

```typescript
const provider = new StripeProvider({
    secretKey: process.env.CUSTOM_STRIPE_KEY,
    publishableKey: process.env.CUSTOM_STRIPE_PK,
    webhookSecret: process.env.CUSTOM_WEBHOOK_SECRET,
    apiVersion: '2024-11-20.acacia',
    testMode: process.env.NODE_ENV !== 'production'
});
```

### Getting Publishable Key

When you need publishable key for client-side:

```typescript
const provider = new StripeProvider();
const publishableKey = provider.getPublishableKey();

// Send to client
res.json({ publishableKey });
```

### TypeScript Types

```typescript
import type {
    PaymentProvider,
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentCallback,
    RefundRequest,
    PaymentBasketItem
} from '@nitrokit/core/services/payment';

async function handlePayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const service = new PaymentService(new StripeProvider());
    return service.createPayment(request);
}
```

### Stripe Elements Integration

Use Stripe Elements for more customized payment form:

```typescript
// Client-side
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...');

function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

## Frequently Asked Questions (FAQ)

### What is the Checkout Session expiration time?

24 hours. Unused sessions expire after this time.

### How to activate other payment methods?

You can activate them from Stripe Dashboard > Settings > Payment methods:

- Apple Pay / Google Pay
- SEPA Direct Debit
- Bank transfers
- Buy now, pay later (Klarna, Afterpay)

### Are subscription payments supported?

This provider is designed for one-time payments. Use Stripe's Billing API for subscriptions.

### What to do if webhook doesn't arrive?

1. Check your endpoint from Stripe Dashboard > Developers > Webhooks
2. Test webhook events (Send test webhook button)
3. Make sure your server is accessible
4. Check firewall rules
5. Test locally with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`

### How to make multi-currency payments?

Change the `currency` parameter:

```typescript
createPayment({
    // ...
    currency: 'EUR' // or 'GBP', 'TRY', etc.
});
```

## Using Stripe CLI

Stripe CLI is very useful for local development:

```bash
# Installation
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Listen to webhooks
stripe listen --forward-to localhost:3000/api/payment/webhook

# Send test event
stripe trigger checkout.session.completed
```

## Support and Contact

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Support**: https://support.stripe.com
- **Nitrokit Issues**: https://github.com/nitrokit/nitrokit-core/issues

## Changelog

### v1.0.0 (2025-11-19)

- ✅ First stable release
- ✅ Checkout Session support
- ✅ Webhook verification
- ✅ Refund and query support
- ✅ Multi-currency support
- ✅ Test mode
- ✅ TypeScript types

## License

MIT License - See [LICENSE](../../../../LICENSE) file for details.

---

**Note:** This documentation is written for Stripe API version 2024-11-20. This documentation will be updated when there are changes in Stripe API.
