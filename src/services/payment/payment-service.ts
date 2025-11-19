import type {
    PaymentProvider,
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentCallback,
    RefundRequest
} from './types';

/**
 * Main payment service that supports multiple payment providers
 * (PayTR, Iyzico, etc.)
 *
 * Usage:
 * ```ts
 * import { PaymentService, PayTRProvider } from '@/services/payment';
 *
 * const paytr = new PayTRProvider();
 * const paymentService = new PaymentService(paytr);
 *
 * const result = await paymentService.createPayment({
 *   orderId: 'ORDER-123',
 *   amount: 10000, // 100.00 TRY in kuruş
 *   email: 'customer@example.com',
 *   successUrl: 'https://example.com/success',
 *   failUrl: 'https://example.com/fail',
 *   basket: [
 *     { name: 'Product 1', price: 5000, quantity: 1 },
 *     { name: 'Product 2', price: 5000, quantity: 1 }
 *   ]
 * });
 *
 * if (result.success) {
 *   // Redirect to result.paymentUrl
 * }
 * ```
 */
export class PaymentService {
    private provider: PaymentProvider;

    constructor(provider: PaymentProvider) {
        this.provider = provider;
    }

    /**
     * Get current provider name
     */
    public getProviderName(): string {
        return this.provider.name;
    }

    /**
     * Switch to a different payment provider
     */
    public setProvider(provider: PaymentProvider): void {
        this.provider = provider;
    }

    /**
     * Create a new payment
     */
    public async createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse> {
        return this.provider.createPayment(params);
    }

    /**
     * Verify payment callback (IPN)
     */
    public verifyCallback(payload: PaymentCallback): boolean {
        return this.provider.verifyCallback(payload);
    }

    /**
     * Request a refund
     */
    public async refund(params: RefundRequest): Promise<any> {
        return this.provider.refund(params);
    }

    /**
     * Query transaction details
     */
    public async queryTransaction(orderId: string): Promise<any> {
        return this.provider.queryTransaction(orderId);
    }
}

export default PaymentService;
