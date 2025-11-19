import crypto from 'crypto';
import type {
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentBasketItem,
    PaymentCallback,
    PaymentProvider,
    RefundRequest
} from '../types';

type PayTRConfig = {
    merchantId?: string;
    merchantKey?: string;
    merchantSalt?: string;
    apiBase?: string;
    testMode?: boolean;
};

type PayTRCreateResponse = {
    status: string;
    token?: string;
    reason?: string;
    reason_code?: string | number;
};

/**
 * PayTR payment provider implementation.
 *
 * Features:
 * - Token-based payment creation with 3D Secure support
 * - Callback (IPN) verification with HMAC
 * - Refund and transaction query support
 * - User basket with proper validation
 * - Test mode support
 *
 * Configuration via environment variables:
 * - PAYTR_MERCHANT_ID: Your merchant ID
 * - PAYTR_KEY: Merchant secret key (for HMAC)
 * - PAYTR_SALT: Merchant salt (for additional hash calculations)
 * - PAYTR_API_BASE: API base URL (default: https://www.paytr.com)
 * - PAYTR_TEST: Set to '1' or 'true' for test mode
 */
export class PayTRProvider implements PaymentProvider {
    public readonly name = 'PayTR';

    private readonly merchantId: string;
    private readonly merchantKey: string;
    private readonly merchantSalt: string;
    private readonly apiBase: string;
    private readonly testMode: boolean;

    constructor(config?: PayTRConfig) {
        this.merchantId = config?.merchantId ?? process.env.PAYTR_MERCHANT_ID ?? '';
        this.merchantKey = config?.merchantKey ?? process.env.PAYTR_KEY ?? '';
        this.merchantSalt = config?.merchantSalt ?? process.env.PAYTR_SALT ?? '';
        this.apiBase = config?.apiBase ?? process.env.PAYTR_API_BASE ?? 'https://www.paytr.com';
        this.testMode =
            config?.testMode ??
            (process.env.PAYTR_TEST === '1' || process.env.PAYTR_TEST === 'true');

        if (!this.merchantId || !this.merchantKey) {
            throw new Error(
                'PayTR configuration missing: merchantId and merchantKey are required.'
            );
        }
    }

    private hmacBase64(message: string): string {
        return crypto.createHmac('sha256', this.merchantKey).update(message).digest('base64');
    }

    /**
     * Validate and convert basket items to PayTR format
     * PayTR expects: base64(JSON.stringify([[name, price, qty], [name, price, qty], ...]))
     */
    private encodeBasket(items: PaymentBasketItem[]): string {
        if (!items || items.length === 0) {
            return Buffer.from(JSON.stringify([['Ürün', '1.00', 1]])).toString('base64');
        }

        // Validate and convert each item
        const formatted = items.map((item) => {
            if (!item.name || typeof item.name !== 'string') {
                throw new Error('Basket item name is required and must be a string');
            }
            if (typeof item.price !== 'number' || item.price < 0) {
                throw new Error('Basket item price must be a positive number');
            }
            if (typeof item.quantity !== 'number' || item.quantity < 1) {
                throw new Error('Basket item quantity must be at least 1');
            }

            // Convert kuruş to TRY string format (e.g., 10000 kuruş -> "100.00" TRY)
            const priceInTRY = (item.price / 100).toFixed(2);

            return [item.name.substring(0, 100), priceInTRY, item.quantity];
        });

        return Buffer.from(JSON.stringify(formatted)).toString('base64');
    }

    /**
     * Validate payment request parameters
     */
    private validatePaymentRequest(params: CreatePaymentRequest): void {
        if (!params.orderId || typeof params.orderId !== 'string') {
            throw new Error('Order ID is required and must be a string');
        }
        if (typeof params.amount !== 'number' || params.amount < 1) {
            throw new Error('Amount must be a positive number (in kuruş)');
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
     * Create a payment token and return payment URL
     */
    public async createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse> {
        this.validatePaymentRequest(params);

        const rand = Math.random().toString(36).substring(2, 12);
        const userIp = params.userIp ?? '127.0.0.1';
        const amountStr = String(params.amount);

        // PayTR hash formula: merchant_id + merchant_oid + amount + success_url + fail_url + rand
        const hashInput = `${this.merchantId}${params.orderId}${amountStr}${params.successUrl}${params.failUrl}${rand}`;
        const hash = this.hmacBase64(hashInput);

        // Encode basket
        const userBasket = params.basket ? this.encodeBasket(params.basket) : this.encodeBasket([]);

        const body: Record<string, unknown> = {
            merchant_id: this.merchantId,
            merchant_oid: params.orderId,
            user_ip: userIp,
            merchant_ok_url: params.successUrl,
            merchant_fail_url: params.failUrl,
            payment_amount: params.amount,
            email: params.email,
            user_name: params.userName ?? '',
            user_address: params.userAddress ?? '',
            user_phone: params.userPhone ?? '',
            currency: params.currency ?? 'TRY',
            user_basket: userBasket,
            paytr_token: hash,
            debug_on: this.testMode ? 1 : 0,
            no_installment: params.installment === 0 ? 1 : 0,
            max_installment: params.installment || 0,
            rand: rand,
            lang: 'tr'
        };

        // Remove undefined/empty values
        Object.keys(body).forEach((k) => {
            if (body[k] === undefined || body[k] === '') {
                delete body[k];
            }
        });

        try {
            const url = `${this.apiBase}/odeme/api/get-token`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(body as Record<string, string>).toString()
            });

            if (!res.ok) {
                const text = await res.text();
                return {
                    success: false,
                    reason: `PayTR API error: ${res.status} ${res.statusText}`,
                    raw: text
                };
            }

            const data = (await res.json()) as PayTRCreateResponse;

            if (data.status === 'success' && data.token) {
                return {
                    success: true,
                    token: data.token,
                    paymentUrl: `https://www.paytr.com/odeme/guvenli/${data.token}`,
                    raw: data
                };
            }

            return {
                success: false,
                reason: data.reason || 'Unknown error',
                errorCode: data.reason_code,
                raw: data
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
     * Verify payment callback (IPN) from PayTR
     * Hash formula: merchant_id + merchant_oid + status + total_amount + merchant_salt
     */
    public verifyCallback(payload: PaymentCallback): boolean {
        try {
            if (!payload.orderId || !payload.status || !payload.amount || !payload.hash) {
                return false;
            }

            const total = String(payload.amount);
            const input = `${this.merchantId}${payload.orderId}${payload.status}${total}${this.merchantSalt}`;
            const expected = this.hmacBase64(input);

            return expected === payload.hash;
        } catch {
            return false;
        }
    }

    /**
     * Request a refund for a transaction
     */
    public async refund(params: RefundRequest): Promise<any> {
        if (!params.orderId) {
            throw new Error('Order ID is required for refund');
        }

        const refundAmount = params.amount ? String(params.amount) : '';
        const input = `${this.merchantId}${params.orderId}${refundAmount}${this.merchantSalt}`;
        const hash = this.hmacBase64(input);

        const body: Record<string, unknown> = {
            merchant_id: this.merchantId,
            merchant_oid: params.orderId,
            refund_amount: refundAmount || undefined,
            paytr_token: hash
        };

        Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

        const url = `${this.apiBase}/odeme/api/refund`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(body as Record<string, string>).toString()
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(
                `PayTR refund request failed: ${res.status} ${res.statusText} - ${text}`
            );
        }

        return res.json();
    }

    /**
     * Query transaction details
     */
    public async queryTransaction(orderId: string): Promise<any> {
        if (!orderId) {
            throw new Error('Order ID is required for transaction query');
        }

        const input = `${this.merchantId}${orderId}${this.merchantSalt}`;
        const hash = this.hmacBase64(input);

        const body = {
            merchant_id: this.merchantId,
            merchant_oid: orderId,
            paytr_token: hash
        };

        const url = `${this.apiBase}/odeme/api/get-payment`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(body).toString()
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(
                `PayTR get-payment request failed: ${res.status} ${res.statusText} - ${text}`
            );
        }

        return res.json();
    }
}

export default PayTRProvider;
