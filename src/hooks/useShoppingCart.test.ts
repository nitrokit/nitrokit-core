import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ShoppingCartProvider, useShoppingCart } from './useShoppingCart';

function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(ShoppingCartProvider, { persist: false, children });
}

describe('useShoppingCart', () => {
    beforeEach(() => {
        // nothing for now
    });

    it('adds items and aggregates quantity', () => {
        const { result } = renderHook(() => useShoppingCart(), { wrapper });
        act(() => {
            result.current.addItem({ id: 'a', name: 'Alpha', price: 1000, currency: 'usd' });
            result.current.addItem({
                id: 'b',
                name: 'Beta',
                price: 250,
                currency: 'usd',
                quantity: 2
            });
        });
        expect(result.current.totalQuantity).toBe(3);
        expect(result.current.totalAmount).toBe(1000 + 250 * 2);
    });

    it('increments quantity on duplicate add', () => {
        const { result } = renderHook(() => useShoppingCart(), { wrapper });
        act(() => {
            result.current.addItem({
                id: 'a',
                name: 'Alpha',
                price: 100,
                currency: 'try',
                quantity: 2
            });
            result.current.addItem({
                id: 'a',
                name: 'Alpha',
                price: 100,
                currency: 'try',
                quantity: 3
            });
        });
        const item = result.current.getItem('a');
        expect(item?.quantity).toBe(5);
        expect(result.current.totalAmount).toBe(100 * 5);
    });

    it('updates item fields', () => {
        const { result } = renderHook(() => useShoppingCart(), { wrapper });
        act(() => {
            result.current.addItem({ id: 'a', name: 'Alpha', price: 100, currency: 'usd' });
            result.current.updateItem('a', { name: 'Alpha-2', price: 150 });
        });
        const item = result.current.getItem('a');
        expect(item?.name).toBe('Alpha-2');
        expect(item?.price).toBe(150);
    });

    it('removes item when quantity set to 0', () => {
        const { result } = renderHook(() => useShoppingCart(), { wrapper });
        act(() => {
            result.current.addItem({ id: 'a', name: 'Alpha', price: 100, currency: 'usd' });
            result.current.setQuantity('a', 0);
        });
        expect(result.current.getItem('a')).toBeUndefined();
        expect(result.current.isEmpty).toBe(true);
    });

    it('creates payment request', () => {
        const { result } = renderHook(() => useShoppingCart(), { wrapper });
        act(() => {
            result.current.addItem({
                id: 'a',
                name: 'Alpha',
                price: 123,
                currency: 'usd',
                quantity: 2
            });
            result.current.addItem({
                id: 'b',
                name: 'Beta',
                price: 50,
                currency: 'usd',
                quantity: 1
            });
        });
        const req = result.current.toPaymentRequest({
            orderId: 'ORDER1',
            email: 'x@example.com',
            successUrl: 'https://ok',
            failUrl: 'https://fail'
        });
        expect(req.orderId).toBe('ORDER1');
        expect(req.amount).toBe(123 * 2 + 50);
        expect(req.basket).toBeDefined();
        expect(req.basket!.length).toBe(2);
        expect(req.currency?.toLowerCase()).toBe('usd');
    });

    it('clearCart empties everything', () => {
        const { result } = renderHook(() => useShoppingCart(), { wrapper });
        act(() => {
            result.current.addItem({ id: 'a', name: 'Alpha', price: 10, currency: 'usd' });
            result.current.addItem({ id: 'b', name: 'Beta', price: 20, currency: 'usd' });
            result.current.clearCart();
        });
        expect(result.current.items.length).toBe(0);
        expect(result.current.isEmpty).toBe(true);
    });

    it('does not persist when storageMode none', () => {
        const WrapperNone = ({ children }: { children: React.ReactNode }) =>
            React.createElement(ShoppingCartProvider, {
                persist: true,
                storageMode: 'none',
                children
            });
        const { result, unmount } = renderHook(() => useShoppingCart(), { wrapper: WrapperNone });
        act(() => {
            result.current.addItem({ id: 'x', name: 'X', price: 10, currency: 'usd' });
        });
        expect(result.current.totalQuantity).toBe(1);
        unmount();
        // Re-mount fresh
        const { result: result2 } = renderHook(() => useShoppingCart(), { wrapper: WrapperNone });
        expect(result2.current.totalQuantity).toBe(0);
    });

    it('persists with session storage mode', () => {
        const WrapperSession = ({ children }: { children: React.ReactNode }) =>
            React.createElement(ShoppingCartProvider, {
                persist: true,
                storageMode: 'session',
                children
            });
        const { result, unmount } = renderHook(() => useShoppingCart(), {
            wrapper: WrapperSession
        });
        act(() => {
            result.current.addItem({ id: 's', name: 'Session', price: 50, currency: 'usd' });
        });
        expect(result.current.totalQuantity).toBe(1);
        unmount();
        const { result: result3 } = renderHook(() => useShoppingCart(), {
            wrapper: WrapperSession
        });
        expect(result3.current.totalQuantity).toBe(1);
    });
});
