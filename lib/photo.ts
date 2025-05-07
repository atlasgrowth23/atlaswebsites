/**
 * Gets the appropriate image URL based on company frames, template frames, or stock images
 * @param company Company data that may include frame data
 * @param frameName Name of the frame to look for (e.g., 'hero_img', 'about_img')
 * @param templateKey The template identifier (e.g., 'moderntrust', 'boldenergy')
 * @returns URL to the appropriate image
 */
export function getPhotoUrl(company: any, frameName: string, templateKey: string): string {
  // First try to get from company frames
  if (company?.frames && company.frames[frameName]) {
    return company.frames[frameName];
  }
  
  // Then try template frames
  if (company?.template_frames && company.template_frames[frameName]) {
    return company.template_frames[frameName];
  }
  
  // Fall back to stock images
  return `/stock/${templateKey}/${frameName}.jpg`;
}