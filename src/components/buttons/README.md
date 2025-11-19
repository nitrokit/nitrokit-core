# GitHub Button Component

Animated GitHub button with live stats (stars & forks) and confetti effect.

## Features

- 🌟 Real-time star and fork counts
- 🎉 Confetti animation on hover
- 🌓 Dark mode support
- 📱 Fully responsive
- 🔧 Customizable labels (i18n ready)
- ⚡ Optimized loading states

## Usage

```tsx
import { GithubButtonWithStats } from '@nitrokit/core/components';

function MyComponent() {
    return (
        <GithubButtonWithStats
            githubUrl="https://github.com/nitrokit/nitrokit-core"
            labels={{
                buttonTitle: 'Star on GitHub',
                loading: 'Loading...',
                starTitle: 'Give us a Star',
                starDescription: 'Support our project',
                forkTitle: 'Fork Repository',
                forkDescription: 'Create your own copy',
                viewTitle: 'View Repository',
                viewDescription: 'Explore the code',
                viewBadge: 'Open'
            }}
        />
    );
}
```

## Props

| Prop        | Type     | Required | Default   | Description                     |
| ----------- | -------- | -------- | --------- | ------------------------------- |
| `githubUrl` | `string` | ✅       | -         | Full GitHub repository URL      |
| `labels`    | `object` | ❌       | See below | Text labels for all UI elements |

### Default Labels

```ts
{
  buttonTitle: 'GitHub',
  loading: '...',
  starTitle: 'Star on GitHub',
  starDescription: 'Support the project',
  forkTitle: 'Fork Repository',
  forkDescription: 'Create your own copy',
  viewTitle: 'View on GitHub',
  viewDescription: 'Explore the codebase',
  viewBadge: 'Open'
}
```

## Integration with i18n

```tsx
import { useTranslations } from 'next-intl';
import { GithubButtonWithStats } from '@nitrokit/core/components';

function MyComponent() {
    const t = useTranslations('buttons.github');

    return (
        <GithubButtonWithStats
            githubUrl="https://github.com/owner/repo"
            labels={{
                buttonTitle: t('button.title'),
                loading: t('button.loading'),
                starTitle: t('dropdown.star.title'),
                starDescription: t('dropdown.star.description'),
                forkTitle: t('dropdown.fork.title'),
                forkDescription: t('dropdown.fork.description'),
                viewTitle: t('dropdown.view.title'),
                viewDescription: t('dropdown.view.description'),
                viewBadge: t('dropdown.view.badge')
            }}
        />
    );
}
```

## Dependencies

Required peer dependencies:

- `lucide-react` (icons)
- `@nitrokit/core` (hooks: `useCanvasConfetti`, `useGithubStats`, `formatCompactNumber`)

## Styling

Uses Tailwind CSS with dark mode support. Ensure your project has:

- Tailwind CSS configured
- Dark mode enabled (`darkMode: 'class'` or `darkMode: 'media'`)

---

# Vercel Deploy Button Component

One-click deployment button for Vercel with dropdown menu (deploy, preview, docs) and confetti effect.

## Features

- 🚀 Quick deployment to Vercel
- 🎉 Confetti animation on hover
- 🌓 Dark mode support
- 📱 Fully responsive
- 🔧 Customizable labels (i18n ready)
- 🔗 Preview and docs links

## Usage

```tsx
import { VercelDeployButton } from '@nitrokit/core/components';
import { VercelDeployUrlBuilder } from '@nitrokit/core';

function MyComponent() {
    const deployUrl = new VercelDeployUrlBuilder()
        .withRepositoryUrl('https://github.com/owner/repo')
        .withProjectName('my-project')
        .withEnv('API_KEY', 'DATABASE_URL')
        .withDemoTitle('My App')
        .withDemoDescription('Description')
        .withDemoUrl('https://demo.example.com')
        .build();

    return (
        <VercelDeployButton
            deployUrl={deployUrl}
            previewUrl="https://preview.example.com"
            labels={{
                buttonTitle: 'Deploy',
                deployTitle: 'Deploy to Vercel',
                deployDescription: 'One-click deployment',
                deployBadge: 'Deploy',
                previewTitle: 'Live Preview',
                previewDescription: 'View demo',
                previewBadge: 'Preview',
                docsTitle: 'Documentation',
                docsDescription: 'Learn more',
                docsBadge: 'Docs'
            }}
        />
    );
}
```

## Props

| Prop         | Type     | Required | Default                   | Description                                                |
| ------------ | -------- | -------- | ------------------------- | ---------------------------------------------------------- |
| `deployUrl`  | `string` | ✅       | -                         | Vercel deploy URL (use `VercelDeployUrlBuilder` or custom) |
| `previewUrl` | `string` | ✅       | -                         | Preview/demo site URL                                      |
| `docsUrl`    | `string` | ❌       | `https://vercel.com/docs` | Documentation URL                                          |
| `labels`     | `object` | ❌       | See below                 | Text labels for all UI elements                            |

### Default Labels

```ts
{
  buttonTitle: 'Deploy',
  deployTitle: 'Deploy to Vercel',
  deployDescription: 'One-click deployment',
  deployBadge: 'Deploy',
  previewTitle: 'Live Preview',
  previewDescription: 'View demo',
  previewBadge: 'Preview',
  docsTitle: 'Documentation',
  docsDescription: 'Learn more',
  docsBadge: 'Docs'
}
```

## Using VercelDeployUrlBuilder

```tsx
import { VercelDeployUrlBuilder } from '@nitrokit/core';

const deployUrl = new VercelDeployUrlBuilder()
    .withRepositoryUrl('https://github.com/nitrokit/nitrokit-nextjs')
    .withProjectName('nitrokit')
    .withRepositoryName('nitrokit-nextjs')
    .withEnv('AUTH_SECRET', 'DATABASE_URL', 'RESEND_API_KEY')
    .withDemoTitle('Nitrokit')
    .withDemoDescription('Modern Next.js starter kit')
    .withDemoUrl('https://preview.nitrokit.tr')
    .withDemoImage('https://example.com/screenshot.png')
    .build();
```

## Integration with i18n

```tsx
import { useTranslations } from 'next-intl';
import { VercelDeployButton } from '@nitrokit/core/components';

function MyComponent() {
    const t = useTranslations('buttons.vercel');

    return (
        <VercelDeployButton
            deployUrl={deployUrl}
            previewUrl={previewUrl}
            labels={{
                buttonTitle: t('button.title'),
                deployTitle: t('dropdown.deploy.title'),
                deployDescription: t('dropdown.deploy.description'),
                deployBadge: t('dropdown.deploy.badge'),
                previewTitle: t('dropdown.preview.title'),
                previewDescription: t('dropdown.preview.description'),
                previewBadge: t('dropdown.preview.badge'),
                docsTitle: t('dropdown.docs.title'),
                docsDescription: t('dropdown.docs.description'),
                docsBadge: t('dropdown.docs.badge')
            }}
        />
    );
}
```

## Dependencies

Required peer dependencies:

- `lucide-react` (icons)
- `@nitrokit/core` (hooks: `useCanvasConfetti`, builder: `VercelDeployUrlBuilder`)

## Styling

Uses Tailwind CSS with dark mode support. Ensure your project has:

- Tailwind CSS configured
- Dark mode enabled (`darkMode: 'class'` or `darkMode: 'media'`)
