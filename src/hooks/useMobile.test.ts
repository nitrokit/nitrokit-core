import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMobile } from './useMobile';

// Mock for window.matchMedia
const createMatchMediaMock = (matches: boolean) => {
    const listeners: ((e: { matches: boolean }) => void)[] = [];
    return {
        matches,
        addEventListener: vi.fn((_event, listener) => {
            listeners.push(listener);
        }),
        removeEventListener: vi.fn((_event, listener) => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }),
        // Helper to simulate the media query changing
        simulateChange: (newMatches: boolean) => {
            listeners.forEach((listener) => listener({ matches: newMatches }));
        }
    };
};

describe('useMobile Hook', () => {
    let matchMediaMock: ReturnType<typeof createMatchMediaMock>;

    beforeEach(() => {
        // Default to non-mobile
        matchMediaMock = createMatchMediaMock(false);
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockImplementation(() => matchMediaMock)
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should return false on initial render (SSR behavior)', () => {
        const { result } = renderHook(() => useMobile());
        // The hook returns `!!undefined` which is `false` before useEffect runs.
        expect(result.current).toBe(false);
    });

    it('should return true on the client when the viewport is mobile', () => {
        // Set up the mock for a mobile viewport
        matchMediaMock = createMatchMediaMock(true);
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockImplementation(() => matchMediaMock)
        );

        const { result } = renderHook(() => useMobile());

        // After useEffect runs, the state should be updated
        expect(result.current).toBe(true);
    });

    it('should return false on the client when the viewport is not mobile', () => {
        const { result } = renderHook(() => useMobile());
        expect(result.current).toBe(false);
    });

    it('should update the value when the viewport size changes', () => {
        const { result } = renderHook(() => useMobile());

        // Initial state is non-mobile
        expect(result.current).toBe(false);

        // Simulate the viewport resizing to a mobile width
        act(() => {
            matchMediaMock.simulateChange(true);
        });

        // The hook should now return true
        expect(result.current).toBe(true);

        // Simulate resizing back to a desktop width
        act(() => {
            matchMediaMock.simulateChange(false);
        });

        expect(result.current).toBe(false);
    });

    it('should use the custom breakpoint provided', () => {
        renderHook(() => useMobile(1024));
        expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 1023px)');
    });

    it('should clean up the event listener on unmount', () => {
        const { unmount } = renderHook(() => useMobile());

        expect(matchMediaMock.addEventListener).toHaveBeenCalledTimes(1);

        unmount();

        expect(matchMediaMock.removeEventListener).toHaveBeenCalledTimes(1);
    });
});
