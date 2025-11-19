import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StripeProvider } from './stripe';
import type { CreatePaymentRequest } from '../types';

describe('StripeProvider', () => {
    let provider: StripeProvider;

    beforeEach(() => {
        // Mock environment variables
        process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
        process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789';
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123';
        process.env.STRIPE_TEST = '1';

        provider = new StripeProvider();
    });

    describe('constructor', () => {
        it('should throw error if secretKey is missing', () => {
            delete process.env.STRIPE_SECRET_KEY;
            expect(() => new StripeProvider()).toThrow(
                'Stripe configuration missing: secretKey is required.'
            );
        });

        it('should use provided config over environment variables', () => {
            const customProvider = new StripeProvider({
                secretKey: 'sk_test_custom',
                publishableKey: 'pk_test_custom',
                webhookSecret: 'whsec_custom',
                testMode: false
            });

            expect(customProvider.name).toBe('Stripe');
            expect(customProvider.getPublishableKey()).toBe('pk_test_custom');
        });

        it('should warn if test mode enabled with non-test key', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            new StripeProvider({
                secretKey: 'sk_live_123',
                testMode: true
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    'Test mode enabled but secret key does not appear to be a test key'
                )
            );

            consoleSpy.mockRestore();
        });
    });

    describe('createPayment', () => {
        it('should validate required fields', async () => {
            const invalidRequest = {
                orderId: '',
                amount: 0,
                email: 'invalid-email',
                successUrl: '',
                failUrl: ''
            } as CreatePaymentRequest;

            await expect(provider.createPayment(invalidRequest)).rejects.toThrow();
        });

        it('should validate email format', async () => {
            const request: CreatePaymentRequest = {
                orderId: 'ORDER-123',
                amount: 10000,
                email: 'not-an-email',
                successUrl: 'https://example.com/success',
                failUrl: 'https://example.com/fail'
            };

            await expect(provider.createPayment(request)).rejects.toThrow(
                'Valid email address is required'
            );
        });

        it('should validate amount is positive', async () => {
            const request: CreatePaymentRequest = {
                orderId: 'ORDER-123',
                amount: -100,
                email: 'test@example.com',
                successUrl: 'https://example.com/success',
                failUrl: 'https://example.com/fail'
            };

            await expect(provider.createPayment(request)).rejects.toThrow(
                'Amount must be a positive number'
            );
        });

        it('should create checkout session successfully', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    id: 'cs_test_123',
                    url: 'https://checkout.stripe.com/c/pay/cs_test_123',
                    payment_status: 'unpaid'
                })
            });

            global.fetch = mockFetch;

            const request: CreatePaymentRequest = {
                orderId: 'ORDER-123',
                amount: 10000,
                email: 'test@example.com',
                successUrl: 'https://example.com/success',
                failUrl: 'https://example.com/fail',
                basket: [{ name: 'Product 1', price: 10000, quantity: 1 }]
            };

            const result = await provider.createPayment(request);

            expect(result.success).toBe(true);
            expect(result.token).toBe('cs_test_123');
            expect(result.paymentUrl).toBe('https://checkout.stripe.com/c/pay/cs_test_123');
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({
                    error: {
                        message: 'Invalid API key',
                        code: 'invalid_api_key'
                    }
                })
            });

            global.fetch = mockFetch;

            const request: CreatePaymentRequest = {
                orderId: 'ORDER-123',
                amount: 10000,
                email: 'test@example.com',
                successUrl: 'https://example.com/success',
                failUrl: 'https://example.com/fail'
            };

            const result = await provider.createPayment(request);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Invalid API key');
            expect(result.errorCode).toBe('invalid_api_key');
        });

        it('should support different currencies', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'cs_test_123',
                    url: 'https://checkout.stripe.com/c/pay/cs_test_123'
                })
            });

            global.fetch = mockFetch;

            const request: CreatePaymentRequest = {
                orderId: 'ORDER-123',
                amount: 10000,
                email: 'test@example.com',
                successUrl: 'https://example.com/success',
                failUrl: 'https://example.com/fail',
                currency: 'USD'
            };

            await provider.createPayment(request);

            const fetchCall = mockFetch.mock.calls[0];
            const body = fetchCall[1]?.body as string;

            expect(body).toContain('currency%5D=usd');
        });
    });

    describe('verifyCallback', () => {
        it('should return true for valid callback with webhook secret', () => {
            const payload = {
                orderId: 'ORDER-123',
                status: 'paid',
                amount: 10000,
                hash: 'whsec_test123'
            };

            const isValid = provider.verifyCallback(payload);
            expect(isValid).toBe(true);
        });

        it('should return false for invalid hash', () => {
            const payload = {
                orderId: 'ORDER-123',
                status: 'paid',
                amount: 10000,
                hash: 'invalid_hash'
            };

            const isValid = provider.verifyCallback(payload);
            expect(isValid).toBe(false);
        });

        it('should return false for missing fields', () => {
            const payload = {
                orderId: '',
                status: '',
                amount: 0,
                hash: ''
            };

            const isValid = provider.verifyCallback(payload);
            expect(isValid).toBe(false);
        });

        it('should warn when webhook secret is not configured', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const providerNoSecret = new StripeProvider({
                secretKey: 'sk_test_123',
                webhookSecret: ''
            });

            const payload = {
                orderId: 'ORDER-123',
                status: 'paid',
                amount: 10000,
                hash: 'any_hash'
            };

            providerNoSecret.verifyCallback(payload);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Webhook secret not configured')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('refund', () => {
        it('should throw error if orderId is missing', async () => {
            await expect(provider.refund({ orderId: '' })).rejects.toThrow(
                'Order ID (Payment Intent ID) is required for refund'
            );
        });

        it('should create full refund successfully', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 're_123',
                    amount: 10000,
                    status: 'succeeded'
                })
            });

            global.fetch = mockFetch;

            const result = await provider.refund({ orderId: 'pi_123' });

            expect(result.id).toBe('re_123');
            expect(result.status).toBe('succeeded');
        });

        it('should create partial refund successfully', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 're_123',
                    amount: 5000,
                    status: 'succeeded'
                })
            });

            global.fetch = mockFetch;

            const result = await provider.refund({
                orderId: 'pi_123',
                amount: 5000
            });

            expect(result.amount).toBe(5000);
        });
    });

    describe('queryTransaction', () => {
        it('should throw error if orderId is missing', async () => {
            await expect(provider.queryTransaction('')).rejects.toThrow(
                'Order ID (Payment Intent or Session ID) is required'
            );
        });

        it('should query payment intent successfully', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'pi_123',
                    amount: 10000,
                    status: 'succeeded'
                })
            });

            global.fetch = mockFetch;

            const result = await provider.queryTransaction('pi_123');

            expect(result.id).toBe('pi_123');
            expect(result.status).toBe('succeeded');
        });

        it('should fallback to checkout session query', async () => {
            const mockFetch = vi
                .fn()
                .mockResolvedValueOnce({
                    ok: false,
                    status: 404
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        id: 'cs_123',
                        payment_status: 'paid'
                    })
                });

            global.fetch = mockFetch;

            const result = await provider.queryTransaction('cs_123');

            expect(result.id).toBe('cs_123');
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('getPublishableKey', () => {
        it('should return publishable key', () => {
            const key = provider.getPublishableKey();
            expect(key).toBe('pk_test_123456789');
        });
    });
});
