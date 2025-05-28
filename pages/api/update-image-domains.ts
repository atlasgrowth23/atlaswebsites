import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Extract domain from URL
    const url = new URL(imageUrl);
    const domain = url.hostname;

    // Read current next.config.js
    const configPath = path.join(process.cwd(), 'next.config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');

    // Check if domain is already in the config
    if (configContent.includes(`'${domain}'`) || configContent.includes(`"${domain}"`)) {
      return res.status(200).json({ 
        message: 'Domain already exists in config',
        domain,
        updated: false 
      });
    }

    // Find the images.domains array and add the new domain
    const domainsRegex = /domains:\s*\[([\s\S]*?)\]/;
    const match = configContent.match(domainsRegex);

    if (match) {
      const currentDomains = match[1];
      const newDomains = currentDomains.trim() 
        ? `${currentDomains.trim()},\n        '${domain}'`
        : `'${domain}'`;
      
      configContent = configContent.replace(
        domainsRegex,
        `domains: [\n        ${newDomains}\n      ]`
      );
    } else {
      // If no domains array exists, add it to the images object
      const imagesRegex = /images:\s*\{([^}]*)\}/;
      const imagesMatch = configContent.match(imagesRegex);
      
      if (imagesMatch) {
        const existingImageConfig = imagesMatch[1].trim();
        const newImageConfig = existingImageConfig 
          ? `${existingImageConfig},\n    domains: ['${domain}']`
          : `domains: ['${domain}']`;
        
        configContent = configContent.replace(
          imagesRegex,
          `images: {\n    ${newImageConfig}\n  }`
        );
      } else {
        // Add entire images config if it doesn't exist
        configContent = configContent.replace(
          /module\.exports\s*=\s*{/,
          `module.exports = {\n  images: {\n    domains: ['${domain}']\n  },`
        );
      }
    }

    // Write back to file
    fs.writeFileSync(configPath, configContent);

    return res.status(200).json({ 
      message: 'Domain added to Next.js config successfully',
      domain,
      updated: true,
      note: 'Please restart the development server to apply changes'
    });

  } catch (error) {
    console.error('Error updating image domains:', error);
    return res.status(500).json({ 
      error: 'Failed to update image domains',
      details: error.message 
    });
  }
}