import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BackToTopButton } from '@/components/layout/BackToTopButton';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { DEFAULT_OG_IMAGE, SITE_LOGO_URL, SITE_NAME, SITE_SLOGAN, SITE_URL } from '@/lib/site';
import { ADSENSE_CLIENT_ID } from '@/lib/adsense';
import { GA_MEASUREMENT_ID } from '@/lib/gtag';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Noticias de La Rioja`,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_SLOGAN,
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/feed.xml',
      'application/atom+xml': '/atom.xml'
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_SLOGAN,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }]
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_SLOGAN,
    images: [DEFAULT_OG_IMAGE]
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }
    ],
    shortcut: '/favicon-32.png',
    apple: '/apple-touch-icon.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#0b4ea2'
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  '@id': `${SITE_URL}#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: SITE_LOGO_URL,
  email: 'contacto@lavozriojana.com',
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'La Rioja, Argentina'
  },
  founder: {
    '@type': 'Person',
    name: 'Fernando Nahim Mora'
  },
  ethicsPolicy: `${SITE_URL}/politica-editorial`,
  sameAs: ['https://facebook.com/lavozriojana', 'https://instagram.com/lavozriojana']
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { '@id': `${SITE_URL}#organization` },
  inLanguage: 'es-AR',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/buscar?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            /*
             * Consent Mode v2: por defecto denegamos analítica y publicidad hasta que
             * el usuario decida en el banner de cookies (components/layout/CookieConsent.tsx).
             * 'wait_for_update' evita que se dispare un evento antes de leer la decisión guardada.
             */
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              wait_for_update: 500
            });
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

        <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <div className="site-shell">
          <Header />
          <main className="site-main">{children}</main>
          <Footer />
        </div>
        <BackToTopButton />
        <CookieConsent />
      </body>
    </html>
  );
}
