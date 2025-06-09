import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { IncomingForm } from 'formidable';
import fs from 'fs';

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
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(500).json({ error: 'Failed to parse form data' });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      try {
        // Read file
        const fileBuffer = fs.readFileSync(file.filepath);
        const fileName = `email-assets/${Date.now()}-${file.originalFilename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin.storage
          .from('company-assets')
          .upload(fileName, fileBuffer, {
            contentType: file.mimetype || 'image/jpeg',
            upsert: false
          });

        if (error) {
          console.error('Supabase storage error:', error);
          return res.status(500).json({ error: 'Failed to upload to storage' });
        }

        // Get public URL
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('company-assets')
          .getPublicUrl(fileName);

        // Clean up temp file
        fs.unlinkSync(file.filepath);

        return res.status(200).json({
          success: true,
          fileName: fileName,
          publicUrl: publicUrlData.publicUrl,
          message: 'Email asset uploaded successfully'
        });

      } catch (uploadError) {
        console.error('Upload process error:', uploadError);
        return res.status(500).json({ error: 'Failed to process upload' });
      }
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}