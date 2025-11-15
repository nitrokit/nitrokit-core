import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

class RateLimitManager {
    private redis: Redis | null = null;
    private apiRateLimit: Ratelimit | null = null;
    private emailResendRateLimit: Ratelimit | null = null;
    private authRateLimit: Ratelimit | null = null;
    private smsRateLimit: Ratelimit | null = null;

    constructor() {
        this.initializeRedis();
    }

    private initializeRedis(): void {
        try {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                this.redis = new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN
                });
                this.initializeRateLimiters();
            }
        } catch (error) {
            console.error('Failed to initialize Redis:', error);
            this.redis = null;
        }
    }

    private initializeRateLimiters(): void {
        if (!this.redis) return;

        this.apiRateLimit = new Ratelimit({
            redis: this.redis,
            limiter: Ratelimit.slidingWindow(100, '1 m'),
            analytics: true,
            prefix: 'api'
        });

        this.emailResendRateLimit = new Ratelimit({
            redis: this.redis,
            limiter: Ratelimit.slidingWindow(3, '1 h'),
            analytics: true,
            prefix: 'email_resend'
        });

        this.authRateLimit = new Ratelimit({
            redis: this.redis,
            limiter: Ratelimit.slidingWindow(5, '15 m'),
            analytics: true,
            prefix: 'auth'
        });

        this.smsRateLimit = new Ratelimit({
            redis: this.redis,
            limiter: Ratelimit.slidingWindow(5, '1 h'),
            analytics: true,
            prefix: 'sms'
        });
    }

    isAvailable(): boolean {
        return this.redis !== null;
    }

    async checkApiRateLimit(identifier?: string) {
        const key = identifier || this.getDefaultIdentifier();
        return this.check(this.apiRateLimit, key);
    }

    async checkEmailResendRateLimit(identifier?: string) {
        const key = identifier || this.getDefaultIdentifier();
        return this.check(this.emailResendRateLimit, key);
    }

    async checkAuthRateLimit(identifier?: string) {
        const key = identifier || this.getDefaultIdentifier();
        return this.check(this.authRateLimit, key);
    }

    async checkSmsRateLimit(identifier?: string) {
        const key = identifier || this.getDefaultIdentifier();
        return this.check(this.smsRateLimit, key);
    }

    private async check(
        rateLimit: Ratelimit | null,
        identifier: string
    ): Promise<{
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
        blocked?: boolean;
    }> {
        try {
            if (!rateLimit) {
                return this.getFallbackResponse();
            }

            const result = await rateLimit.limit(identifier);
            return {
                ...result,
                blocked: !result.success
            };
        } catch (error) {
            console.error('Rate limit error:', error);
            return this.getFallbackResponse();
        }
    }

    private getFallbackResponse() {
        return {
            success: true,
            limit: 100,
            remaining: 99,
            reset: Date.now() + 60000
        };
    }

    private getDefaultIdentifier(): string {
        // Anonymous kullanıcılar için unique identifier oluştur
        return `anonymous_${Date.now()}`;
    }

    getRateLimitHeaders(result: {
        limit: number;
        remaining: number;
        reset: number;
    }): Record<string, string> {
        return {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString()
        };
    }

    isRateLimited(result: { success: boolean }): boolean {
        return !result.success;
    }
}

export const rateLimitManager = new RateLimitManager();
