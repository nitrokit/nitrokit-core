import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PayTRProvider } from './paytr';
import type { CreatePaymentRequest } from '../types';

describe('PayTRProvider', () => {
    let provider: PayTRProvider;

    beforeEach(() => {
        // Mock environment variables
        process.env.PAYTR_MERCHANT_ID = 'test_merchant_123';
        process.env.PAYTR_KEY = 'test_key_secret';
        process.env.PAYTR_SALT = 'test_salt';
        process.env.PAYTR_TEST = '1';

        provider = new PayTRProvider();
    });

    describe('constructor', () => {
        it('should throw error if merchantId is missing', () => {
            delete process.env.PAYTR_MERCHANT_ID;
            expect(() => new PayTRProvider()).toThrow(
                'PayTR configuration missing: merchantId and merchantKey are required.'
            );
        });

        it('should throw error if merchantKey is missing', () => {
            delete process.env.PAYTR_KEY;
            expect(() => new PayTRProvider()).toThrow(
                'PayTR configuration missing: merchantId and merchantKey are required.'
            );
        });

        it('should use provided config over environment variables', () => {
            const customProvider = new PayTRProvider({
                merchantId: 'custom_merchant',
                merchantKey: 'custom_key',
                merchantSalt: 'custom_salt',
                testMode: false
            });

            expect(customProvider.name).toBe('PayTR');
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

        it('should validate URLs', async () => {
            const request: CreatePaymentRequest = {
                orderId: 'ORDER-123',
                amount: 10000,
                email: 'test@example.com',
                successUrl: 'not-a-url',
                failUrl: 'also-not-a-url'
            };

            await expect(provider.createPayment(request)).rejects.toThrow('Valid success URL');
        });

        it('should handle basket items correctly', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    token: 'test_token_xyz'
                })
            });

            global.fetch = mockFetch;

            const request: CreatePaymentRequest = {
                orderId: 'ORDER-123',
                amount: 15000,
                email: 'test@example.com',
                successUrl: 'https://example.com/success',
                failUrl: 'https://example.com/fail',
                basket: [
                    { name: 'Product 1', price: 10000, quantity: 1 },
                    { name: 'Product 2', price: 5000, quantity: 1 }
                ]
            };

            const result = await provider.createPayment(request);

            expect(result.success).toBe(true);
            expect(result.token).toBe('test_token_xyz');
            expect(result.paymentUrl).toContain('test_token_xyz');
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should reject invalid basket items', async () => {
            const request: CreatePaymentRequest = {
                orderId: 'ORDER-123',
                amount: 10000,
                email: 'test@example.com',
                successUrl: 'https://example.com/success',
                failUrl: 'https://example.com/fail',
                basket: [{ name: '', price: -100, quantity: 0 }]
            };

            await expect(provider.createPayment(request)).rejects.toThrow();
        });
    });

    describe('verifyCallback', () => {
        it('should return true for valid callback', () => {
            // This test requires proper HMAC calculation
            // In real scenario, you'd compute the expected hash
            const payload = {
                orderId: 'ORDER-123',
                status: 'success',
                amount: 10000,
                hash: provider['hmacBase64'](
                    `${process.env.PAYTR_MERCHANT_ID}ORDER-123success10000${process.env.PAYTR_SALT}`
                )
            };

            const isValid = provider.verifyCallback(payload);
            expect(isValid).toBe(true);
        });

        it('should return false for invalid hash', () => {
            const payload = {
                orderId: 'ORDER-123',
                status: 'success',
                amount: 10000,
                hash: 'invalid_hash_value'
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
    });

    describe('refund', () => {
        it('should throw error if orderId is missing', async () => {
            await expect(provider.refund({ orderId: '' })).rejects.toThrow(
                'Order ID is required for refund'
            );
        });
    });

    describe('queryTransaction', () => {
        it('should throw error if orderId is missing', async () => {
            await expect(provider.queryTransaction('')).rejects.toThrow(
                'Order ID is required for transaction query'
            );
        });
    });
});
