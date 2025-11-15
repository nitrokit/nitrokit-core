import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { delay } from './delay';

describe('delay utility', () => {
    beforeEach(() => {
        // Use fake timers to control time in tests without actually waiting.
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Restore real timers after each test to prevent side effects.
        vi.useRealTimers();
    });

    it('should resolve the promise after the specified duration', async () => {
        const duration = 1000;
        const delayPromise = delay(duration);

        // Advance timers by the specified duration.
        await vi.advanceTimersByTimeAsync(duration);

        // The promise should now be resolved.
        await expect(delayPromise).resolves.toBeUndefined();
    });

    it('should not resolve before the specified duration has passed', async () => {
        const duration = 500;
        const onResolve = vi.fn();
        delay(duration).then(onResolve);

        // Advance timers by less than the full duration.
        await vi.advanceTimersByTimeAsync(duration - 100);

        // The promise should still be pending.
        expect(onResolve).not.toHaveBeenCalled();

        // Advance timers to complete the duration.
        await vi.advanceTimersByTimeAsync(100);

        // Now the promise should be resolved.
        expect(onResolve).toHaveBeenCalledTimes(1);
    });

    it('should work correctly with a duration of 0 milliseconds', async () => {
        const delayPromise = delay(0);
        await vi.advanceTimersByTimeAsync(0);
        await expect(delayPromise).resolves.toBeUndefined();
    });
});
