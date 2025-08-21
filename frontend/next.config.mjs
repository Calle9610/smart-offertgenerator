/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: 'http://backend:8000/admin/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*',
      },
    ]
  },
}

export default nextConfig
