/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh1.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh2.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh7.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh8.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh9.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.app.github.dev',
      },
      {
        protocol: 'https',
        hostname: 'fictional-spoon-pj94pvvr49w4f6jp-5000.app.github.dev',
      },
      {
        protocol: 'https',
        hostname: '*.github.dev',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: '*.imgur.com',
      },
      {
        protocol: 'https',
        hostname: '*.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'widgets.leadconnectorhq.com',
      },
      {
        protocol: 'https',
        hostname: '*.leadconnectorhq.com',
      },
      {
        protocol: 'https',
        hostname: '*.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: '*.freepik.com',
      },
      {
        protocol: 'https',
        hostname: '*.shutterstock.com',
      },
    ],
    unoptimized: false,
    loader: 'default',
  },
}

module.exports = nextConfig