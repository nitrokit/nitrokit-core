import { describe, it, expect } from 'vitest';
import {
    formatPhoneNumber,
    getCleanPhoneNumber,
    validatePhoneNumber,
    formatPhoneForDisplay,
    getCountryFlag
} from './phone';

describe('Phone Utilities', () => {
    describe('formatPhoneNumber', () => {
        it('should clean and add a plus prefix to a standard number', () => {
            expect(formatPhoneNumber('905551234567')).toBe('+905551234567');
        });

        it('should remove spaces and parentheses', () => {
            expect(formatPhoneNumber('+1 (800) 555-1234')).toBe('+18005551234');
        });

        it('should handle numbers that already have a plus prefix', () => {
            expect(formatPhoneNumber('+44 20 7946 0958')).toBe('+442079460958');
        });

        it('should handle multiple plus signs by keeping only one at the start', () => {
            expect(formatPhoneNumber('++1+555+1234')).toBe('+15551234');
        });

        it('should return only a plus for an empty or non-numeric string', () => {
            expect(formatPhoneNumber('')).toBe('+');
            expect(formatPhoneNumber('abc-def')).toBe('+');
        });
    });

    describe('getCleanPhoneNumber', () => {
        it('should remove all non-digit characters', () => {
            expect(getCleanPhoneNumber('+90 (555) 123-45-67')).toBe('905551234567');
        });

        it('should return an empty string if no digits are present', () => {
            expect(getCleanPhoneNumber('+ () -')).toBe('');
        });

        it('should not change a string that is already clean', () => {
            expect(getCleanPhoneNumber('18005551234')).toBe('18005551234');
        });
    });

    describe('validatePhoneNumber', () => {
        it('should return true for a valid length number', () => {
            expect(validatePhoneNumber('+18005551234')).toBe(true); // 11 digits
        });

        it('should return true for minimum length (7 digits)', () => {
            expect(validatePhoneNumber('1234567')).toBe(true);
        });

        it('should return true for maximum length (15 digits)', () => {
            expect(validatePhoneNumber('123456789012345')).toBe(true);
        });

        it('should return false for a number that is too short', () => {
            expect(validatePhoneNumber('+123456')).toBe(false); // 6 digits
        });

        it('should return false for a number that is too long', () => {
            expect(validatePhoneNumber('+1234567890123456')).toBe(false); // 16 digits
        });
    });

    describe('formatPhoneForDisplay', () => {
        it('should format a Turkish number with correct grouping', () => {
            expect(formatPhoneForDisplay('+905551234567')).toBe('+90 555 123 456 7');
        });

        it('should format a US number with correct grouping', () => {
            expect(formatPhoneForDisplay('+18005551234')).toBe('+1 800 555 123 4');
        });

        it('should return the cleaned number if country code is not found', () => {
            expect(formatPhoneForDisplay('+999123456789')).toBe('+999123456789');
        });

        it('should return the original string if it does not start with a plus', () => {
            expect(formatPhoneForDisplay('90 555 123 4567')).toBe('90 555 123 4567');
        });
    });

    describe('getCountryFlag', () => {
        it('should return the correct flag for a 1-digit country code (USA)', () => {
            expect(getCountryFlag('+1-800-555-1234')).toBe('🇺🇸');
        });

        it('should return the correct flag for a 2-digit country code (Turkey)', () => {
            expect(getCountryFlag('+905551234567')).toBe('🇹🇷');
        });

        it('should return the correct flag for a 3-digit country code (Bahamas)', () => {
            // This also tests that the longest match wins (over '1')
            expect(getCountryFlag('+12423222931')).toBe('🇧🇸');
        });

        it('should return the default flag for an unknown country code', () => {
            expect(getCountryFlag('+9991234567')).toBe('🌍');
        });

        it('should return the default flag for an empty or invalid input', () => {
            expect(getCountryFlag('')).toBe('🌍');
            expect(getCountryFlag('abc-def')).toBe('🌍');
        });
    });
});
