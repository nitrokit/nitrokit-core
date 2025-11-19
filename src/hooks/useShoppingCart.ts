import React, { useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { CreatePaymentRequest, PaymentBasketItem } from '../services/payment/types';

export type CartItem = {
    id: string; // unique client-side identifier
    name: string;
    price: number; // minor units (kuruş / cents)
    currency: string; // ISO currency code e.g. TRY, USD
    quantity: number;
    imageUrl?: string;
    metadata?: Record<string, any>;
};

export interface CartState {
    items: Record<string, CartItem>;
    currency?: string; // derived from first item or explicitly set
    updatedAt: number;
}

type CartAction =
    | { type: 'ADD'; item: CartItem }
    | { type: 'UPDATE'; id: string; patch: Partial<Omit<CartItem, 'id'>> }
    | { type: 'REMOVE'; id: string }
    | { type: 'SET_QTY'; id: string; quantity: number }
    | { type: 'CLEAR' }
    | { type: 'SET'; state: CartState };

const initialState: CartState = { items: {}, updatedAt: Date.now() };

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case 'ADD': {
            const existing = state.items[action.item.id];
            const newQty = existing
                ? existing.quantity + action.item.quantity
                : action.item.quantity;
            const newItem: CartItem = existing ? { ...existing, quantity: newQty } : action.item;
            return {
                items: { ...state.items, [action.item.id]: newItem },
                currency: state.currency || action.item.currency,
                updatedAt: Date.now()
            };
        }
        case 'UPDATE': {
            const existing = state.items[action.id];
            if (!existing) return state;
            const updated: CartItem = { ...existing, ...action.patch };
            return {
                items: { ...state.items, [action.id]: updated },
                currency: state.currency,
                updatedAt: Date.now()
            };
        }
        case 'REMOVE': {
            if (!state.items[action.id]) return state;
            const clone = { ...state.items };
            delete clone[action.id];
            return {
                items: clone,
                currency: Object.values(clone)[0]?.currency,
                updatedAt: Date.now()
            };
        }
        case 'SET_QTY': {
            const existing = state.items[action.id];
            if (!existing) return state;
            const qty = Math.max(0, action.quantity);
            if (qty === 0) {
                const clone = { ...state.items };
                delete clone[action.id];
                return {
                    items: clone,
                    currency: Object.values(clone)[0]?.currency,
                    updatedAt: Date.now()
                };
            }
            return {
                items: { ...state.items, [action.id]: { ...existing, quantity: qty } },
                currency: state.currency,
                updatedAt: Date.now()
            };
        }
        case 'CLEAR': {
            return { items: {}, currency: undefined, updatedAt: Date.now() };
        }
        case 'SET': {
            return action.state;
        }
        default:
            return state;
    }
}

interface ShoppingCartContextValue {
    items: CartItem[];
    totalQuantity: number;
    totalAmount: number; // minor units
    currency?: string;
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    updateItem: (id: string, patch: Partial<Omit<CartItem, 'id'>>) => void;
    removeItem: (id: string) => void;
    setQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getItem: (id: string) => CartItem | undefined;
    isEmpty: boolean;
    formattedTotal: string;
    toPaymentRequest: (params: {
        orderId: string;
        email: string;
        successUrl: string;
        failUrl: string;
        currency?: string;
        installment?: number;
        userName?: string;
        userPhone?: string;
        userAddress?: string;
    }) => CreatePaymentRequest;
}

const ShoppingCartContext = React.createContext<ShoppingCartContextValue | undefined>(undefined);

export interface ShoppingCartProviderProps {
    children: React.ReactNode;
    /** Storage key used for persistence. Default: 'nitrokit-shopping-cart' */
    storageKey?: string;
    /** Enable persistence. Ignored if storageMode === 'none'. Default: true */
    persist?: boolean;
    /** Storage backend selection. 'local' (default), 'session', or 'none'. */
    storageMode?: 'local' | 'session' | 'none';
    /** Expire persisted cart after milliseconds. Undefined = no TTL. */
    expireAfterMs?: number;
    /** Preloaded initial items (e.g. server-render). */
    initialItems?: CartItem[];
    /** Format function override for totals. */
    formatTotal?: (amountMinor: number, currency?: string) => string;
}

export function ShoppingCartProvider({
    children,
    storageKey = 'nitrokit-shopping-cart',
    persist = true,
    storageMode = 'local',
    expireAfterMs,
    initialItems,
    formatTotal
}: ShoppingCartProviderProps) {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    // Hydrate from initialItems or localStorage
    useEffect(() => {
        if (initialItems && initialItems.length) {
            dispatch({
                type: 'SET',
                state: {
                    items: Object.fromEntries(initialItems.map((i) => [i.id, i])),
                    currency: initialItems[0]?.currency,
                    updatedAt: Date.now()
                }
            });
            return;
        }
        if (persist && storageMode !== 'none' && typeof window !== 'undefined') {
            try {
                const storageRef =
                    storageMode === 'session' ? window.sessionStorage : window.localStorage;
                const raw = storageRef.getItem(storageKey);
                if (raw) {
                    const parsed = JSON.parse(raw) as CartState;
                    if (
                        expireAfterMs &&
                        typeof parsed.updatedAt === 'number' &&
                        Date.now() - parsed.updatedAt > expireAfterMs
                    ) {
                        // expired; clear
                        storageRef.removeItem(storageKey);
                    } else {
                        dispatch({ type: 'SET', state: parsed });
                    }
                }
            } catch {}
        }
    }, [initialItems, persist, storageKey, storageMode, expireAfterMs]);

    // Persist on change
    useEffect(() => {
        if (!persist || storageMode === 'none' || typeof window === 'undefined') return;
        try {
            const storageRef =
                storageMode === 'session' ? window.sessionStorage : window.localStorage;
            storageRef.setItem(storageKey, JSON.stringify(state));
        } catch {}
    }, [state, persist, storageKey, storageMode]);

    const items = useMemo(() => Object.values(state.items), [state.items]);
    const totalQuantity = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
    const totalAmount = useMemo(
        () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        [items]
    );
    const currency = state.currency;

    const defaultFormatter = useCallback((amountMinor: number, curr?: string) => {
        if (!curr) return (amountMinor / 100).toFixed(2);
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: curr.toUpperCase()
            }).format(amountMinor / 100);
        } catch {
            return (amountMinor / 100).toFixed(2) + ' ' + curr;
        }
    }, []);
    const formattedTotal = (formatTotal || defaultFormatter)(totalAmount, currency);

    const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        const quantity = Math.max(1, item.quantity ?? 1);
        dispatch({ type: 'ADD', item: { ...item, quantity } });
    }, []);

    const updateItem = useCallback((id: string, patch: Partial<Omit<CartItem, 'id'>>) => {
        dispatch({ type: 'UPDATE', id, patch });
    }, []);

    const removeItem = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), []);
    const setQuantity = useCallback(
        (id: string, quantity: number) => dispatch({ type: 'SET_QTY', id, quantity }),
        []
    );
    const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
    const getItem = useCallback((id: string) => state.items[id], [state.items]);
    const isEmpty = items.length === 0;

    const toPaymentRequest = useCallback(
        (params: {
            orderId: string;
            email: string;
            successUrl: string;
            failUrl: string;
            currency?: string;
            installment?: number;
            userName?: string;
            userPhone?: string;
            userAddress?: string;
        }): CreatePaymentRequest => {
            if (isEmpty) {
                throw new Error('Cannot create payment request from empty cart');
            }
            const basket: PaymentBasketItem[] = items.map((i) => ({
                name: i.name,
                price: i.price,
                quantity: i.quantity
            }));
            const total = basket.reduce((sum, b) => sum + b.price * b.quantity, 0);
            return {
                orderId: params.orderId,
                amount: total,
                email: params.email,
                successUrl: params.successUrl,
                failUrl: params.failUrl,
                basket,
                currency: params.currency || currency || items[0].currency,
                installment: params.installment,
                userName: params.userName,
                userPhone: params.userPhone,
                userAddress: params.userAddress
            };
        },
        [items, isEmpty, currency]
    );

    const value: ShoppingCartContextValue = {
        items,
        totalQuantity,
        totalAmount,
        currency,
        addItem,
        updateItem,
        removeItem,
        setQuantity,
        clearCart,
        getItem,
        isEmpty,
        formattedTotal,
        toPaymentRequest
    };

    return React.createElement(ShoppingCartContext.Provider, { value, children });
}

export function useShoppingCart(): ShoppingCartContextValue {
    const ctx = useContext(ShoppingCartContext);
    if (!ctx) throw new Error('useShoppingCart must be used within ShoppingCartProvider');
    return ctx;
}
