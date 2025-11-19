# PayTR Provider - Complete Usage Guide

PayTR is one of Turkey's leading payment infrastructure providers. This document contains all the information you need to use PayTR integration within Nitrokit Core.

## Table of Contents

- [Features](#features)
- [Installation and Configuration](#installation-and-configuration)
- [Basic Usage](#basic-usage)
- [Basket Management](#basket-management)
- [Callback (IPN) Operations](#callback-ipn-operations)
- [Refund Operations](#refund-operations)
- [Transaction Query](#transaction-query)
- [Test Environment](#test-environment)
- [Security](#security)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)

## Features

✅ **3D Secure Support**: Secure payment transactions  
✅ **Installment Options**: Installment/non-installment payment  
✅ **Basket Validation**: Automatic product basket validation  
✅ **HMAC Security**: SHA-256 based callback verification  
✅ **Refund Support**: Full and partial refund operations  
✅ **Test Mode**: Safe testing with sandbox environment  
✅ **TypeScript**: Full type support  
✅ **Multi-Currency**: TRY, USD, EUR support

## Installation and Configuration

### 1. Package Installation

```bash
pnpm add @nitrokit/core
# or
npm install @nitrokit/core
# or
yarn add @nitrokit/core
```

### 2. Setting Up Environment Variables

Create your `.env` file and add your PayTR credentials:

```env
# PayTR API Credentials (Required)
PAYTR_MERCHANT_ID=123456
PAYTR_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
PAYTR_SALT=xxxxxxxxxxxxxxxxxxxxxxxx

# Optional Settings
PAYTR_API_BASE=https://www.paytr.com
PAYTR_TEST=1  # Test mode: 1 or true
```

> **Note:** You can get this information from your PayTR account. Access them from Merchant Panel > Integration Settings section.

### 3. Required Settings in PayTR Account

1. Create a merchant account on PayTR
2. From **Integration Settings** section, get:
    - Merchant ID
    - Merchant Key
    - Merchant Salt
3. Set **Callback URL** (IPN): `https://yourdomain.com/api/payment/callback`
4. Define **Success/Fail URL** formats

## Basic Usage

### Simple Payment Creation

```typescript
import { PaymentService, PayTRProvider } from '@nitrokit/core/services/payment';

// Initialize provider (automatically reads from .env)
const paytrProvider = new PayTRProvider();

// Create payment service
const paymentService = new PaymentService(paytrProvider);

// Create payment request
const result = await paymentService.createPayment({
    orderId: 'ORDER-12345', // Unique order ID
    amount: 10000, // 100.00 TRY (in kuruş)
    email: 'customer@example.com', // Customer email
    successUrl: 'https://yoursite.com/payment/success',
    failUrl: 'https://yoursite.com/payment/fail'
});

// Check result and redirect
if (result.success) {
    console.log('Payment token:', result.token);
    console.log('Payment URL:', result.paymentUrl);

    // Redirect user to PayTR payment page
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
    amount: 25000, // 250.00 TRY
    email: 'customer@example.com',
    successUrl: 'https://yoursite.com/payment/success',
    failUrl: 'https://yoursite.com/payment/fail',

    // Optional Fields
    userName: 'John Doe',
    userPhone: '5551234567',
    userAddress: 'Main Street No:1 Istanbul',
    userIp: '192.168.1.1',
    currency: 'TRY', // TRY, USD, EUR
    installment: 3, // Max installment count (0 = no installment)

    // Basket information
    basket: [
        { name: 'Premium Membership', price: 20000, quantity: 1 },
        { name: 'Extra Feature', price: 5000, quantity: 1 }
    ]
});
```

## Basket Management

Basket information is shown to the customer on the payment page and is important for fraud tracking.

### Basket Format

```typescript
interface PaymentBasketItem {
    name: string; // Product name (max 100 characters)
    price: number; // Unit price (in kuruş)
    quantity: number; // Quantity (minimum 1)
}
```

### Example: E-commerce Basket

```typescript
const basket = [
    {
        name: 'iPhone 15 Pro Max 256GB',
        price: 5499900, // 54,999.00 TRY
        quantity: 1
    },
    {
        name: 'AirPods Pro 2nd Gen',
        price: 1099900, // 10,999.00 TRY
        quantity: 1
    },
    {
        name: 'USB-C Cable',
        price: 9900, // 99.00 TRY
        quantity: 2
    }
];

const result = await paymentService.createPayment({
    orderId: 'ORDER-789',
    amount: 66098100, // Total: 54999 + 10999 + (99 x 2) = 66,098.00 TRY
    email: 'customer@example.com',
    successUrl: 'https://yoursite.com/success',
    failUrl: 'https://yoursite.com/fail',
    basket: basket
});
```

### Basket Validation

PayTR provider automatically checks:

- ✅ `name` cannot be empty and must be string
- ✅ `price` must be a positive number
- ✅ `quantity` must be at least 1
- ✅ Product name is limited to 100 characters
- ✅ Prices are automatically converted to TRY format (`"100.00"`)
- ✅ If basket is empty, a placeholder product is automatically added

### Format Sent to PayTR

```typescript
// Your basket:
[
    { name: 'Product 1', price: 10000, quantity: 1 },
    { name: 'Product 2', price: 5000, quantity: 2 }
];

// Format sent to PayTR:
base64(
    JSON.stringify([
        ['Product 1', '100.00', 1],
        ['Product 2', '50.00', 2]
    ])
);
```

## Callback (IPN) Operations

Callback (Instant Payment Notification) is the notification PayTR sends for you to verify the payment result on your server.

### Next.js API Route Example

```typescript
// app/api/payment/callback/route.ts
import { PaymentService, PayTRProvider } from '@nitrokit/core/services/payment';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Create payment service
        const paymentService = new PaymentService(new PayTRProvider());

        // Verify callback
        const isValid = paymentService.verifyCallback({
            orderId: body.merchant_oid,
            status: body.status,
            amount: body.total_amount,
            hash: body.hash
        });

        if (!isValid) {
            console.error('Invalid callback hash!');
            return NextResponse.json({ error: 'Invalid hash' }, { status: 400 });
        }

        // Check payment status
        if (body.status === 'success') {
            // Payment successful - complete order
            await completeOrder(body.merchant_oid, {
                paymentId: body.payment_id,
                amount: body.total_amount,
                cardType: body.card_type,
                installment: body.installment
            });

            console.log(`✅ Payment successful: ${body.merchant_oid}`);
            return NextResponse.json({ status: 'OK' });
        } else {
            // Payment failed
            await failOrder(body.merchant_oid, body.failed_reason_msg);

            console.log(`❌ Payment failed: ${body.merchant_oid}`);
            return NextResponse.json({ status: 'FAIL' });
        }
    } catch (error) {
        console.error('Callback error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

async function completeOrder(orderId: string, paymentData: any) {
    // Complete order in your database
    // await db.orders.update({ id: orderId }, { status: 'paid', paymentData });
}

async function failOrder(orderId: string, reason: string) {
    // Mark order as failed in your database
    // await db.orders.update({ id: orderId }, { status: 'failed', failReason: reason });
}
```

### Express.js Example

```typescript
import express from 'express';
import { PaymentService, PayTRProvider } from '@nitrokit/core/services/payment';

const app = express();
app.use(express.json());

app.post('/api/payment/callback', async (req, res) => {
    const paymentService = new PaymentService(new PayTRProvider());

    const isValid = paymentService.verifyCallback({
        orderId: req.body.merchant_oid,
        status: req.body.status,
        amount: req.body.total_amount,
        hash: req.body.hash
    });

    if (!isValid) {
        return res.status(400).send('FAIL');
    }

    if (req.body.status === 'success') {
        // Payment successful
        await completeOrder(req.body.merchant_oid);
        res.send('OK');
    } else {
        // Payment failed
        res.send('FAIL');
    }
});
```

### Callback Payload Structure

Callback from PayTR includes:

```typescript
{
  merchant_oid: "ORDER-12345",      // Order ID
  status: "success",                 // success or failed
  total_amount: "100.00",            // Paid amount (TRY)
  hash: "xyz...",                    // HMAC hash (for verification)
  payment_id: "123456789",           // PayTR transaction ID
  card_type: "visa",                 // Card type
  installment: "0",                  // Installment count
  failed_reason_code: "0",           // Error code (if any)
  failed_reason_msg: "",             // Error message (if any)
  test_mode: "0",                    // Test mode
  payment_type: "card"               // Payment type
}
```

### Callback Security

Callback verification formula:

```typescript
hash = base64(
    hmac_sha256(merchant_id + merchant_oid + status + total_amount + merchant_salt, merchant_key)
);
```

> **Important:** Do not approve payment without hash verification!

## Refund Operations

### Full Refund

```typescript
const refundResult = await paymentService.refund({
    orderId: 'ORDER-12345'
});

console.log('Refund status:', refundResult);
```

### Partial Refund

```typescript
// Refund 50.00 TRY from 250.00 TRY payment
const refundResult = await paymentService.refund({
    orderId: 'ORDER-12345',
    amount: 5000 // 50.00 TRY (in kuruş)
});

if (refundResult.status === 'success') {
    console.log('Refund successful');
} else {
    console.error('Refund error:', refundResult.reason);
}
```

### Refund Rules

- ⚠️ Refund can be made after payment is received
- ⚠️ Partial refund can be made multiple times (without exceeding total amount)
- ⚠️ Refund time may take 7-14 days for some bank cards
- ⚠️ PayTR account must have sufficient balance

## Transaction Query

Query the status of a payment:

```typescript
const transaction = await paymentService.queryTransaction('ORDER-12345');

console.log('Transaction status:', transaction);
```

### Example Result

```json
{
    "status": "success",
    "merchant_oid": "ORDER-12345",
    "payment_id": "123456789",
    "payment_status": "success",
    "total_amount": "100.00",
    "card_type": "visa",
    "installment": "0",
    "payment_date": "2025-11-19 14:30:00"
}
```

## Test Environment

### Activating Test Mode

**Method 1: Environment variable**

```env
PAYTR_TEST=1
```

**Method 2: Constructor**

```typescript
const provider = new PayTRProvider({
    merchantId: 'test_merchant',
    merchantKey: 'test_key',
    merchantSalt: 'test_salt',
    testMode: true
});
```

### Test Cards

Cards you can use in PayTR test environment:

| Card Type  | Card Number         | Expiry Date | CVV  | 3D Result  |
| ---------- | ------------------- | ----------- | ---- | ---------- |
| Visa       | 4508 0345 0803 4509 | 12/26       | 000  | Successful |
| Mastercard | 5406 6750 9800 3020 | 12/26       | 000  | Successful |
| Amex       | 3750 001002 00006   | 12/26       | 0000 | Successful |

> **Note:** Real money transfers are not made in test mode.

### Test vs Production Differences

- Transactions in test mode do not appear in your real accounts
- Test callbacks come with `test_mode: "1"` parameter
- Test transactions are listed separately in PayTR reports

## Security

### Protecting Environment Variables

```typescript
// ❌ WRONG: Don't use credentials on client-side
const provider = new PayTRProvider({
    merchantId: 'hardcoded_id', // Dangerous!
    merchantKey: 'hardcoded_key' // Never do this!
});

// ✅ CORRECT: Use env on server-side
const provider = new PayTRProvider(); // Automatically reads from .env
```

### .gitignore Check

```.gitignore
# Environment variables
.env
.env.local
.env.production
```

### HTTPS Requirement

Always use HTTPS in production environment:

```typescript
// ✅ CORRECT
successUrl: 'https://yoursite.com/success';
failUrl: 'https://yoursite.com/fail';

// ❌ WRONG (in production)
successUrl: 'http://yoursite.com/success';
```

### Callback IP Control (Optional)

Accept PayTR callbacks only from PayTR IPs:

```typescript
const PAYTR_IPS = [
    '185.80.111.0/24'
    // Get current IP list from PayTR
];

app.post('/api/payment/callback', (req, res) => {
    const clientIp = req.ip;

    if (!isPayTRIP(clientIp)) {
        return res.status(403).send('Forbidden');
    }

    // Callback processing...
});
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
        // Output: "Order ID is required and must be a string"
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
    alert(`Payment creation failed: ${result.reason}`);
}
```

### Common Errors and Solutions

| Error                     | Cause                   | Solution                      |
| ------------------------- | ----------------------- | ----------------------------- |
| `Invalid hash`            | Wrong merchant key/salt | Check credentials             |
| `Invalid email format`    | Invalid email           | Fix email format              |
| `Amount must be positive` | Negative amount         | Send positive value           |
| `Insufficient balance`    | Insufficient balance    | Load balance to PayTR account |

## Advanced Usage

### Manual Configuration

```typescript
const provider = new PayTRProvider({
    merchantId: process.env.CUSTOM_MERCHANT_ID,
    merchantKey: process.env.CUSTOM_KEY,
    merchantSalt: process.env.CUSTOM_SALT,
    apiBase: 'https://custom.paytr.endpoint',
    testMode: process.env.NODE_ENV !== 'production'
});
```

### Provider Switching

```typescript
const paymentService = new PaymentService(new PayTRProvider());

// Dynamic provider switching
if (userPreference === 'iyzico') {
    paymentService.setProvider(new IyzicoProvider());
}

console.log(paymentService.getProviderName()); // "PayTR" or "Iyzico"
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

function handlePayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const service = new PaymentService(new PayTRProvider());
    return service.createPayment(request);
}
```

### Custom Logger Integration

```typescript
class CustomPayTRProvider extends PayTRProvider {
    async createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse> {
        console.log('[PayTR] Creating payment:', params.orderId);

        const result = await super.createPayment(params);

        if (result.success) {
            console.log('[PayTR] Payment created:', result.token);
        } else {
            console.error('[PayTR] Payment failed:', result.reason);
        }

        return result;
    }
}
```

## Frequently Asked Questions (FAQ)

### How to activate installments?

```typescript
const result = await paymentService.createPayment({
    // ...other fields
    installment: 6 // Max 6 installments
});
```

### How to change currency?

```typescript
const result = await paymentService.createPayment({
    // ...other fields
    currency: 'USD' // or 'EUR'
});
```

### Can real cards be used in test mode?

No, only test cards work in test mode. Real cards must be used in production mode.

### What to do if callback doesn't arrive?

1. Check Callback URL in PayTR panel
2. Make sure your server is accessible from PayTR IPs
3. Check firewall rules
4. Examine your log files

### Payment successful but callback not arriving?

In case of callback error, you can query payment status with `queryTransaction` method:

```typescript
const transaction = await paymentService.queryTransaction('ORDER-12345');
```

## Support and Contact

- **PayTR Documentation**: https://www.paytr.com/
- **PayTR Support**: destek@paytr.com
- **Nitrokit Issues**: https://github.com/nitrokit/nitrokit-core/issues

## Changelog

### v1.0.0 (2025-11-19)

- ✅ First stable release
- ✅ Basket validation
- ✅ HMAC callback verification
- ✅ Refund and query support
- ✅ Test mode
- ✅ TypeScript types

## License

MIT License - See [LICENSE](../../../../LICENSE) file for details.

---

**Note:** This documentation is written for PayTR API v2. This documentation will be updated when there are changes in PayTR API.
