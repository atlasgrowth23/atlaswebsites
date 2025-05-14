/**
 * Gets the appropriate image URL based on company frames, template frames, or stock images
 * @param company Company data that may include frame data
 * @param frameName Name of the frame to look for (e.g., 'hero_img', 'about_img')
 * @param templateKey The template identifier (e.g., 'moderntrust', 'boldenergy')
 * @returns URL to the appropriate image
 */
export function getPhotoUrl(company: any, frameName: string, templateKey: string): string {
  // Check if the company has custom frames
  if (company.company_frames && company.company_frames[frameName]) {
    return company.company_frames[frameName];
  }
  
  // Check if there are template-specific frames
  if (company.template_frames && company.template_frames[frameName]) {
    return company.template_frames[frameName];
  }
  
  // Default stock images for each template
  const stockImages: Record<string, Record<string, string>> = {
    'moderntrust': {
      'hero_img': '/stock/moderntrust/hero.jpg',
      'about_img': '/stock/moderntrust/about.jpg',
      'service_img': '/stock/moderntrust/service.jpg',
      'testimonial_bg': '/stock/moderntrust/testimonial-bg.jpg',
    },
    'boldenergy': {
      'hero_img': '/stock/boldenergy/hero.jpg',
      'about_img': '/stock/boldenergy/about.jpg',
      'service_img': '/stock/boldenergy/service.jpg',
      'testimonial_bg': '/stock/boldenergy/testimonial-bg.jpg',
    },
    'comfort-classic': {
      'hero_img': '/stock/comfort-classic/hero.jpg',
      'about_img': '/stock/comfort-classic/about.jpg',
      'service_img': '/stock/comfort-classic/service.jpg',
      'testimonial_bg': '/stock/comfort-classic/testimonial-bg.jpg',
    }
  };
  
  // Check if there's a stock image for this template and frame
  if (stockImages[templateKey] && stockImages[templateKey][frameName]) {
    console.log(`Using stock image for: ${templateKey} ${frameName}`);
    return stockImages[templateKey][frameName];
  }
  
  // Fallback to a generic placeholder image
  return '/stock/placeholder.jpg';
}