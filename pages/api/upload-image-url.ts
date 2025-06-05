import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, companyId, frameType } = req.body;

    if (!imageUrl || !companyId || !frameType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Download image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to download image from URL' });
    }

    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Determine file extension from URL or content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    if (contentType.includes('svg')) extension = 'svg';
    if (contentType.includes('webp')) extension = 'webp';

    // Create storage path: companies/{companyId}/{frameType}.{ext}
    const fileName = `${frameType}.${extension}`;
    const storagePath = `companies/${companyId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(storagePath, buffer, {
        contentType,
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
      message: 'Image uploaded and saved to storage'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}