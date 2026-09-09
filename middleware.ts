import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isDev = process.env.NODE_ENV !== 'production';
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL || process.env.R2_PUBLIC_BASE_URL || 'https://media.lavozriojana.com';

  /*
   * Google tag (gtag.js) + AdSense necesitan cargar scripts, hacer beacons/XHR
   * y renderizar iframes desde dominios de Google. Antes esta CSP solo permitía
   * 'self', lo que bloqueaba silenciosamente Analytics y los anuncios en producción.
   */
  const googleScriptSrc = [
    'https://www.googletagmanager.com',
    'https://pagead2.googlesyndication.com',
    'https://www.google-analytics.com',
    'https://googleads.g.doubleclick.net',
    'https://www.google.com'
  ];
  const googleConnectSrc = [
    'https://www.google-analytics.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://pagead2.googlesyndication.com',
    'https://*.googlesyndication.com',
    'https://googleads.g.doubleclick.net'
  ];
  const googleFrameSrc = [
    'https://googleads.g.doubleclick.net',
    'https://tpc.googlesyndication.com',
    'https://www.google.com',
    'https://*.googlesyndication.com'
  ];
  const googleImgSrc = [
    'https://www.google-analytics.com',
    'https://pagead2.googlesyndication.com',
    'https://*.googlesyndication.com',
    'https://*.g.doubleclick.net'
  ];

  const scriptPolicy = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' ${googleScriptSrc.join(' ')}`
    : `'self' 'unsafe-inline' ${googleScriptSrc.join(' ')}`;

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `img-src 'self' data: blob: ${mediaUrl} ${googleImgSrc.join(' ')}`,
      `script-src ${scriptPolicy}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      `connect-src 'self' ${googleConnectSrc.join(' ')}`,
      `frame-src 'self' ${googleFrameSrc.join(' ')}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );

  const origin = request.headers.get('origin');
  const allowedOrigins = (process.env.ALLOWED_API_ORIGINS || 'https://lavozriojana.com')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
