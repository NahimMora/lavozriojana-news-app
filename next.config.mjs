/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // Hostinger exposes the host CPU count, which can exhaust the account's
  // process allowance during static generation (EAGAIN). Build sequentially.
  experimental: {
    cpus: 1
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.lavozriojana.com'
      }
    ],
    minimumCacheTTL: 31536000,
    /* Fewer widths than Next's default (8 + 8): each image's srcset repeats in
       the HTML, and nothing here is shown wider than 1920px. */
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384]
  },
  async headers() {
    return [
      {
        source: '/:path(logo.png|brand-logo.svg|favicon.svg|favicon-32.png|apple-touch-icon.png)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      },
      {
        // Fixed name, so not immutable: a new version must reach crawlers within a day.
        source: '/og-default.jpg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }]
      }
    ];
  }
};

export default nextConfig;
