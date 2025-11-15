import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
    it('should merge basic class names', () => {
        expect(cn('class-a', 'class-b')).toBe('class-a class-b');
    });

    it('should handle conditional classes correctly', () => {
        expect(cn('base', { 'is-active': true, 'is-hidden': false })).toBe('base is-active');
    });

    it('should handle mixed arguments including arrays and conditionals', () => {
        const isActive = true;
        const hasError = false;
        expect(
            cn('p-4', ['m-2', 'rounded'], { 'bg-blue-500': isActive, 'border-red-500': hasError })
        ).toBe('p-4 m-2 rounded bg-blue-500');
    });

    it('should filter out falsy values like null, undefined, and false', () => {
        expect(cn('a', null, 'b', undefined, false, 'c')).toBe('a b c');
    });

    it('should override conflicting Tailwind CSS classes (last one wins)', () => {
        expect(cn('p-2', 'p-4')).toBe('p-4');
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should merge non-conflicting Tailwind CSS classes', () => {
        expect(cn('p-2', 'm-4')).toBe('p-2 m-4');
    });

    it('should resolve complex Tailwind CSS conflicts', () => {
        // p-4 should override px-2 and py-2
        expect(cn('px-2 py-2', 'p-4')).toBe('p-4');
        // px-4 should override p-2's x-axis padding but keep the y-axis padding
        expect(cn('p-2', 'px-4')).toBe('p-2 px-4');
    });

    it('should handle a complex real-world scenario', () => {
        const hasBackground = true;
        const isLarge = false;
        const isPadded = true;
        expect(
            cn(
                'font-bold',
                { 'bg-gray-100': hasBackground, 'text-lg': isLarge },
                isPadded && 'p-4',
                'p-2'
            )
        ).toBe('font-bold bg-gray-100 p-2');
    });
});
