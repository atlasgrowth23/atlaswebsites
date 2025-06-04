import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// Admin user store
const USERS = {
  "nicholas@atlasgrowth.ai": { 
    password: "Matheos23$", 
    role: "admin", 
    states: ["Alabama", "Arkansas"],
    name: "Nicholas Matheos"
  },
  "jaredthompson@atlasgrowth.ai": { 
    password: "Jared100$", 
    role: "admin", 
    states: ["Alabama", "Arkansas"],
    name: "Jared Thompson"
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists and password matches
    const user = USERS[email as keyof typeof USERS];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        email: email,
        role: user.role,
        states: user.states,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set admin session cookie for tracking detection
    res.setHeader('Set-Cookie', [
      `admin-session=authenticated; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`, // 7 days
      `admin-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}` // 7 days
    ]);

    res.status(200).json({
      success: true,
      token,
      user: {
        email,
        role: user.role,
        states: user.states,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}