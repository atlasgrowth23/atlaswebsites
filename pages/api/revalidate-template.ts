import type { NextApiRequest, NextApiResponse } from 'next';
import { queryMany } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Get parameters
    const { slug, template_key } = req.body;
    
    if (!slug && !template_key) {
      // If no specific slug/template, revalidate all templates
      console.log('Revalidating all template pages...');
      
      // Get all company slugs
      const companies = await queryMany(`
        SELECT slug FROM companies ORDER BY name
      `);
      
      // Revalidate each template for each company
      const templates = ['boldenergy', 'moderntrust'];
      const revalidated: string[] = [];
      
      for (const company of companies) {
        for (const template of templates) {
          const path = `/t/${template}/${company.slug}`;
          await res.revalidate(path);
          revalidated.push(path);
          console.log(`Revalidated: ${path}`);
        }
      }
      
      return res.json({
        revalidated: true,
        paths: revalidated,
        count: revalidated.length
      });
    } else {
      // Revalidate specific template page
      const path = `/t/${template_key}/${slug}`;
      console.log(`Revalidating page: ${path}`);
      await res.revalidate(path);
      
      return res.json({
        revalidated: true,
        path
      });
    }
  } catch (err: any) {
    console.error('Error revalidating:', err);
    return res.status(500).json({
      error: 'Error revalidating pages',
      message: err.message
    });
  }
}