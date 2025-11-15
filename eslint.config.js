import globals from 'globals';
import * as tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tailwindPlugin from 'eslint-plugin-tailwindcss';
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        ignores: ['node_modules/', 'dist/', '.pnpm-store/', '**/*.config.js', '**/*.config.ts']
    },
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: {
            'react-hooks': reactHooksPlugin,
            '@next/next': nextPlugin,
            tailwindcss: tailwindPlugin
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        rules: {
            // React Hooks Rules
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // Next.js Rules
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs['core-web-vitals'].rules,
            '@next/next/no-html-link-for-pages': 'off',

            // Tailwind CSS Rules
            ...tailwindPlugin.configs.recommended.rules,
            'tailwindcss/no-custom-classname': 'off',

            // Custom Overrides
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off'
        }
    },
    prettierConfig
];
