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
    console.log('Using company frame:', frameName, company.frames[frameName]);
    return company.frames[frameName];
  }
  
  // Then try template frames
  if (company?.template_frames && company.template_frames[frameName]) {
    console.log('Using template frame:', frameName, company.template_frames[frameName]);
    return company.template_frames[frameName];
  }
  
  // Check if we need to fetch from the template frames table
  // (This will be handled separately in server-side props)
  
  // Fall back to stock images
  console.log('Using stock image for:', templateKey, frameName);
  
  // Default fallback images from Unsplash (free to use)
  const defaultImages: Record<string, string> = {
    'hero_img': 'https://images.unsplash.com/photo-1581146783519-13333b79e6c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    'about_img': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1169&q=80',
    'service_img': 'https://images.unsplash.com/photo-1581092919535-bac42a15a46b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    'team_img': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'
  };
  
  // Return appropriate fallback image
  if (defaultImages[frameName]) {
    return defaultImages[frameName];
  }
  
  // Last resort fallback
  return `/stock/${templateKey}/${frameName}.svg`;
}