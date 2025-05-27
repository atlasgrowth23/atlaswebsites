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
    return 'https://media.istockphoto.com/id/2086062515/photo/technician-is-checking-air-conditioner-air-conditioning-hvac-service-technician-using-gauges.jpg?s=612x612&w=0&k=20&c=01FnRRsdf4EZRrkXj_famg0St0cjr4_rQlJmDAcA1SQ=';
  }
  
  if (frameName === 'about_img') {
    return 'https://media.istockphoto.com/id/2165427024/photo/technician-servicing-air-conditioning-unit-on-rooftop-during-daytime.jpg?s=612x612&w=0&k=20&c=G0onBre5_-5fjLOQhHyBq4wJwj6mMuxvW97lOv-spdA=';
  }
  
  // Default fallback
  return 'https://media.istockphoto.com/id/2162060920/photo/modern-hvac-air-conditioner.jpg?s=612x612&w=0&k=20&c=amGe-3LbT4YEWeDQfec7TPKitkzSVLcVjqKRyKUnzSI=';
}