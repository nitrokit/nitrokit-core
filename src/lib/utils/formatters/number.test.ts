import { describe, it, expect } from 'vitest';
import { formatCompactNumber } from './number';

describe('formatCompactNumber', () => {
    it('should return "0" for null or undefined input', () => {
        expect(formatCompactNumber(null)).toBe('0');
        expect(formatCompactNumber(undefined)).toBe('0');
    });

    it('should format a number in the thousands (K)', () => {
        expect(formatCompactNumber(1200, 'en-US')).toBe('1.2K');
        expect(formatCompactNumber(9999, 'en-US')).toBe('10K');
    });

    it('should format a number in the millions (M)', () => {
        expect(formatCompactNumber(1_500_000, 'en-US')).toBe('1.5M');
        expect(formatCompactNumber(1_000_000, 'en-US')).toBe('1M');
    });

    it('should format a number in the billions (B)', () => {
        expect(formatCompactNumber(2_300_000_000, 'en-US')).toBe('2.3B');
    });

    it('should not format numbers less than 1000', () => {
        expect(formatCompactNumber(999, 'en-US')).toBe('999');
        expect(formatCompactNumber(100, 'en-US')).toBe('100');
    });

    it('should handle zero correctly', () => {
        expect(formatCompactNumber(0, 'en-US')).toBe('0');
    });

    it('should handle negative numbers correctly', () => {
        expect(formatCompactNumber(-1200, 'en-US')).toBe('-1.2K');
        expect(formatCompactNumber(-1_500_000, 'en-US')).toBe('-1.5M');
    });

    it('should use the specified locale for formatting', () => {
        // Turkish uses 'B' for 'Bin' (thousand) and a comma for the decimal separator.
        // The space might be a non-breaking space, so we use a regex to be safe.
        expect(formatCompactNumber(1200, 'tr-TR')).toMatch(/1,2\s?B/);
        expect(formatCompactNumber(1_500_000, 'tr-TR')).toMatch(/1,5\s?M/);
    });

    it('should use "en-US" as the default locale if none is provided', () => {
        // This test assumes the environment running the test has 'en-US' behavior as default.
        expect(formatCompactNumber(5500)).toBe('5.5K');
    });
});
