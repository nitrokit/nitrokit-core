import { useTheme } from 'next-themes';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';

/**
 * A hook that extends `next-themes`'s `useTheme` to provide SSR safety and
 * a framework for syncing user theme preferences with a backend.
 *
 * It ensures that theme-related logic only runs on the client-side to prevent
 * hydration mismatches and provides a `setTheme` function that can be extended
 * to save preferences to a database.
 *
 * @returns A tuple `[theme, mounted, setTheme, resolvedTheme]` where:
 *  - `theme`: The current active theme ('light', 'dark', etc.). Defaults to 'light'.
 *  - `mounted`: A boolean that is `true` only after the component has mounted on the client.
 *  - `setTheme`: A function to change the current theme, with built-in logic for backend syncing.
 *  - `resolvedTheme`: The actual theme being used (e.g., 'light' if the theme is 'system' and the system is light). Defaults to 'light'.
 */
export function useNextTheme() {
    const { theme, setTheme: setNextTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const hasLoadedPrefs = useRef(false);
    const isUserAction = useRef(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Run only once when mounted
    useEffect(() => {
        if (mounted && !hasLoadedPrefs.current) {
            // This is where you would load the user's theme preference from an API.
            // The logic is wrapped in a timeout to potentially wait for other async
            // operations like session loading.
            const loadUserTheme = () => {
                if (isUserAction.current) return;
                // try {
                //     const userTheme = await fetchUserTheme(); // Fictional API call
                //     if (userTheme && userTheme !== theme) {
                //         setNextTheme(userTheme);
                //     }
                // } catch (error) {
                //     console.error('❌ Failed to load user theme:', error);
                // } finally {
                //     hasLoadedPrefs.current = true;
                // }
            };

            loadUserTheme();
        }
    }, [mounted, theme, setNextTheme]);

    // Enhanced setTheme with user sync
    const setTheme = useCallback(
        (newTheme: string) => {
            // Mark as user action
            isUserAction.current = true;

            // Change theme immediately
            setNextTheme(newTheme);

            try {
                // const response = await fetch('/api/user/preferences', {
                //     method: 'PUT',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ theme: newTheme }),
                // });
                // if (response.ok) {
                //     const result = await response.json();
                //     if (result.success && result.themeChanged) {
                //         console.info('💾 Theme preference saved to database');
                //     }
                // }
            } catch (error) {
                console.debug('⚠️ Theme sync failed:', error);
            } finally {
                // 2 seconds later reset user action flag
                setTimeout(() => {
                    isUserAction.current = false;
                }, 2000);
            }
        },
        [setNextTheme]
    );

    // Memoize the return value to ensure stable references for consumers
    return useMemo(
        () => [theme || 'light', mounted, setTheme, resolvedTheme || 'light'] as const,
        [theme, mounted, setTheme, resolvedTheme]
    );
}
