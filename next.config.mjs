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
    minimumCacheTTL: 31536000
  },
  async headers() {
    return [
      {
        source: '/:path(logo.png|brand-logo.svg|favicon.svg|favicon-32.png|apple-touch-icon.png)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      }
    ];
  }
};

export default nextConfig;
