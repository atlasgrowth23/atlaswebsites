import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Admin detection with proper JWT verification
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for admin session cookie (set when logging into admin)
    const adminCookie = req.cookies['admin-session'];
    const adminToken = req.cookies['admin-token'];
    
    if (adminCookie === 'authenticated' && adminToken) {
      try {
        // Verify the JWT token
        const decoded = jwt.verify(adminToken, JWT_SECRET) as any;
        if (decoded.role === 'admin') {
          return res.status(200).json({ isAdmin: true, user: decoded });
        }
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError);
      }
    }

    // Check for authorization header from admin login
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role === 'admin') {
          return res.status(200).json({ isAdmin: true, user: decoded });
        }
      } catch (jwtError) {
        console.log('Authorization header JWT failed:', jwtError);
      }
    }

    // Check IP-based admin detection (optional - for your specific IPs)
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const adminIPs = process.env.ADMIN_IPS?.split(',') || [];
    
    if (adminIPs.some(ip => clientIp?.toString().includes(ip.trim()))) {
      return res.status(200).json({ isAdmin: true });
    }

    // Check for localhost/development access
    if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp?.includes('localhost')) {
      return res.status(200).json({ isAdmin: true });
    }

    // Default: not admin
    return res.status(200).json({ isAdmin: false });

  } catch (error) {
    console.error('Admin check error:', error);
    // On error, assume not admin for safety
    return res.status(200).json({ isAdmin: false });
  }
}