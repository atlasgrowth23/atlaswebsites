/**
 * Gets the appropriate image URL based on company frames data (already fetched from database)
 * @param company Company data that includes frame data
 * @param frameName Name of the frame to look for (e.g., 'hero_img', 'about_img')
 * @param templateKey The template identifier (e.g., 'moderntrust', 'boldenergy')
 * @returns URL to the appropriate image
 */
export function getPhotoUrl(company: any, frameName: string, templateKey: string): string {
  // First try to get from company_frames (passed in from database)
  if (company?.company_frames && company.company_frames[frameName]) {
    console.log('Using company-specific frame:', frameName, company.company_frames[frameName]);
    return company.company_frames[frameName];
  }
  
  // Then try template frames (passed in from database)
  if (company?.template_frames && company.template_frames[frameName]) {
    console.log('Using template frame:', frameName, company.template_frames[frameName]);
    return company.template_frames[frameName];
  }
  
  // Fall back to the same high-quality images used in ModernTrust
  console.log('Using shared stock image for:', frameName);
  
  if (frameName === 'hero_img') {
    return 'https://images.unsplash.com/photo-1547447175-a68d11e30d6b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=817&q=80';
  }
  
  if (frameName === 'about_img') {
    return 'https://t4.ftcdn.net/jpg/01/76/88/37/240_F_176883703_jmMWTobxh7e61FAJ4MoSsKDEGc1UfhTE.jpg';
  }
  
  // Default fallback
  return 'https://images.unsplash.com/photo-1547447175-a68d11e30d6b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=817&q=80';
}