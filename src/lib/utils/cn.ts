import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function to conditionally and safely merge Tailwind CSS classes.
 * It combines the functionality of `clsx` for conditional classes and `tailwind-merge`
 * for resolving conflicting Tailwind classes.
 *
 * @param inputs - A list of class values to be merged. These can be strings, objects, or arrays.
 * @returns A string of merged and de-duplicated class names.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
