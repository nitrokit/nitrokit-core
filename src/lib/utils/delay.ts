/**
 * Creates a promise that resolves after a specified number of milliseconds.
 * Useful for simulating network latency or other asynchronous operations.
 * @param ms The number of milliseconds to wait before resolving the promise.
 * @returns A promise that resolves to `void` after the specified delay.
 */
export const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));
