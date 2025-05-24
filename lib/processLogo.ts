import fs from 'fs/promises';
import sharp from 'sharp';
import path from 'path';

export async function processLogo(slug: string, url: string | null): Promise<string | null> {
  if (!url) return null;
  
  const logosDir = path.join(process.cwd(), 'public', 'logos');
  const outPath = path.join(logosDir, `${slug}.png`);
  
  try {
    // Check if logo already processed
    await fs.access(outPath);
    return `/logos/${slug}.png`;
  } catch (_) {
    // Create logos directory if it doesn't exist
    try {
      await fs.mkdir(logosDir, { recursive: true });
    } catch (dirError) {
      console.error('Error creating logos directory:', dirError);
    }
    
    try {
      // Fetch the logo from the URL
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Failed to fetch logo from ${url}: ${res.status}`);
        return null;
      }
      
      const buf = Buffer.from(await res.arrayBuffer());
      
      // Process the image with Sharp
      await sharp(buf)
        .resize(600, 600, { 
          fit: 'contain', 
          background: { r: 255, g: 255, b: 255, alpha: 1 } 
        })
        .png()
        .toFile(outPath);
      
      return `/logos/${slug}.png`;
    } catch (error) {
      console.error(`Error processing logo for ${slug}:`, error);
      return null;
    }
  }
}