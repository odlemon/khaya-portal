/** @type {import('next').NextConfig} */
const DEFAULT_BACKEND_URL = 'http://31.220.82.129:4002';

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['example.com', 'localhost', '31.220.82.129'],
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
