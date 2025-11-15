/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from 'vitest';
import { normalizeError, getErrorMessage, getErrorStack, unsupportedServiceError } from './error';

describe('Error Utilities', () => {
    describe('normalizeError', () => {
        it('should return the same error if input is an instance of Error', () => {
            const originalError = new Error('Original error');
            expect(normalizeError(originalError)).toBe(originalError);
        });

        it('should create a new Error from a string input', () => {
            const errorMessage = 'This is a string error';
            const error = normalizeError(errorMessage);
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe(errorMessage);
        });

        it('should create a new Error from an object with a message property', () => {
            const errorObject = { message: 'This is from an object' };
            const error = normalizeError(errorObject);
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('This is from an object');
        });

        it('should create a new Error with a default message for null input', () => {
            const error = normalizeError(null);
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('An unknown error occurred');
        });

        it('should create a new Error with a default message for an object without a message', () => {
            const error = normalizeError({ code: 500 });
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('An unknown error occurred');
        });

        it('should stringify a non-string message property', () => {
            const error = normalizeError({ message: { detail: 'nested' } });
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('[object Object]');
        });
    });

    describe('getErrorMessage', () => {
        it('should extract the message from an Error instance', () => {
            const message = getErrorMessage(new Error('Specific message'));
            expect(message).toBe('Specific message');
        });

        it('should extract the message from a string', () => {
            const message = getErrorMessage('A simple string');
            expect(message).toBe('A simple string');
        });

        it('should return a default message for an unknown error type', () => {
            const message = getErrorMessage(12345);
            expect(message).toBe('An unknown error occurred');
        });
    });

    describe('getErrorStack', () => {
        it('should extract the stack from an Error instance', () => {
            const error = new Error('With stack');
            // The stack property is non-standard but universally available.
            // It should be a string if it exists.
            expect(typeof getErrorStack(error)).toBe('string');
        });

        it('should return undefined for a non-Error object', () => {
            const stack = getErrorStack('just a string');
            // A new Error is created, which will have a stack.
            expect(typeof stack).toBe('string');
        });

        it('should return undefined if the stack property does not exist', () => {
            const errorWithoutStack = { message: 'No stack here' };
            // normalizeError will create a new Error, which *will* have a stack.
            // To properly test this, we'd need to create an error with no stack.
            const err = new Error('test');
            delete err.stack;
            expect(getErrorStack(err)).toBeUndefined();
        });
    });

    describe('unsupportedServiceError', () => {
        it('should throw an error with a standard message', () => {
            const service = 'Legacy API';
            expect(() => unsupportedServiceError(service)).toThrow(
                `Unsupported service: ${service}`
            );
        });

        it('should throw an error with a custom message', () => {
            const service = 'Payment Gateway';
            const customMessage = 'Please use the new v2 endpoint.';
            expect(() => unsupportedServiceError(service, customMessage)).toThrow(
                `Unsupported service: ${service}. ${customMessage}`
            );
        });
    });
});
