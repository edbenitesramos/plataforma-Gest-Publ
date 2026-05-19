/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  async rewrites() {
    const railwayUrl = process.env.RAILWAY_API_URL || 'https://plataforma-gest-publ-production.up.railway.app'
    return [
      {
        source: '/api/:path*',
        destination: `${railwayUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
