# Payment Service

Nitrokit Core's modular payment service. Allows you to use different payment providers (PayTR, Iyzico, etc.) through a single interface.

## Features

- ✅ **Multiple provider support**: PayTR, Stripe, and more in the future
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Basket validation**: Automatic product basket validation and formatting
- ✅ **Callback verification**: HMAC-based secure callback (IPN) verification
- ✅ **Refund and query**: Payment refund and transaction query support
- ✅ **Test mode**: Sandbox/test environment support
- ✅ **Comprehensive tests**: 100% test coverage

## Installation

```bash
pnpm add @nitrokit/core
# or
npm install @nitrokit/core
# or
yarn add @nitrokit/core
```

## Supported Payment Providers

| Provider   | Status     | Documentation                      |
| ---------- | ---------- | ---------------------------------- |
| **PayTR**  | ✅ Active  | [PayTR.md](./providers/PayTR.md)   |
| **Stripe** | ✅ Active  | [Stripe.md](./providers/Stripe.md) |
| **Iyzico** | 🚧 Planned | Coming soon                        |

## Quick Start

### 1. Setting Up Environment Variables

Create your `.env` file:

```env
# For PayTR
PAYTR_MERCHANT_ID=your_merchant_id
PAYTR_KEY=your_merchant_key
PAYTR_SALT=your_merchant_salt
PAYTR_TEST=1  # Test mode
```

### 2. Basic Usage

```typescript
import { PaymentService, PayTRProvider } from '@nitrokit/core/services/payment';

// Create provider and service
const paymentService = new PaymentService(new PayTRProvider());

// Create payment
const result = await paymentService.createPayment({
    orderId: 'ORDER-12345',
    amount: 10000, // 100.00 TRY (in kuruş)
    email: 'customer@example.com',
    successUrl: 'https://yoursite.com/success',
    failUrl: 'https://yoursite.com/fail',
    basket: [{ name: 'Product 1', price: 10000, quantity: 1 }]
});

if (result.success) {
    // Redirect user to payment page
    window.location.href = result.paymentUrl!;
}
```

### 3. Callback Verification

```typescript
// Next.js API Route example
app.post('/api/payment/callback', (req, res) => {
    const paymentService = new PaymentService(new PayTRProvider());

    const isValid = paymentService.verifyCallback({
        orderId: req.body.merchant_oid,
        status: req.body.status,
        amount: req.body.total_amount,
        hash: req.body.hash
    });

    if (isValid && req.body.status === 'success') {
        // Payment successful - complete order
        res.send('OK');
    } else {
        res.status(400).send('FAIL');
    }
});
```

## API Reference

### PaymentService

Main service class. Manages all payment operations.

```typescript
class PaymentService {
    constructor(provider: PaymentProvider);

    // Create payment
    async createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse>;

    // Verify callback
    verifyCallback(payload: PaymentCallback): boolean;

    // Process refund
    async refund(params: RefundRequest): Promise<any>;

    // Query transaction
    async queryTransaction(orderId: string): Promise<any>;

    // Switch provider
    setProvider(provider: PaymentProvider): void;

    // Get provider name
    getProviderName(): string;
}
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
```

## Detailed Documentation

Detailed usage guides for each provider:

- **[PayTR Documentation](./providers/PayTR.md)** - Installation, usage, callback handling, test cards and more
- **[Stripe Documentation](./providers/Stripe.md)** - Checkout Session, webhooks, multi-currency and more
- **Iyzico** - Coming soon

## Architecture

```
PaymentService (Main Service)
    │
    ├── PaymentProvider (Interface)
    │   ├── PayTRProvider
    │   ├── StripeProvider
    │   └── IyzicoProvider (planned)
    │
    └── Types (Common types)
        ├── CreatePaymentRequest
        ├── CreatePaymentResponse
        ├── PaymentCallback
        └── RefundRequest
```

## Examples

### Provider Switching

```typescript
const service = new PaymentService(new PayTRProvider());

// Current provider
console.log(service.getProviderName()); // "PayTR"

// Switch provider
service.setProvider(new StripeProvider());
console.log(service.getProviderName()); // "Stripe"
```

### Refund Operation

```typescript
// Full refund
await paymentService.refund({ orderId: 'ORDER-123' });

// Partial refund
await paymentService.refund({
    orderId: 'ORDER-123',
    amount: 5000 // 50.00 TRY/USD
});
```

### Transaction Query

```typescript
const transaction = await paymentService.queryTransaction('ORDER-123');
console.log(transaction);
```

## Security

- ⚠️ **Never** send API credentials to client-side
- ⚠️ Always verify callback (HMAC hash check)
- ⚠️ Keep environment variables in `.env` file
- ⚠️ Use HTTPS in production
- ⚠️ Add `.env` file to `.gitignore`

## Test Mode

In test mode:

- Real money transfers are not made
- Test cards are used
- Sandbox environment is active

```typescript
const provider = new PayTRProvider({ testMode: true });
```

or

```env
PAYTR_TEST=1
```

## Contributing

To add a new provider, implement the `PaymentProvider` interface:

```typescript
export class YourProvider implements PaymentProvider {
    readonly name = 'YourProvider';

    async createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse> {
        // Implementation
    }

    verifyCallback(payload: PaymentCallback): boolean {
        // Implementation
    }

    async refund(params: RefundRequest): Promise<any> {
        // Implementation
    }

    async queryTransaction(orderId: string): Promise<any> {
        // Implementation
    }
}
```

## Support

- **GitHub Issues**: [nitrokit/nitrokit-core/issues](https://github.com/nitrokit/nitrokit-core/issues)
- **Documentation**: See provider-specific documentation in this folder

## License

MIT License - See [LICENSE](../../../LICENSE) file for details.
