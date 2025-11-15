/**
 * Normalizes an unknown input into a standard `Error` object.
 * It handles cases where the input is already an `Error`, a string, or an object with a `message` property.
 * @param error The unknown value to be normalized.
 * @returns An `Error` object.
 */
export function normalizeError(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }

    if (typeof error === 'string') {
        return new Error(error);
    }

    if (error && typeof error === 'object' && 'message' in error) {
        return new Error(String(error.message));
    }

    return new Error('An unknown error occurred');
}

/**
 * Safely extracts the error message from an unknown input.
 * It uses `normalizeError` internally to ensure a consistent `Error` object before accessing the message.
 * @param error The unknown value from which to extract the error message.
 * @returns The error message as a string.
 */
export function getErrorMessage(error: unknown): string {
    return normalizeError(error).message;
}

/**
 * Safely extracts the stack trace from an unknown input.
 * It uses `normalizeError` internally to ensure a consistent `Error` object before accessing the stack.
 * @param error The unknown value from which to extract the stack trace.
 * @returns The stack trace as a string, or `undefined` if it doesn't exist.
 */
export function getErrorStack(error: unknown): string | undefined {
    return normalizeError(error).stack;
}

/**
 * Throws a type-safe error for an unsupported service.
 *
 * @param service - The name of the service that caused the error.
 * @param message - An optional custom message explaining the reason for the error.
 * @returns The function returns the `never` type because it never returns normally.
 */
export function unsupportedServiceError(service: string, message?: string): never {
    const errorMsg = message
        ? `Unsupported service: ${service}. ${message}`
        : `Unsupported service: ${service}`;

    throw new Error(errorMsg);
}
