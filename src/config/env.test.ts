import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { createLibraryEnv, env as defaultEnv } from './env';

describe('Environment Configuration', () => {
    const originalProcessEnv = process.env;

    beforeEach(() => {
        // Reset process.env before each test to ensure isolation.
        vi.resetModules();
        process.env = { ...originalProcessEnv };
    });

    afterEach(() => {
        // Restore the original process.env after each test.
        process.env = originalProcessEnv;
    });

    describe('createLibraryEnv Factory', () => {
        it('should correctly validate and return server variables', () => {
            const runtimeEnv = {
                DATABASE_URL: 'https://my.database.com/db'
            };
            const env = createLibraryEnv({
                server: {
                    DATABASE_URL: z.string().url()
                },
                runtimeEnv,
                isServer: true
            });
            expect(env.DATABASE_URL).toBe(runtimeEnv.DATABASE_URL);
        });

        it('should correctly validate and return client variables', () => {
            const runtimeEnv = {
                NEXT_PUBLIC_API_URL: 'https://api.example.com'
            };
            const env = createLibraryEnv({
                client: {
                    NEXT_PUBLIC_API_URL: z.string().url()
                },
                runtimeEnv
            });
            expect(env.NEXT_PUBLIC_API_URL).toBe(runtimeEnv.NEXT_PUBLIC_API_URL);
        });

        it('should throw an error for a missing required server variable', () => {
            // Suppress the expected error log from createEnv
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const createInvalidEnv = () =>
                createLibraryEnv({
                    server: {
                        SECRET_KEY: z.string()
                    },
                    runtimeEnv: {}, // SECRET_KEY is missing
                    isServer: true
                });

            expect(createInvalidEnv).toThrow();

            // Restore the original console.error spy
            errorSpy.mockRestore();
        });

        it('should throw an error for a missing required client variable', () => {
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const createInvalidEnv = () =>
                createLibraryEnv({
                    client: {
                        NEXT_PUBLIC_API_URL: z.string().url()
                    },
                    runtimeEnv: {} // NEXT_PUBLIC_API_URL is missing
                });

            expect(createInvalidEnv).toThrow();

            errorSpy.mockRestore();
        });

        it('should not throw for a missing optional variable', () => {
            const createValidEnv = () =>
                createLibraryEnv({
                    server: {
                        OPTIONAL_KEY: z.string().optional()
                    },
                    runtimeEnv: {},
                    isServer: true
                });

            expect(createValidEnv).not.toThrow();
            const env = createValidEnv();
            expect(env.OPTIONAL_KEY).toBeUndefined();
        });

        it('should use process.env as a fallback if runtimeEnv is not provided', () => {
            process.env.FALLBACK_KEY = 'fallback-value';

            const env = createLibraryEnv({
                server: {
                    FALLBACK_KEY: z.string()
                },
                isServer: true
            });

            expect(env.FALLBACK_KEY).toBe('fallback-value');
        });
    });

    describe('Default `env` Export', () => {
        it('should be created without errors', () => {
            // Checks that importing defaultEnv does not throw an error.
            expect(defaultEnv).toBeDefined();
            expect(typeof defaultEnv).toBe('object');
        });

        it('should contain all defined optional server variables', () => {
            // Since all variables are optional, their values should be undefined in the env object
            // if they are not in process.env. We simulate a server environment for this test.
            
            // Clear any values from .env file
            delete process.env.GOOGLE_ANALYTICS;
            delete process.env.RESEND_API_KEY;
            delete process.env.GH_ACCESS_TOKEN;
            
            const serverSchema = {
                GOOGLE_SITE_VERIFICATION: z.string().optional(),
                GOOGLE_ANALYTICS: z.string().optional(),
                YANDEX_VERIFICATION: z.string().optional(),
                RESEND_API_KEY: z.string().optional(),
                RESEND_FROM_EMAIL: z.string().optional(),
                RESEND_AUDIENCE_ID: z.string().optional(),
                GH_ACCESS_TOKEN: z.string().optional(),
                GH_USERNAME: z.string().optional(),
                GH_REPONAME: z.string().optional(),
                BLOB_READ_WRITE_TOKEN: z.string().optional()
            };

            const serverEnv = createLibraryEnv({
                server: serverSchema,
                isServer: true
            });
            expect(serverEnv.GOOGLE_ANALYTICS).toBeUndefined();
            expect(serverEnv.RESEND_API_KEY).toBeUndefined();
            expect(serverEnv.GH_ACCESS_TOKEN).toBeUndefined();
        });

        it('should correctly read a value from process.env', async () => {
            process.env.GOOGLE_ANALYTICS = 'G-12345';
            // The module must be reloaded to pick up the change in process.env
            vi.resetModules();

            // Temporarily simulate a server environment
            vi.stubGlobal('window', undefined);

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const reloadedModule = await import('./env');
            expect(reloadedModule.env.GOOGLE_ANALYTICS).toBe('G-12345');

            // Clean up the global stub
            vi.unstubAllGlobals();
        });
    });
});
