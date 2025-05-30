import fs from 'fs/promises';
import sharp from 'sharp';
import path from 'path';

export async function processLogo(slug: string, url: string | null): Promise<string | null> {
  if (!url) return null;
  
  // If URL is already a processed logo (starts with /logos/), return as-is
  if (url.startsWith('/logos/')) {
    return url;
  }
  
  // Clean up Google profile photo URLs by removing size parameters
  if (url.includes('googleusercontent.com') && url.includes('s44-p-k-no-ns-nd')) {
    url = url.replace(/\/s\d+-p-k-no-ns-nd/, '/s400-p-k-no-ns-nd');
  }
  
  const logosDir = path.join(process.cwd(), 'public', 'logos');
  // Add timestamp to ensure unique filename for each update
  const timestamp = Date.now();
  const outPath = path.join(logosDir, `${slug}-${timestamp}.webp`);
  
  try {
    // Create logos directory if it doesn't exist
    try {
      await fs.mkdir(logosDir, { recursive: true });
    } catch (dirError) {
      console.error('Error creating logos directory:', dirError);
    }
    
    try {
      // Try to get higher quality version of Google profile images
      let processUrl = url;
      try {
        if (url.includes('googleusercontent.com')) {
          // Handle different Google image URL patterns safely
          if (url.includes('s44-')) {
            processUrl = url.replace(/s\d+-/g, 's400-');
          }
          if (url.includes('=s')) {
            processUrl = processUrl.replace(/=s\d+/g, '=s400');
          }
        }
      } catch (urlError) {
        console.log('URL processing error, using original:', urlError);
        processUrl = url;
      }
      
      // Fetch the logo from the URL
      const res = await fetch(processUrl);
      if (!res.ok) {
        console.error(`Failed to fetch logo from ${processUrl}: ${res.status}`);
        return null;
      }
      
      const buf = Buffer.from(await res.arrayBuffer());
      
      // Get image metadata first
      const metadata = await sharp(buf).metadata();
      const isSmall = (metadata.width || 0) < 200 || (metadata.height || 0) < 200;
      
      // Process the image with different settings based on size
      let sharpInstance = sharp(buf);
      
      if (isSmall) {
        // For small logos, use different upscaling approach
        sharpInstance = sharpInstance
          .resize(400, 400, { 
            fit: 'inside', 
            background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
            kernel: sharp.kernel.lanczos3,
            withoutEnlargement: true
          })
          .sharpen({ sigma: 1.2, m1: 1.0, m2: 2.0 }); // More aggressive sharpening
      } else {
        // For larger logos, preserve quality
        sharpInstance = sharpInstance
          .resize(400, 400, { 
            fit: 'inside', 
            background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
            withoutEnlargement: true
          })
          .sharpen(); // Standard sharpening
      }
      
      await sharpInstance
        .webp({ 
          quality: 90,
          effort: 6 // Higher effort for better compression
        })
        .toFile(outPath);
      
      return `/logos/${slug}-${timestamp}.webp`;
    } catch (error) {
      console.error(`Error processing logo for ${slug}:`, error);
      return null;
    }
  } catch (dirError) {
    console.error('Error creating logos directory:', dirError);
    return null;
  }
}