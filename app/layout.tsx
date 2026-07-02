import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BackToTopButton } from '@/components/layout/BackToTopButton';
import { DEFAULT_OG_IMAGE, SITE_LOGO_URL, SITE_NAME, SITE_SLOGAN, SITE_URL } from '@/lib/site';

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
      { url: '/logo.png', type: 'image/png' }
    ],
    shortcut: '/logo.png',
    apple: '/logo.png'
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
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <div className="site-shell">
          <Header />
          <main className="site-main">{children}</main>
          <Footer />
        </div>
        <BackToTopButton />
      </body>
    </html>
  );
}
