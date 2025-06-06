import { NextApiRequest, NextApiResponse } from 'next';
import { setCompanyFrame, getCompanyBySlug } from '@/lib/supabase-db';
import { cacheHelpers } from '@/lib/cache';

// Input validation
function validateCompanyId(companyId: any): string {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new Error('Invalid company ID');
  }
  return companyId.trim();
}

function validateSlug(slug: any): string {
  if (!slug || typeof slug !== 'string' || slug.trim() === '') {
    throw new Error('Invalid slug');
  }
  // Basic slug validation
  if (!/^[a-z0-9-]+$/.test(slug.trim())) {
    throw new Error('Slug contains invalid characters');
  }
  return slug.trim();
}

function validateImageUrl(url: any): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '';
  }
  let urlString = url.trim();
  
  // Extract raw URL from Next.js processed URLs
  if (urlString.includes('/_next/image?url=')) {
    try {
      const nextUrl = new URL(urlString);
      const rawUrl = nextUrl.searchParams.get('url');
      if (rawUrl) {
        urlString = decodeURIComponent(rawUrl);
        console.log(`📎 Extracted raw URL: ${urlString} from Next.js processed URL`);
      }
    } catch (e) {
      console.warn('Failed to extract URL from Next.js processed URL:', e);
    }
  }
  
  try {
    new URL(urlString);
    return urlString;
  } catch {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  const { slug, template, getCompany } = req.query;

  if (req.method === 'GET') {
    try {
      const validatedSlug = validateSlug(slug);
      
      // Use cached company lookup
      const company = await cacheHelpers.getCompany(validatedSlug);

      if (!company) {
        return res.status(404).json({ 
          error: 'Company not found',
          code: 'COMPANY_NOT_FOUND'
        });
      }

      // If requesting company data only
      if (getCompany === 'true') {
        return res.status(200).json(company);
      }

      // Get existing company frames using cache
      const frames = await cacheHelpers.getCompanyFrames(company.id);

      // Convert to the format expected by the editor
      const customizations = frames ? Object.entries(frames)
        .filter(([key, value]) => key !== 'company_id' && key !== 'id')
        .map(([frame_key, image_url]) => ({
          customization_type: frame_key,
          custom_value: image_url
        })) : [];

      res.status(200).json(customizations);
    } catch (error) {
      console.error('Error fetching customizations:', error);
      
      if (error instanceof Error && error.message.includes('Invalid')) {
        return res.status(400).json({ 
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to fetch customizations',
        code: 'INTERNAL_ERROR'
      });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { companyId, templateKey, customizations } = req.body;
      console.log('🔧 POST request received:', { companyId, templateKey, customizations });

      // Validate inputs
      const validatedCompanyId = validateCompanyId(companyId);
      console.log('✅ Validated company ID:', validatedCompanyId);
      
      if (!customizations || typeof customizations !== 'object') {
        return res.status(400).json({ 
          error: 'Invalid customizations data',
          code: 'VALIDATION_ERROR'
        });
      }

      // Verify company exists using Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, slug')
        .eq('id', validatedCompanyId)
        .single();
        
      if (error || !company) {
        return res.status(404).json({ 
          error: 'Company not found',
          code: 'COMPANY_NOT_FOUND'
        });
      }

      const updatedFrames: string[] = [];
      const errors: string[] = [];

      // Use supabaseAdmin to bypass RLS
      const { supabaseAdmin } = await import('@/lib/supabase');

      // Process each customization
      for (const [frameKey, imageUrl] of Object.entries(customizations)) {
        try {
          // Validate frame key (basic validation)
          if (!/^[a-z0-9_]+$/.test(frameKey)) {
            errors.push(`Invalid frame key: ${frameKey}`);
            continue;
          }

          if (imageUrl && imageUrl.toString().trim() !== '') {
            const validatedUrl = validateImageUrl(imageUrl);
            
            console.log(`🔧 Attempting to save: company_id=${validatedCompanyId}, slug=${frameKey}, url=${validatedUrl}`);
            
            const { data, error: frameError } = await supabaseAdmin
              .from('company_frames')
              .upsert({
                company_id: validatedCompanyId,
                slug: frameKey,
                url: validatedUrl,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'company_id,slug'
              })
              .select();

            if (frameError) {
              console.error(`Database error for ${frameKey}:`, frameError);
              errors.push(`Database error for ${frameKey}: ${frameError.message}`);
            } else {
              console.log(`💾 Database result:`, data?.[0]);
              updatedFrames.push(frameKey);
              console.log(`✅ Saved company frame: ${frameKey} = ${validatedUrl}`);
            }
            
          } else if (imageUrl === '') {
            // Remove frame if explicitly set to empty
            const { error: deleteError } = await supabaseAdmin
              .from('company_frames')
              .delete()
              .eq('company_id', validatedCompanyId)
              .eq('slug', frameKey);
              
            if (deleteError) {
              console.error(`Delete error for ${frameKey}:`, deleteError);
              errors.push(`Delete error for ${frameKey}: ${deleteError.message}`);
            } else {
              console.log(`❌ Removed company frame: ${frameKey}`);
            }
          }
        } catch (frameError) {
          console.error(`Error processing frame ${frameKey}:`, frameError);
          errors.push(`Failed to process ${frameKey}: ${frameError instanceof Error ? frameError.message : String(frameError)}`);
        }
      }

      // Invalidate cache
      cacheHelpers.invalidateCompany(company.slug, validatedCompanyId);

      // Trigger Next.js revalidation for the company's template page
      if (updatedFrames.length > 0) {
        try {
          const templateKey = 'moderntrust'; // Could be dynamic based on company.template_key
          const revalidateUrl = `/t/${templateKey}/${company.slug}`;
          
          // Determine base URL for revalidation
          const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';
          
          const revalidateEndpoint = `${baseUrl}/api/revalidate?path=${encodeURIComponent(revalidateUrl)}&secret=${process.env.REVALIDATE_SECRET || 'dev-secret'}`;
          
          console.log(`🔄 Triggering revalidation: ${revalidateEndpoint}`);
          
          // Trigger revalidation (this will regenerate the page)
          const revalidateResponse = await fetch(revalidateEndpoint);
          const revalidateData = await revalidateResponse.text();
          
          console.log(`✅ Revalidation response: ${revalidateResponse.status} - ${revalidateData}`);
        } catch (revalidateError) {
          console.warn('⚠️ Revalidation failed:', revalidateError);
          // Don't fail the whole request if revalidation fails
        }
      }

      // Return response with details
      if (errors.length > 0) {
        return res.status(207).json({ 
          success: true,
          partial: true,
          updatedFrames,
          errors,
          message: `${updatedFrames.length} frames updated, ${errors.length} errors`
        });
      }

      res.status(200).json({ 
        success: true,
        updatedFrames,
        message: `Successfully updated ${updatedFrames.length} frames`
      });
    } catch (error) {
      console.error('Error saving customizations:', error);
      
      if (error instanceof Error && error.message.includes('Invalid')) {
        return res.status(400).json({ 
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to save customizations',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}