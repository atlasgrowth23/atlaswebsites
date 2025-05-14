import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  redirect?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { domain, path } = req.query;
  
  if (!domain) {
    return res.status(400).json({
      success: false,
      message: 'Domain parameter is required'
    });
  }
  
  const hostname = Array.isArray(domain) ? domain[0] : domain;
  const requestPath = Array.isArray(path) ? path[0] : path || '/';
  
  try {
    // Look up the company based on custom domain
    const companyResult = await query(`
      SELECT id, slug, name, custom_domain, subdomain, site FROM companies 
      WHERE custom_domain = $1
    `, [hostname]);
    
    if (companyResult.rows.length > 0) {
      const company = companyResult.rows[0];
      
      // Default to moderntrust template or use site value if specified
      const templateKey = company.site || 'moderntrust';
      
      // Rewrite the request to the template path
      res.redirect(302, `/t/${templateKey}/${company.slug}${requestPath === '/' ? '' : requestPath}`);
      return;
    }
    
    // Check if it might be a subdomain
    const subdomain = hostname.split('.')[0];
    
    if (subdomain) {
      const subdomainResult = await query(`
        SELECT id, slug, name, custom_domain, subdomain, site FROM companies 
        WHERE subdomain = $1
      `, [subdomain]);
      
      if (subdomainResult.rows.length > 0) {
        const company = subdomainResult.rows[0];
        
        // Default to moderntrust template or use site value if specified
        const templateKey = company.site || 'moderntrust';
        
        // Rewrite the request to the template path
        res.redirect(302, `/t/${templateKey}/${company.slug}${requestPath === '/' ? '' : requestPath}`);
        return;
      }
    }
    
    // If no company found for this domain, return to homepage
    res.redirect(302, '/');
    return;
  } catch (error: any) {
    console.error('Error in domain handler:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}