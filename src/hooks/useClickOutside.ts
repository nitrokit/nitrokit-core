'use client';

import { useEffect, RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

/**
 * A React hook that triggers a callback when a click or touch event occurs outside of a specified element.
 *
 * @template T - The type of the HTML element to be tracked. Defaults to `HTMLElement`.
 * @param {RefObject<T>} ref - A React ref object pointing to the element to monitor.
 * @param {(event: Event) => void} handler - The callback function to execute when a click outside is detected.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    handler: (event: Event) => void
) {
    useEffect(() => {
        const listener = (event: Event) => {
            const el = ref?.current;
            if (!el || el.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}
