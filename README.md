<div align="center">
  <a href="https://nitrokit.tr">
    <img alt="Nitrokit Core Logo" src="https://raw.githubusercontent.com/nitrokit/nitrokit-core/refs/heads/main/assets/nitrokit-core.png" height="150">
  </a>

# @nitrokit/core

[![NPM Version](https://img.shields.io/npm/v/%40nitrokit%2Fcore)](https://www.npmjs.com/package/@nitrokit/core)
[![License](https://img.shields.io/npm/l/%40nitrokit%2Fcore)](https://github.com/nitrokit/nitrokit-core/blob/main/LICENSE)
[![CodeFactor](https://www.codefactor.io/repository/github/nitrokit/nitrokit-core/badge)](https://www.codefactor.io/repository/github/nitrokit/nitrokit-core) [![codecov](https://codecov.io/gh/nitrokit/nitrokit-core/graph/badge.svg?token=XXUgG0K0dF)](https://codecov.io/gh/nitrokit/nitrokit-core)

</div>

## Core Logic & Infrastructure for NitroKit Applications

This repository contains the **core hooks, shared utilities, and foundational types** designed to power all applications within the NitroKit ecosystem. It serves as the single source of truth for features that require consistency, high performance, and strict type safety across different projects.

---

### ✨ Features

The `@nitrokit/core` package encapsulates complex, reusable functionalities to ensure modularity and maintainability:

- **React Hooks:** A collection of powerful hooks for common UI and application logic, such as `useClickOutside`, `useHotkeys`, `useMobile`, and `useCookieConsent`.
- **Utility Functions:** A suite of helpers for class name merging (`cn`), error handling, and formatting (`formatCompactNumber`, `formatPhoneForDisplay`).
- **Type-Safe Environment Variables:** A wrapper around `@t3-oss/env-nextjs` to easily manage and validate environment variables on both server and client.
- **Builders:** Fluent builder classes like `VercelDeployUrlBuilder` to construct complex URLs programmatically.
- **SEO & Metadata Helpers:** Flexible functions like `generateSiteMetadata` to programmatically generate Next.js metadata, decoupled from translation and routing logic.
- **Shared Types:** Centralized TypeScript types and interfaces (e.g., for GitHub API responses) to ensure consistency across your projects.

---

### 🛠️ Installation

Install the package using your favorite package manager:

```bash
pnpm add @nitrokit/core
# or
npm install @nitrokit/core
# or
yarn add @nitrokit/core
```

### 🚀 Usage

Easily import and use the provided hooks and utilities in your React components.

```tsx
import { useMobile, cn } from '@nitrokit/core';

function MyResponsiveComponent({ isActive }) {
    const isMobile = useMobile();

    const containerClasses = cn(
        'transition-all duration-300',
        { 'bg-blue-500 text-white': isActive },
        isMobile ? 'p-4' : 'p-8'
    );

    return (
        <div className={containerClasses}>
            {isMobile ? 'This is the mobile view.' : 'This is the desktop view.'}
        </div>
    );
}
```

### 📦 API Overview

The library exposes several modules from its main entry point:

- **Hooks:** `useCanvasConfetti`, `useClickOutside`, `useCookieConsent`, `useHotkeys`, `useHoverEffects`, `useMobile`, `useNextTheme`.
    - New: `useShoppingCart` – lightweight cart state + payment request conversion.
- **Utilities:** `cn`, `delay`, `getErrorMessage`, `formatCompactNumber`, `formatPhoneForDisplay`, and more.
- **Types:** `GitHubRepository`, `GitHubRelease`, `RepoStats`, and other shared interfaces.
- **Server-side Environment:** For server-side code, import environment variables from the dedicated entry point:
    ```javascript
    import { env } from '@nitrokit/core/env';
    ```

---

### 🛒 Shopping Cart Hook (`useShoppingCart`)

Persisted (or ephemeral) cart management integrated with the payment providers. Items are stored in minor currency units (cents / kuruş) for precision.

```tsx
import { ShoppingCartProvider, useShoppingCart } from '@nitrokit/core';

function App() {
    return (
        <ShoppingCartProvider storageMode="local" expireAfterMs={1000 * 60 * 60 /* 1h */}>
            <CartView />
        </ShoppingCartProvider>
    );
}

function CartView() {
    const { items, addItem, formattedTotal, toPaymentRequest, clearCart } = useShoppingCart();

    return (
        <div>
            <button
                onClick={() =>
                    addItem({
                        id: 'sku-1',
                        name: 'T-Shirt',
                        price: 8990,
                        currency: 'try',
                        imageUrl: '/tshirt.png'
                    })
                }
            >
                Add T‑Shirt
            </button>

            <ul>
                {items.map((i) => (
                    <li key={i.id}>
                        {i.name} x{i.quantity} = {(i.price * i.quantity) / 100}{' '}
                        {i.currency.toUpperCase()}
                    </li>
                ))}
            </ul>

            <strong>Total: {formattedTotal}</strong>

            <button
                onClick={() => {
                    const req = toPaymentRequest({
                        orderId: 'ORDER-123',
                        email: 'user@example.com',
                        successUrl: 'https://example.com/pay/success',
                        failUrl: 'https://example.com/pay/fail'
                    });
                    // Pass req to PaymentService / provider
                    console.log('PaymentRequest', req);
                }}
            >
                Checkout
            </button>

            <button onClick={clearCart}>Clear</button>
        </div>
    );
}
```

Props / Options:

- `storageMode`: `'local' | 'session' | 'none'` (default `local`).
- `persist`: boolean (default `true`, ignored if `storageMode==='none'`).
- `expireAfterMs`: optional TTL; expired carts are ignored and cleared on load.
- `formatTotal`: override default currency formatting.
- `initialItems`: prehydrate (e.g., server or SSR bootstrap).

API methods:

- `addItem`, `updateItem`, `removeItem`, `setQuantity`, `clearCart`.
- `formattedTotal`, `totalAmount` (minor units), `totalQuantity`.
- `toPaymentRequest(params)` converts current cart into a `CreatePaymentRequest` suitable for providers (PayTR / Stripe).

Cart Item Shape:

```ts
{ id: string; name: string; price: number; currency: string; quantity: number; imageUrl?: string; metadata?: Record<string, any>; }
```

Minor Units: Store prices as integer minor units (e.g. 89.90 TRY -> `8990`) to avoid floating point rounding errors.

---

### 🧑‍💻 Contributing

Contributions are welcome! To get started with development, clone the repository and install the dependencies.

```bash
pnpm install
```

#### Available Scripts

- **`pnpm build`**: Builds the library for production, including JavaScript files and TypeScript declarations.
- **`pnpm dev`**: Starts the TypeScript compiler in watch mode for active development.
- **`pnpm test`**: Runs the entire test suite once.
- **`pnpm lint`**: Lints the codebase for errors and style issues.
- **`pnpm format:write`**: Formats the entire codebase using Prettier.

---

### 📄 License

This project is licensed under the **Apache-2.0 License**. See the LICENSE file for details.
