import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== (process.env.REVALIDATE_SECRET || 'dev-secret')) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const path = req.query.path as string;
    
    if (!path) {
      return res.status(400).json({ message: 'Path is required' });
    }

    // This will revalidate the page at the given path
    await res.revalidate(path);
    
    console.log(`✅ Revalidated: ${path}`);
    return res.json({ 
      revalidated: true, 
      path,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Revalidation error:', err);
    return res.status(500).json({ 
      message: 'Error revalidating',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}