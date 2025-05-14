import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  frames?: any[];
  frame?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  // GET - Fetch frames for a company
  if (method === 'GET') {
    try {
      const { company_id, template_key } = req.query;

      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }

      let sql = `
        SELECT * FROM company_frames 
        WHERE company_id = $1
      `;
      const queryParams = [company_id];

      // Optional filter by template
      if (template_key) {
        sql += ` AND template_key = $2`;
        queryParams.push(template_key as string);
      }

      const result = await query(sql, queryParams);

      return res.status(200).json({
        success: true,
        frames: result.rows
      });
    } catch (error: any) {
      console.error('Error fetching company frames:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message
      });
    }
  }

  // POST - Add a new company frame
  if (method === 'POST') {
    try {
      const { company_id, frame_key, template_key, image_url } = req.body;

      if (!company_id || !frame_key || !template_key || !image_url) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: company_id, frame_key, template_key, image_url'
        });
      }

      // Check if this frame already exists
      const existingFrame = await query(
        `SELECT id FROM company_frames 
         WHERE company_id = $1 AND frame_key = $2 AND template_key = $3`,
        [company_id, frame_key, template_key]
      );

      let result;

      // Update if exists, insert if not
      if (existingFrame.rows.length > 0) {
        result = await query(
          `UPDATE company_frames
           SET image_url = $1, updated_at = NOW()
           WHERE company_id = $2 AND frame_key = $3 AND template_key = $4
           RETURNING *`,
          [image_url, company_id, frame_key, template_key]
        );
      } else {
        result = await query(
          `INSERT INTO company_frames
           (company_id, frame_key, template_key, image_url)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [company_id, frame_key, template_key, image_url]
        );
      }

      return res.status(200).json({
        success: true,
        frame: result.rows[0],
        message: existingFrame.rows.length > 0 ? 'Frame updated successfully' : 'Frame added successfully'
      });
    } catch (error: any) {
      console.error('Error adding/updating company frame:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message
      });
    }
  }

  // DELETE - Remove a company frame
  if (method === 'DELETE') {
    try {
      const { id, company_id, frame_key, template_key } = req.body;

      if (id) {
        // Delete by ID
        await query('DELETE FROM company_frames WHERE id = $1', [id]);
      } else if (company_id && frame_key && template_key) {
        // Delete by composite key
        await query(
          'DELETE FROM company_frames WHERE company_id = $1 AND frame_key = $2 AND template_key = $3',
          [company_id, frame_key, template_key]
        );
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either id or (company_id, frame_key, template_key) must be provided'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Frame deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting company frame:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}