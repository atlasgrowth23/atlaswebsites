import { queryOne } from './db';

/**
 * Gets the appropriate image URL based on company frames or default frames
 * @param company Company data that may include frame data
 * @param frameName Name of the frame to look for (e.g., 'hero-bg', 'about-photo-1')
 * @returns URL to the appropriate image
 */
export async function getFrame(companyId: string, frameName: string): Promise<string> {
  try {
    // First try to get a company-specific frame
    const companyFrame = await queryOne(
      `SELECT url FROM company_frames 
       WHERE company_id = $1 AND slug = $2`, 
      [companyId, frameName]
    );
    
    if (companyFrame) {
      return companyFrame.url;
    }
    
    // Fall back to default frame
    const defaultFrame = await queryOne(
      `SELECT default_url FROM frames WHERE slug = $1`,
      [frameName]
    );
    
    if (defaultFrame) {
      return defaultFrame.default_url;
    }
    
    // If no frame is found, return a placeholder
    return 'https://placehold.co/600x400?text=Image+Not+Found';
  } catch (error) {
    console.error(`Error getting frame ${frameName} for company ${companyId}:`, error);
    return 'https://placehold.co/600x400?text=Error+Loading+Image';
  }
}

/**
 * Gets the company brand color with a fallback
 * @param company Company data
 * @returns Brand color with #0077b6 as fallback
 */
export function getBrandColor(company: any): string {
  return company?.brand_color || '#0077b6';
}

/**
 * Gets the company accent color with a fallback
 * @param company Company data
 * @returns Accent color with #00b4d8 as fallback
 */
export function getAccentColor(company: any): string {
  return company?.accent_color || '#00b4d8';
}