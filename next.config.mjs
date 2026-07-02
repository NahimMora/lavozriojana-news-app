/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
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
