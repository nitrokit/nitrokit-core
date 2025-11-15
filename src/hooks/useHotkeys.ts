import React from 'react';

/**
 * Defines the structure of a keyboard shortcut.
 */
export interface Shortcut {
    /** The primary key to listen for (e.g., 's', 'Enter'). Case-insensitive. */
    key: string;
    /** If the Meta key (Cmd/Win) must be pressed. Defaults to `false`. */
    metaKey?: boolean;
    /** If the Control key must be pressed. Defaults to `false`. */
    ctrlKey?: boolean;
    /** If the Shift key must be pressed. Defaults to `false`. */
    shiftKey?: boolean;
    /** If the Alt key (Option) must be pressed. Defaults to `false`. */
    altKey?: boolean;
    /** The callback function to execute when the shortcut is triggered. */
    action: (event: KeyboardEvent) => void;
}

/**
 * A React hook that listens for keyboard shortcuts and executes corresponding actions.
 * It attaches a 'keydown' event listener to the document and calls the appropriate action
 * when a registered shortcut is detected, preventing the default browser behavior.
 *
 * @param {Shortcut[]} shortcuts - An array of `Shortcut` objects to listen for.
 * @param {React.DependencyList} [dependencies=[]] - An optional array of dependencies. The event listener will be re-attached if any of these dependencies change. The `shortcuts` array is always included.
 */
export function useHotkeys(shortcuts: Shortcut[], dependencies: React.DependencyList = []) {
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                // Check if modifier keys match. `?? false` ensures that if a modifier is not specified in the shortcut,
                // it must not be pressed for the shortcut to trigger.
                const metaKeyMatch = (shortcut.metaKey ?? false) === e.metaKey;
                const ctrlKeyMatch = (shortcut.ctrlKey ?? false) === e.ctrlKey;
                const shiftKeyMatch = (shortcut.shiftKey ?? false) === e.shiftKey;
                const altKeyMatch = (shortcut.altKey ?? false) === e.altKey;

                if (
                    e.key.toLowerCase() === shortcut.key.toLowerCase() &&
                    metaKeyMatch &&
                    ctrlKeyMatch &&
                    shiftKeyMatch &&
                    altKeyMatch
                ) {
                    e.preventDefault();
                    shortcut.action(e);
                    return;
                }
            }
        };

        document.addEventListener('keydown', down);
        return () => {
            document.removeEventListener('keydown', down);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shortcuts, ...dependencies]);
}
