import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@/lib/db';
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
  const urlString = url.trim();
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

      // Validate inputs
      const validatedCompanyId = validateCompanyId(companyId);
      
      if (!customizations || typeof customizations !== 'object') {
        return res.status(400).json({ 
          error: 'Invalid customizations data',
          code: 'VALIDATION_ERROR'
        });
      }

      // Verify company exists
      const company = await queryOne('SELECT id, slug FROM companies WHERE id = $1', [validatedCompanyId]);
      if (!company) {
        return res.status(404).json({ 
          error: 'Company not found',
          code: 'COMPANY_NOT_FOUND'
        });
      }

      const updatedFrames: string[] = [];
      const errors: string[] = [];

      // Process each customization
      for (const [frameKey, imageUrl] of Object.entries(customizations)) {
        try {
          // Validate frame key (basic validation)
          if (!/^[a-z_]+$/.test(frameKey)) {
            errors.push(`Invalid frame key: ${frameKey}`);
            continue;
          }

          if (imageUrl && imageUrl.toString().trim() !== '') {
            const validatedUrl = validateImageUrl(imageUrl);
            
            // Insert or update company frame using upsert
            await query(`
              INSERT INTO company_frames (company_id, slug, url, updated_at)
              VALUES ($1, $2, $3, NOW())
              ON CONFLICT (company_id, slug)
              DO UPDATE SET 
                url = EXCLUDED.url,
                updated_at = EXCLUDED.updated_at
            `, [validatedCompanyId, frameKey, validatedUrl]);
            
            updatedFrames.push(frameKey);
            console.log(`✅ Saved company frame: ${frameKey} = ${validatedUrl}`);
          } else if (imageUrl === '') {
            // Remove frame if explicitly set to empty
            await query(`
              DELETE FROM company_frames 
              WHERE company_id = $1 AND slug = $2
            `, [validatedCompanyId, frameKey]);
            
            console.log(`❌ Removed company frame: ${frameKey}`);
          }
        } catch (frameError) {
          console.error(`Error processing frame ${frameKey}:`, frameError);
          errors.push(`Failed to process ${frameKey}: ${frameError instanceof Error ? frameError.message : String(frameError)}`);
        }
      }

      // Invalidate cache
      cacheHelpers.invalidateCompany(company.slug, validatedCompanyId);

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