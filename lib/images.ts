import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Process a logo image into optimized WebP variants
 * @param buffer Image buffer from upload or URL fetch
 * @param fileName Base filename (without extension)
 * @returns Object with 1x and 2x variant URLs
 */
export async function processLogo(buffer: Buffer, fileName: string) {
  // Ensure logos directory exists
  const logosDir = join(process.cwd(), 'public', 'logos');
  if (!existsSync(logosDir)) {
    mkdirSync(logosDir, { recursive: true });
  }

  const variants = [
    { suffix: '@1x', width: 300 },
    { suffix: '@2x', width: 600 },
  ];

  const results: Record<string, string> = {};

  for (const variant of variants) {
    const outputPath = join(logosDir, `${fileName}${variant.suffix}.webp`);
    
    await sharp(buffer)
      .resize({ width: variant.width, height: Math.round(variant.width / 3), fit: 'inside' })
      .webp({ quality: 85 })
      .toFile(outputPath);
    
    results[variant.suffix.substring(1)] = `/logos/${fileName}${variant.suffix}.webp`;
  }

  return results;
}

/**
 * Process hero/about images into optimized variants
 * @param buffer Image buffer
 * @param fileName Base filename
 * @returns Object with multiple size variants
 */
export async function processHeroImage(buffer: Buffer, fileName: string) {
  // Ensure images directory exists
  const imagesDir = join(process.cwd(), 'public', 'images');
  if (!existsSync(imagesDir)) {
    mkdirSync(imagesDir, { recursive: true });
  }

  const variants = [
    { suffix: '-640', width: 640 },
    { suffix: '-960', width: 960 },
    { suffix: '-1280', width: 1280 },
  ];

  const results: Record<string, string> = {};

  for (const variant of variants) {
    const outputPath = join(imagesDir, `${fileName}${variant.suffix}.webp`);
    
    await sharp(buffer)
      .resize({ width: variant.width, height: Math.round(variant.width * 0.6), fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(outputPath);
    
    results[variant.suffix.substring(1)] = `/images/${fileName}${variant.suffix}.webp`;
  }

  return results;
}

/**
 * Fetch image from URL and return buffer
 * @param url Image URL to fetch
 * @returns Image buffer
 */
export async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Check if URL points to an SVG file
 * @param url Image URL
 * @returns True if SVG
 */
export function isSvg(url: string): boolean {
  return url.toLowerCase().includes('.svg');
}