/** @type {import('next').NextConfig} */
const DEFAULT_BACKEND_URL = 'http://207.180.234.151:4002';

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['example.com', 'localhost', '207.180.234.151'],
  },
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/+$/, '');
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
