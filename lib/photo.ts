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
  
  // Fall back to stock images
  console.log('Using stock image for:', templateKey, frameName);
  return `/stock/${templateKey}/${frameName}.svg`;
}