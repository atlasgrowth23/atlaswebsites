/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configure image domains
  images: {
    domains: [
        'images.unsplash.com', 
      'media.istockphoto.com',
      'lh3.googleusercontent.com',
      'lh5.googleusercontent.com',
      'encrypted-tbn0.gstatic.com',
      't3.ftcdn.net',
      't4.ftcdn.net',
      'localhost',
      'vercel.app',
      'replit.dev',
        'assets.zyrosite.com',
        'cbe1ed99-3526-45ea-acb4-7d87b19b3d41-00-16zbfl49bmyv8.riker.replit.dev',
        'assets.cdn.filesafe.space'
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
        hostname: 'lh5.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 't3.ftcdn.net',
      },
      {
        protocol: 'https',
        hostname: 't4.ftcdn.net',
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