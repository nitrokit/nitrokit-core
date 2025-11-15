import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
/**
 * A React hook to determine if the current viewport width is considered "mobile".
 * It returns `false` during server-side rendering (SSR) to prevent hydration mismatches
 * and updates to the correct boolean value on the client.
 *
 * @param {number} [breakpoint=768] - The width in pixels to use as the mobile breakpoint.
 * @returns {boolean} `true` if the viewport width is less than the breakpoint, otherwise `false`.
 */
export function useMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

        const onChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        mql.addEventListener('change', onChange);
        setIsMobile(mql.matches); // Set initial state
        return () => mql.removeEventListener('change', onChange);
    }, [breakpoint]);

    return !!isMobile;
}
