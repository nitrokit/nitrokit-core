import { env, getBaseUrl } from '../../config';
import { Metadata } from 'next';

/**
 * Defines the structure for locale metadata used in alternates.
 */
export interface LocaleForMetadata {
    code: string;
    url: string;
}

/**
 * Defines the structure for translated metadata strings.
 */
export interface MetadataTranslations {
    applicationName: string;
    author: string;
    title: string;
    description: string;
}

/**
 * Generates the site metadata for the application.
 * @param locales - An array of locale objects for generating alternate links.
 * @param translations - An object containing translated strings for metadata.
 * @returns {Promise<Metadata>} The site metadata.
 */
export async function generateSiteMetadata(
    locales: LocaleForMetadata[],
    translations: MetadataTranslations
): Promise<Metadata> {
    const baseUrl = getBaseUrl();

    const imageData = {
        images: [{ url: baseUrl + '/api/og' }]
    };

    return {
        metadataBase: new URL(baseUrl),
        generator: 'Nitrokit',
        applicationName: translations.applicationName,
        referrer: 'origin-when-cross-origin',
        authors: [
            {
                name: 'Nitrokit',
                url: 'https://nitrokit.tr'
            }
        ],
        creator: translations.author,
        publisher: translations.author,
        appleWebApp: {
            statusBarStyle: 'black-translucent',
            title: translations.title,
            capable: true,
            startupImage: [
                {
                    url: `${baseUrl}/images/apple-touch-startup-image.png`,
                    media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)'
                }
            ]
        },
        title: {
            default: translations.title,
            template: `%s - ${translations.title}`
        },
        description: translations.description,
        alternates: {
            canonical: baseUrl,
            languages: Object.fromEntries(locales.map((LOCALE) => [LOCALE.code, LOCALE.url]))
        },
        icons: {
            icon: `${baseUrl}/favicon.ico`
        },
        twitter: {
            card: 'summary_large_image',
            title: translations.title,
            description: translations.description,
            creator: translations.author,
            ...imageData
        },
        openGraph: {
            title: translations.title,
            description: translations.description,
            url: baseUrl,
            siteName: translations.title,
            ...imageData
        },
        verification: {
            google: env.GOOGLE_SITE_VERIFICATION,
            yandex: env.YANDEX_VERIFICATION
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1
            }
        }
    };
}

export type PageMetaDataProps = Promise<{ title: string; description: string }>;

/**
 * Generates the page metadata for a specific page.
 * @param params - The parameters containing the title and description.
 * @returns {Promise<Metadata>} The page metadata.
 */
export async function generatePageMetadata({
    params
}: {
    params: PageMetaDataProps;
}): Promise<Metadata> {
    const { title, description } = await params;

    return {
        title,
        description
    };
}
