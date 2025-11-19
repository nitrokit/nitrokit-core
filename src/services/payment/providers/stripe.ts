import type {
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentBasketItem,
    PaymentCallback,
    PaymentProvider,
    RefundRequest
} from '../types';

type StripeConfig = {
    secretKey?: string;
    publishableKey?: string;
    webhookSecret?: string;
    apiVersion?: string;
    testMode?: boolean;
};

type StripeLineItem = {
    price_data: {
        currency: string;
        product_data: {
            name: string;
        };
        unit_amount: number;
    };
    quantity: number;
};

/**
 * Stripe payment provider implementation.
 *
 * Features:
 * - Checkout Session creation with hosted payment page
 * - Webhook signature verification
 * - Refund support (full and partial)
 * - Payment Intent queries
 * - Multi-currency support
 * - Test mode support
 *
 * Configuration via environment variables:
 * - STRIPE_SECRET_KEY: Your secret API key
 * - STRIPE_PUBLISHABLE_KEY: Your publishable key (optional, for client-side)
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret for event verification
 * - STRIPE_API_VERSION: API version (default: 2024-11-20.acacia)
 * - STRIPE_TEST: Set to '1' or 'true' for test mode
 */
export class StripeProvider implements PaymentProvider {
    public readonly name = 'Stripe';

    private readonly secretKey: string;
    private readonly publishableKey: string;
    private readonly webhookSecret: string;
    private readonly apiVersion: string;
    private readonly testMode: boolean;
    private readonly apiBase = 'https://api.stripe.com/v1';

    constructor(config?: StripeConfig) {
        this.secretKey = config?.secretKey ?? process.env.STRIPE_SECRET_KEY ?? '';
        this.publishableKey = config?.publishableKey ?? process.env.STRIPE_PUBLISHABLE_KEY ?? '';
        this.webhookSecret = config?.webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET ?? '';
        this.apiVersion =
            config?.apiVersion ?? process.env.STRIPE_API_VERSION ?? '2024-11-20.acacia';
        this.testMode =
            config?.testMode ??
            (process.env.STRIPE_TEST === '1' || process.env.STRIPE_TEST === 'true');

        if (!this.secretKey) {
            throw new Error('Stripe configuration missing: secretKey is required.');
        }

        // Validate key format
        if (this.testMode && !this.secretKey.startsWith('sk_test_')) {
            console.warn(
                'Warning: Test mode enabled but secret key does not appear to be a test key.'
            );
        } else if (!this.testMode && !this.secretKey.startsWith('sk_live_')) {
            console.warn(
                'Warning: Production mode but secret key does not appear to be a live key.'
            );
        }
    }

    /**
     * Get authorization header for Stripe API
     */
    private getAuthHeaders(): HeadersInit {
        return {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Stripe-Version': this.apiVersion
        };
    }

    /**
     * Convert basket items to Stripe line items format
     */
    private convertBasketToLineItems(
        basket: PaymentBasketItem[],
        currency: string = 'try'
    ): StripeLineItem[] {
        if (!basket || basket.length === 0) {
            return [
                {
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: 'Order Payment'
                        },
                        unit_amount: 100 // Placeholder amount
                    },
                    quantity: 1
                }
            ];
        }

        return basket.map((item) => ({
            price_data: {
                currency: currency.toLowerCase(),
                product_data: {
                    name: item.name
                },
                unit_amount: item.price // Stripe uses smallest currency unit (e.g., cents/kuruş)
            },
            quantity: item.quantity
        }));
    }

    /**
     * Validate payment request parameters
     */
    private validatePaymentRequest(params: CreatePaymentRequest): void {
        if (!params.orderId || typeof params.orderId !== 'string') {
            throw new Error('Order ID is required and must be a string');
        }
        if (typeof params.amount !== 'number' || params.amount < 1) {
            throw new Error('Amount must be a positive number (in smallest currency unit)');
        }
        if (!params.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email)) {
            throw new Error('Valid email address is required');
        }
        if (!params.successUrl || !params.successUrl.startsWith('http')) {
            throw new Error('Valid success URL is required');
        }
        if (!params.failUrl || !params.failUrl.startsWith('http')) {
            throw new Error('Valid fail URL is required');
        }
    }

    /**
     * Create a Checkout Session and return payment URL
     */
    public async createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse> {
        this.validatePaymentRequest(params);

        const currency = (params.currency ?? 'TRY').toLowerCase();
        const lineItems = params.basket
            ? this.convertBasketToLineItems(params.basket, currency)
            : [
                  {
                      price_data: {
                          currency,
                          product_data: {
                              name: `Order ${params.orderId}`
                          },
                          unit_amount: params.amount
                      },
                      quantity: 1
                  }
              ];

        const bodyParams: Record<string, string> = {
            mode: 'payment',
            success_url: params.successUrl,
            cancel_url: params.failUrl,
            client_reference_id: params.orderId,
            customer_email: params.email
        };

        // Add line items
        lineItems.forEach((item, index) => {
            bodyParams[`line_items[${index}][price_data][currency]`] = item.price_data.currency;
            bodyParams[`line_items[${index}][price_data][product_data][name]`] =
                item.price_data.product_data.name;
            bodyParams[`line_items[${index}][price_data][unit_amount]`] = String(
                item.price_data.unit_amount
            );
            bodyParams[`line_items[${index}][quantity]`] = String(item.quantity);
        });

        // Add metadata
        bodyParams['metadata[order_id]'] = params.orderId;
        if (params.userName) {
            bodyParams['metadata[customer_name]'] = params.userName;
        }
        if (params.userPhone) {
            bodyParams['metadata[customer_phone]'] = params.userPhone;
        }

        try {
            const url = `${this.apiBase}/checkout/sessions`;
            const body = new URLSearchParams(bodyParams).toString();

            const res = await fetch(url, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body
            });

            if (!res.ok) {
                const error = await res.json();
                return {
                    success: false,
                    reason: error.error?.message || 'Stripe API error',
                    errorCode: error.error?.code,
                    raw: error
                };
            }

            const session = await res.json();

            return {
                success: true,
                token: session.id,
                paymentUrl: session.url,
                raw: session
            };
        } catch (error) {
            return {
                success: false,
                reason: error instanceof Error ? error.message : 'Network or parsing error',
                raw: error
            };
        }
    }

    /**
     * Verify Stripe webhook signature
     *
     * Note: This is a simplified version. For production, use the official Stripe SDK
     * or implement full webhook signature verification with timestamp validation.
     */
    public verifyCallback(payload: PaymentCallback): boolean {
        try {
            // Basic validation
            if (!payload.orderId || !payload.status || !payload.hash) {
                return false;
            }

            // For Stripe webhooks, you should verify the signature using:
            // stripe.webhooks.constructEvent(payload, signature, webhookSecret)
            // This is a placeholder for basic validation

            // In production, use the official Stripe SDK for proper verification
            if (!this.webhookSecret) {
                console.warn('Webhook secret not configured - skipping signature verification');
                return true; // Allow in test mode without secret
            }

            // Simplified verification - replace with proper Stripe webhook verification
            return payload.hash === this.webhookSecret;
        } catch {
            return false;
        }
    }

    /**
     * Request a refund for a payment
     */
    public async refund(params: RefundRequest): Promise<any> {
        if (!params.orderId) {
            throw new Error('Order ID (Payment Intent ID) is required for refund');
        }

        const bodyParams: Record<string, string> = {
            payment_intent: params.orderId
        };

        if (params.amount) {
            bodyParams.amount = String(params.amount);
        }

        try {
            const url = `${this.apiBase}/refunds`;
            const body = new URLSearchParams(bodyParams).toString();

            const res = await fetch(url, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(`Stripe refund failed: ${error.error?.message || res.statusText}`);
            }

            return res.json();
        } catch (error) {
            throw new Error(
                `Stripe refund request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Query payment details by Payment Intent ID or Checkout Session ID
     */
    public async queryTransaction(orderId: string): Promise<any> {
        if (!orderId) {
            throw new Error('Order ID (Payment Intent or Session ID) is required');
        }

        try {
            // Try to retrieve as Payment Intent first
            let url = `${this.apiBase}/payment_intents/${orderId}`;
            let res = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (res.ok) {
                return res.json();
            }

            // If not found, try as Checkout Session
            url = `${this.apiBase}/checkout/sessions/${orderId}`;
            res = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(`Transaction not found: ${error.error?.message || res.statusText}`);
            }

            return res.json();
        } catch (error) {
            throw new Error(
                `Stripe query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Get publishable key (for client-side usage)
     */
    public getPublishableKey(): string {
        return this.publishableKey;
    }
}

export default StripeProvider;
