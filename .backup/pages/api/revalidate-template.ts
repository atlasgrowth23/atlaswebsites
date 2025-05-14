import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  revalidated: boolean;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Check for secret to confirm this is a valid request
  if (process.env.REVALIDATE_SECRET && req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ 
      revalidated: false,
      message: 'Invalid token' 
    });
  }
  
  try {
    const { slug, template } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        revalidated: false,
        message: 'Missing slug parameter'
      });
    }

    // Revalidate the specific template page
    if (template && typeof template === 'string') {
      await res.revalidate(`/t/${template}/${slug}`);
    } 
    
    // Also revalidate the redirect page for the slug
    await res.revalidate(`/${slug}`);

    return res.json({
      revalidated: true,
      message: 'Paths revalidated successfully'
    });
  } catch (err: any) {
    // If there was an error, Next.js will continue to show the last successfully
    // generated page
    return res.status(500).send({ 
      revalidated: false,
      message: 'Error revalidating: ' + err.message
    });
  }
}