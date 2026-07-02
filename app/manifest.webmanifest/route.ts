import { SITE_NAME, SITE_SLOGAN } from '@/lib/site';

export function GET() {
  return Response.json({
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_SLOGAN,
    lang: 'es-AR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0b4ea2',
    icons: [
      { src: '/logo.png', sizes: '1254x1254', type: 'image/png' },
      { src: '/brand-logo.svg', sizes: 'any', type: 'image/svg+xml' }
    ]
  });
}
