/**
 * Gets the appropriate image URL from Supabase Storage ONLY
 * No hardcoded fallbacks - if database doesn't have it, component should handle gracefully
 */
export function getPhotoUrl(company: any, frameName: string, templateKey: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // First try company-specific frame (custom override)
  if (company?.company_frames && company.company_frames[frameName]) {
    const path = company.company_frames[frameName];
    const url = path.startsWith('http') ? path : `${supabaseUrl}/storage/v1/object/public/images${path}`;
    console.log('Using company-specific frame:', frameName, url);
    return url;
  }
  
  // Then try template default frame
  if (company?.template_frames && company.template_frames[frameName]) {
    const path = company.template_frames[frameName];
    const url = path.startsWith('http') ? path : `${supabaseUrl}/storage/v1/object/public/images${path}`;
    console.log('Using template frame:', frameName, url);
    return url;
  }
  
  // NO FALLBACKS - return null if not in database
  console.log('❌ No image found in database for:', frameName);
  return null;
}

/**
 * Gets logo URL or returns null for text-only display
 */
export function getLogoUrl(company: any): string | null {
  if (company.predicted_label !== 'logo') {
    return null; // This company should show name as text, not logo
  }
  
  if (company.logo_storage_path) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/images${company.logo_storage_path}`;
  }
  
  return null;
}