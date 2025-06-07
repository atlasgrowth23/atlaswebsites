import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import { createReadStream } from 'fs';
import { supabaseAdmin } from '@/lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();
    
    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const companyId = Array.isArray(fields.companyId) ? fields.companyId[0] : fields.companyId;
    const frameType = Array.isArray(fields.frameType) ? fields.frameType[0] : fields.frameType || 'logo';
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = uploadedFile as File;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ error: 'Invalid file type. Please upload JPG, PNG, WebP, or SVG files.' });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }

    // Determine file extension
    let extension = 'jpg';
    if (file.mimetype?.includes('png')) extension = 'png';
    if (file.mimetype?.includes('svg')) extension = 'svg';
    if (file.mimetype?.includes('webp')) extension = 'webp';

    // Read file buffer
    const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream(file.filepath);
      
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    // Create storage path: companies/{companyId}/{frameType}.{ext}
    const fileName = `${frameType}.${extension}`;
    const storagePath = `companies/${companyId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(storagePath, fileBuffer, {
        contentType: file.mimetype || 'image/jpeg',
        upsert: true // Replace if exists
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload to storage' });
    }

    // Get public URL
    const { data: publicData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(storagePath);

    // Add cache-busting timestamp to ensure immediate updates
    const storageUrl = `${publicData.publicUrl}?v=${Date.now()}`;

    // Update company_frames table with storage URL
    const { error: dbError } = await supabaseAdmin
      .from('company_frames')
      .upsert({
        company_id: companyId,
        slug: frameType,
        url: storageUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id,slug'
      });

    if (dbError) {
      console.error('Database update error:', dbError);
      return res.status(500).json({ error: 'Failed to update database' });
    }

    return res.status(200).json({
      success: true,
      storageUrl,
      storagePath,
      fileName,
      originalName: file.originalFilename,
      size: file.size,
      message: 'Logo uploaded successfully'
    });

  } catch (error) {
    console.error('Logo upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}