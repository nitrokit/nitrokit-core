'use client';

import { useEffect, useState } from 'react';

/**
 * Defines the structure for user's cookie preferences.
 */
interface CookiePreferences {
    /** Essential cookies that cannot be disabled. */
    necessary: boolean;
    /** Cookies for collecting analytics data. */
    analytics: boolean;
    /** Cookies for marketing and advertising purposes. */
    marketing: boolean;
    /** Cookies for enhancing site functionality and personalization. */
    functional: boolean;
}

/**
 * Checks if the current user agent belongs to a known bot or crawler.
 * This helps in bypassing consent logic for search engines and social media crawlers.
 *
 * @returns {boolean} `true` if a bot user agent is detected, otherwise `false`.
 */
function isBot(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = [
        'googlebot',
        'bingbot',
        'slurp',
        'duckduckbot',
        'baiduspider',
        'yandexbot',
        'facebookexternalhit',
        'twitterbot',
        'rogerbot',
        'linkedinbot',
        'embedly',
        'quora link preview',
        'showyoubot',
        'outbrain',
        'pinterest',
        'developers.google.com/+/web/snippet'
    ];

    return botPatterns.some((pattern) => userAgent.includes(pattern));
}

/**
 * A React hook to manage cookie consent state according to user preferences.
 * It handles loading state from localStorage, detects bots, and provides easy-to-use flags
 * for conditional feature enablement (e.g., analytics, marketing scripts).
 *
 * @returns An object containing:
 *  - `preferences`: The user's stored cookie preferences, or `null` if not set.
 *  - `hasConsent`: A boolean indicating if the user has given any form of consent.
 *  - `isLoading`: A boolean that is `true` while the hook is initializing from localStorage.
 *  - `isBotDetected`: A boolean indicating if the current user is likely a bot.
 *  - `canUseAnalytics`: A derived boolean to quickly check if analytics scripts can be run.
 *  - `canUseMarketing`: A derived boolean to quickly check if marketing scripts can be run.
 *  - `canUseFunctional`: A derived boolean to quickly check if functional scripts can be run.
 */
export function useCookieConsent() {
    const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
    const [hasConsent, setHasConsent] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isBotDetected, setIsBotDetected] = useState(false);

    useEffect(() => {
        const botDetected = isBot();
        setIsBotDetected(botDetected);

        if (botDetected) {
            setIsLoading(false);
            return;
        }

        const consent = localStorage.getItem('nitrokit-cookie-consent');
        const savedPreferences = localStorage.getItem('nitrokit-cookie-preferences');

        if (consent && savedPreferences) {
            const parsedPreferences = JSON.parse(savedPreferences) as CookiePreferences;
            setPreferences(parsedPreferences);
            setHasConsent(true);
        }

        setIsLoading(false);

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'nitrokit-cookie-preferences' && e.newValue) {
                const newPreferences = JSON.parse(e.newValue) as CookiePreferences;
                setPreferences(newPreferences);
                setHasConsent(true);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return {
        preferences,
        hasConsent,
        isLoading,
        isBotDetected,
        canUseAnalytics: isBotDetected || (hasConsent && preferences?.analytics),
        canUseMarketing: isBotDetected || (hasConsent && preferences?.marketing),
        canUseFunctional: isBotDetected || (hasConsent && preferences?.functional)
    };
}
