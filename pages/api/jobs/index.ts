import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryMany } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET': {
        // Get company_id from query params
        const { company_id } = req.query;
        
        if (!company_id) {
          return res.status(400).json({ error: 'company_id is required' });
        }
        
        // Fetch jobs for this company with contact information
        const jobs = await queryMany(`
          SELECT 
            j.id, j.company_id, j.contact_id, j.tech_id, j.service_type, 
            j.status, j.priority, j.scheduled_at, j.notes,
            c.name as contact_name,
            c.street, c.city
          FROM company_jobs j
          LEFT JOIN company_contacts c ON j.contact_id = c.id
          WHERE j.company_id = $1
          ORDER BY j.scheduled_at DESC
        `, [company_id]);
        
        // Process the jobs to add UI-specific fields
        const processedJobs = jobs.map((job: any) => ({
          ...job,
          address: job.street && job.city ? `${job.street}, ${job.city}` : 'No address'
        }));
        
        return res.status(200).json(processedJobs);
      }
      
      case 'POST': {
        // Create a new job
        const { 
          company_id, contact_id, tech_id, service_type,
          status, priority, scheduled_at, notes 
        } = req.body;
        
        if (!company_id || !contact_id || !service_type || !scheduled_at) {
          return res.status(400).json({ 
            error: 'company_id, contact_id, service_type, and scheduled_at are required' 
          });
        }
        
        // Insert the new job
        const result = await query(`
          INSERT INTO company_jobs (
            id, company_id, contact_id, tech_id, service_type,
            status, priority, scheduled_at, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [
          uuidv4(), 
          company_id, 
          contact_id, 
          tech_id || null, 
          service_type,
          status || 'scheduled',
          priority || 'normal',
          scheduled_at,
          notes || null
        ]);
        
        if (result.rowCount === 0) {
          throw new Error('Failed to create job');
        }
        
        // Get the contact information for the job
        const contacts = await queryMany(`
          SELECT name, street, city FROM company_contacts WHERE id = $1
        `, [contact_id]);
        
        const contactInfo = contacts.length > 0 ? contacts[0] : null;
        
        const newJob = {
          ...result.rows[0],
          contact_name: contactInfo?.name,
          address: contactInfo?.street && contactInfo?.city ? 
            `${contactInfo.street}, ${contactInfo.city}` : 'No address'
        };
        
        return res.status(201).json(newJob);
      }
      
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('API error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}