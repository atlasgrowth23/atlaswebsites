import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { companyId } = req.query;
        
        if (!companyId) {
          return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const jobs = await query(
          'SELECT j.*, c.name as contact_name FROM company_jobs j LEFT JOIN company_contacts c ON j.contact_id = c.id WHERE j.company_id = $1 ORDER BY j.scheduled_date DESC',
          [companyId]
        );

        return res.status(200).json({ success: true, data: jobs.rows });
      } catch (error) {
        console.error('Error fetching jobs:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    
    case 'POST':
      try {
        const { 
          title, 
          description,
          type, 
          status, 
          scheduledDate,
          estimatedHours,
          contactId,
          companyId 
        } = req.body;
        
        if (!title || !companyId || !scheduledDate) {
          return res.status(400).json({ 
            success: false, 
            message: 'Title, scheduled date, and company ID are required' 
          });
        }
        
        // Check if company exists
        const company = await queryOne(
          'SELECT id FROM companies WHERE id = $1',
          [companyId]
        );
        
        if (!company) {
          return res.status(404).json({ 
            success: false, 
            message: 'Company not found' 
          });
        }
        
        // Check if contact exists if provided
        if (contactId) {
          const contact = await queryOne(
            'SELECT id FROM company_contacts WHERE id = $1 AND company_id = $2',
            [contactId, companyId]
          );
          
          if (!contact) {
            return res.status(404).json({ 
              success: false, 
              message: 'Contact not found or does not belong to this company' 
            });
          }
        }
        
        // Generate a new job ID
        const jobId = uuidv4();
        
        // Insert the new job
        const result = await query(
          `INSERT INTO company_jobs (
            id, company_id, contact_id, title, description, type, status, 
            scheduled_date, estimated_hours, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
          ) RETURNING *`,
          [
            jobId,
            companyId,
            contactId || null,
            title,
            description || null,
            type || 'maintenance',
            status || 'scheduled',
            scheduledDate,
            estimatedHours || null
          ]
        );
        
        const newJob = result.rows[0];
        
        return res.status(201).json({ 
          success: true, 
          data: newJob,
          message: 'Job scheduled successfully' 
        });
      } catch (error) {
        console.error('Error scheduling job:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Internal server error' 
        });
      }
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}