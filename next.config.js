/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configure image domains
  images: {
    domains: [
      'images.unsplash.com', 
      'media.istockphoto.com',
      'lh3.googleusercontent.com',
      'localhost',
      'vercel.app',
      'replit.dev'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'media.istockphoto.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.replit.dev',
      },
    ],
    // Allow unoptimized images for dev mode
    unoptimized: process.env.NODE_ENV === 'development'
  },
  
  // Environment variables made available to the browser
  env: {
    PRIMARY_DOMAIN: process.env.PRIMARY_DOMAIN || 'yourdomain.com',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
  
  // Allow deployment for cross-origin requests
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  }
}

module.exports = nextConfig