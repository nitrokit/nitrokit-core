import { z } from 'zod';
import { createEnv } from '@t3-oss/env-nextjs';

/**
 * Create a configurable env instance for library consumers.
 *
 * This factory builds an env using @t3-oss/env-nextjs. Consumers can pass
 * server/client Zod shapes and a runtimeEnv map (for process.env injection).
 * By default runtimeEnv falls back to process.env, but providing runtimeEnv
 * is recommended for libraries to avoid direct process.env coupling and to
 * simplify testing.
 *
 * @param opts - Optional configuration:
 *   - server: Zod schema shape for server-only variables.
 *   - client: Zod schema shape for client-exposed variables.
 *   - runtimeEnv: Map of runtime values (string | undefined), useful for tests/SSR.
 * @returns The env instance produced by createEnv.
 *
 * @example
 * // Application usage example:
 * import { createLibraryEnv } from "nitrokit-core";
 * import { z } from "zod";
 *
 * export const env = createLibraryEnv({
 *   server: {
 *     MY_LIB_SECRET: z.string(),
 *   },
 *   runtimeEnv: {
 *     MY_LIB_SECRET: process.env.MY_LIB_SECRET,
 *   },
 * });
 */
export function createLibraryEnv(opts?: {
    server?: z.ZodRawShape;
    client?: z.ZodRawShape;
    runtimeEnv?: Record<string, string | undefined>;
    isServer?: boolean;
}) {
    // spread to remove readonly and satisfy createEnv type (ZodTypeAny)
    const server = { ...(opts?.server ?? {}) } as Record<string, z.ZodTypeAny>;
    // keep Zod types for client, but package types enforce NEXT_PUBLIC_ keys at compile time
    const client = { ...(opts?.client ?? {}) } as unknown as Record<string, z.ZodTypeAny>;
    const runtimeEnv = opts?.runtimeEnv ?? (process.env as Record<string, string | undefined>);

    // Quick/explicit workaround: cast whole options to any to bypass the package's client-key type check.
    // Alternative (safer): ensure client keys are prefixed with "NEXT_PUBLIC_" or transform them before calling createEnv.
    return createEnv({
        server,
        client: client as Record<`NEXT_PUBLIC_${string}`, z.ZodTypeAny>,
        runtimeEnv,
        isServer: opts?.isServer ?? typeof window === 'undefined'
    });
}

/**
 * Default env instance for the library (backwards-compatible).
 *
 * This export provides a ready-to-use env with the common optional server
 * variables used by Nitrokit. Library consumers can use this directly or
 * create a custom env via createLibraryEnv if they need additional keys
 * or to control runtimeEnv (recommended for app-level configuration).
 *
 * @example
 * // Use default:
 * import { env } from "nitrokit-core";
 * console.log(env.SERVER.GOOGLE_ANALYTICS);
 *
 * // Or create a custom env if you need extra variables:
 * import { createLibraryEnv } from "nitrokit-core";
 * import { z } from "zod";
 *
 * const customEnv = createLibraryEnv({
 *   server: { MY_OPTION: z.string().optional() },
 *   runtimeEnv: { MY_OPTION: process.env.MY_OPTION },
 * });
 */
export const env = createLibraryEnv({
    server: {
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
    },
    runtimeEnv: {
        GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION,
        GOOGLE_ANALYTICS: process.env.GOOGLE_ANALYTICS,
        YANDEX_VERIFICATION: process.env.YANDEX_VERIFICATION,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
        RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
        GH_ACCESS_TOKEN: process.env.GH_ACCESS_TOKEN,
        GH_USERNAME: process.env.GH_USERNAME,
        GH_REPONAME: process.env.GH_REPONAME,
        BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN
    }
});
