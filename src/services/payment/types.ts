/**
 * Common payment types and interfaces for multiple payment providers
 */

/**
 * User basket item structure for payment providers
 */
export interface PaymentBasketItem {
    /** Product name */
    name: string;
    /** Unit price in kuruş (smallest currency unit) */
    price: number;
    /** Quantity */
    quantity: number;
}

/**
 * Common payment request parameters
 */
export interface CreatePaymentRequest {
    /** Unique order/transaction ID from your system */
    orderId: string;
    /** Total amount in kuruş (1 TRY = 100 kuruş) */
    amount: number;
    /** Customer email */
    email: string;
    /** URL to redirect on success */
    successUrl: string;
    /** URL to redirect on failure */
    failUrl: string;
    /** Customer IP address */
    userIp?: string;
    /** User agent string */
    userAgent?: string;
    /** Shopping basket items */
    basket?: PaymentBasketItem[];
    /** Max installment count (0 for no installment) */
    installment?: number;
    /** Currency code (default: TRY) */
    currency?: string;
    /** Customer name */
    userName?: string;
    /** Customer phone */
    userPhone?: string;
    /** Customer address */
    userAddress?: string;
}

/**
 * Standard payment creation response
 */
export interface CreatePaymentResponse {
    /** Success status */
    success: boolean;
    /** Payment token or transaction ID */
    token?: string;
    /** Payment page URL (for redirect) */
    paymentUrl?: string;
    /** Error reason if failed */
    reason?: string;
    /** Provider-specific error code */
    errorCode?: string | number;
    /** Raw provider response */
    raw?: any;
}

/**
 * Payment callback/IPN verification payload
 */
export interface PaymentCallback {
    /** Order ID */
    orderId: string;
    /** Payment status */
    status: string;
    /** Total amount */
    amount: number | string;
    /** Hash/signature for verification */
    hash: string;
    /** Additional provider-specific fields */
    [key: string]: any;
}

/**
 * Refund request parameters
 */
export interface RefundRequest {
    /** Order ID to refund */
    orderId: string;
    /** Amount to refund in kuruş (optional, full refund if not specified) */
    amount?: number;
}

/**
 * Payment provider interface
 */
export interface PaymentProvider {
    /** Provider name */
    readonly name: string;

    /**
     * Create a new payment and get payment token/URL
     */
    createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse>;

    /**
     * Verify payment callback (IPN) signature
     */
    verifyCallback(payload: PaymentCallback): boolean;

    /**
     * Request a refund
     */
    refund(params: RefundRequest): Promise<any>;

    /**
     * Query transaction details
     */
    queryTransaction(orderId: string): Promise<any>;
}
