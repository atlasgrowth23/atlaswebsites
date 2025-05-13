import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { Estimate, EstimateItem, EstimateStatus } from '@/types/invoice';

type ResponseData = {
  success: boolean;
  message?: string;
  estimates?: any[];
  estimate?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getEstimates(req, res);
    case 'POST':
      return createEstimate(req, res);
    case 'PUT':
      return updateEstimate(req, res);
    case 'DELETE':
      return deleteEstimate(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}

// Get estimates with optional filters
async function getEstimates(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    company_id, 
    id, 
    contact_id, 
    job_id, 
    status, 
    from_date, 
    to_date, 
    include_items 
  } = req.query;

  if (!company_id) {
    return res.status(400).json({ success: false, message: 'Company ID is required' });
  }

  try {
    let sql;
    let params: any[] = [company_id];
    let paramIndex = 2; // Start from 2 because $1 is already used for company_id
    let whereConditions = ['e.company_id = $1'];

    if (id) {
      // Get a single estimate
      sql = `
        SELECT e.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
        FROM hvac_estimates e
        JOIN hvac_contacts c ON e.contact_id = c.id
        WHERE e.company_id = $1 AND e.id = $2
      `;
      params.push(id);
      
      const result = await query(sql, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Estimate not found' });
      }
      
      const estimate = result.rows[0];
      
      // Get estimate items if requested
      if (include_items === 'true') {
        const itemsResult = await query(
          'SELECT * FROM hvac_estimate_items WHERE estimate_id = $1 ORDER BY id ASC', 
          [estimate.id]
        );
        estimate.items = itemsResult.rows;
      }
      
      return res.status(200).json({ success: true, estimate });
    } else {
      // Add filters if provided
      if (contact_id) {
        whereConditions.push(`e.contact_id = $${paramIndex}`);
        params.push(contact_id);
        paramIndex++;
      }
      
      if (job_id) {
        whereConditions.push(`e.job_id = $${paramIndex}`);
        params.push(job_id);
        paramIndex++;
      }
      
      if (status) {
        whereConditions.push(`e.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
      
      if (from_date) {
        whereConditions.push(`e.date_issued >= $${paramIndex}`);
        params.push(from_date);
        paramIndex++;
      }
      
      if (to_date) {
        whereConditions.push(`e.date_issued <= $${paramIndex}`);
        params.push(to_date);
        paramIndex++;
      }
      
      sql = `
        SELECT e.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
        FROM hvac_estimates e
        JOIN hvac_contacts c ON e.contact_id = c.id
        LEFT JOIN hvac_jobs j ON e.job_id = j.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY e.date_issued DESC
      `;
      
      const result = await query(sql, params);
      const estimates = result.rows;
      
      // Get estimate items if requested
      if (include_items === 'true' && estimates.length > 0) {
        const estimateIds = estimates.map(est => est.id);
        const itemsResult = await query(
          'SELECT * FROM hvac_estimate_items WHERE estimate_id = ANY($1) ORDER BY estimate_id, id ASC', 
          [estimateIds]
        );
        
        const itemsMap: {[key: number]: EstimateItem[]} = {};
        itemsResult.rows.forEach((item: EstimateItem) => {
          if (!itemsMap[item.estimate_id]) {
            itemsMap[item.estimate_id] = [];
          }
          itemsMap[item.estimate_id].push(item);
        });
        
        estimates.forEach(estimate => {
          estimate.items = itemsMap[estimate.id] || [];
        });
      }
      
      return res.status(200).json({ success: true, estimates });
    }
  } catch (error: any) {
    console.error('Error fetching estimates:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Create a new estimate
async function createEstimate(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    company_id, 
    contact_id, 
    job_id,
    estimate_number,
    subtotal_amount,
    tax_amount,
    discount_amount,
    total_amount,
    date_issued,
    date_expires,
    status,
    notes,
    terms,
    items
  } = req.body;

  if (!company_id || !contact_id || !estimate_number || !total_amount || !date_issued) {
    return res.status(400).json({ 
      success: false, 
      message: 'Company ID, contact ID, estimate number, total amount, and date issued are required' 
    });
  }

  try {
    // Verify that the contact exists and belongs to the company
    const contactCheck = await query(
      'SELECT id FROM hvac_contacts WHERE id = $1 AND company_id = $2',
      [contact_id, company_id]
    );
    
    if (contactCheck.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contact not found or does not belong to this company' 
      });
    }

    // If job_id is provided, verify it exists and belongs to the company
    if (job_id) {
      const jobCheck = await query(
        'SELECT id FROM hvac_jobs WHERE id = $1 AND company_id = $2',
        [job_id, company_id]
      );
      
      if (jobCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Job not found or does not belong to this company' 
        });
      }
    }

    // Start a transaction
    await query('BEGIN');

    // Create the estimate
    const sql = `
      INSERT INTO hvac_estimates (
        company_id,
        contact_id,
        job_id,
        estimate_number,
        subtotal_amount,
        tax_amount,
        discount_amount,
        total_amount,
        date_issued,
        date_expires,
        status,
        notes,
        terms,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const params = [
      company_id,
      contact_id,
      job_id || null,
      estimate_number,
      subtotal_amount || 0,
      tax_amount || 0,
      discount_amount || 0,
      total_amount,
      date_issued,
      date_expires || null,
      status || 'draft',
      notes || '',
      terms || ''
    ];
    
    const result = await query(sql, params);
    const estimate = result.rows[0];
    
    // Add estimate items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await query(`
          INSERT INTO hvac_estimate_items (
            estimate_id,
            description,
            quantity,
            unit_price,
            amount,
            item_type,
            tax_rate,
            tax_amount,
            discount_percentage,
            discount_amount,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `, [
          estimate.id,
          item.description,
          item.quantity || 1,
          item.unit_price || 0,
          item.amount || 0,
          item.item_type || 'service',
          item.tax_rate || 0,
          item.tax_amount || 0,
          item.discount_percentage || 0,
          item.discount_amount || 0
        ]);
      }
    }
    
    // Commit the transaction
    await query('COMMIT');
    
    // Get complete estimate with items
    const completeEstimate = await getCompleteEstimate(estimate.id);
    
    return res.status(201).json({ 
      success: true, 
      estimate: completeEstimate,
      message: 'Estimate created successfully' 
    });
  } catch (error: any) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error creating estimate:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update an existing estimate
async function updateEstimate(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    id,
    company_id, 
    contact_id, 
    job_id,
    estimate_number,
    subtotal_amount,
    tax_amount,
    discount_amount,
    total_amount,
    date_issued,
    date_expires,
    status,
    notes,
    terms,
    items
  } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Estimate ID and Company ID are required' 
    });
  }

  try {
    // Check if the estimate exists and belongs to the company
    const checkSql = 'SELECT * FROM hvac_estimates WHERE id = $1 AND company_id = $2';
    const checkResult = await query(checkSql, [id, company_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estimate not found or does not belong to this company' 
      });
    }

    const currentEstimate = checkResult.rows[0];
    
    // Check if the estimate is in a status that can be updated
    if (['converted', 'cancelled'].includes(currentEstimate.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Estimate is in a final state and cannot be modified' 
      });
    }

    // If contact_id is changed, verify it exists and belongs to the company
    if (contact_id && contact_id !== currentEstimate.contact_id) {
      const contactCheck = await query(
        'SELECT id FROM hvac_contacts WHERE id = $1 AND company_id = $2',
        [contact_id, company_id]
      );
      
      if (contactCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Contact not found or does not belong to this company' 
        });
      }
    }

    // Start a transaction
    await query('BEGIN');

    // Update the estimate
    const sql = `
      UPDATE hvac_estimates
      SET contact_id = $3,
          job_id = $4,
          estimate_number = $5,
          subtotal_amount = $6,
          tax_amount = $7,
          discount_amount = $8,
          total_amount = $9,
          date_issued = $10,
          date_expires = $11,
          status = $12,
          notes = $13,
          terms = $14,
          updated_at = NOW()
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const params = [
      id,
      company_id,
      contact_id || currentEstimate.contact_id,
      job_id !== undefined ? job_id : currentEstimate.job_id,
      estimate_number || currentEstimate.estimate_number,
      subtotal_amount !== undefined ? subtotal_amount : currentEstimate.subtotal_amount,
      tax_amount !== undefined ? tax_amount : currentEstimate.tax_amount,
      discount_amount !== undefined ? discount_amount : currentEstimate.discount_amount,
      total_amount !== undefined ? total_amount : currentEstimate.total_amount,
      date_issued || currentEstimate.date_issued,
      date_expires !== undefined ? date_expires : currentEstimate.date_expires,
      status || currentEstimate.status,
      notes !== undefined ? notes : currentEstimate.notes,
      terms !== undefined ? terms : currentEstimate.terms
    ];
    
    const result = await query(sql, params);
    const estimate = result.rows[0];
    
    // Handle estimate items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await query('DELETE FROM hvac_estimate_items WHERE estimate_id = $1', [id]);
      
      // Add new items
      for (const item of items) {
        await query(`
          INSERT INTO hvac_estimate_items (
            estimate_id,
            description,
            quantity,
            unit_price,
            amount,
            item_type,
            tax_rate,
            tax_amount,
            discount_percentage,
            discount_amount,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `, [
          estimate.id,
          item.description,
          item.quantity || 1,
          item.unit_price || 0,
          item.amount || 0,
          item.item_type || 'service',
          item.tax_rate || 0,
          item.tax_amount || 0,
          item.discount_percentage || 0,
          item.discount_amount || 0
        ]);
      }
    }
    
    // Commit the transaction
    await query('COMMIT');
    
    // Get complete estimate with items
    const completeEstimate = await getCompleteEstimate(estimate.id);
    
    return res.status(200).json({ 
      success: true, 
      estimate: completeEstimate,
      message: 'Estimate updated successfully' 
    });
  } catch (error: any) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error updating estimate:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Delete (cancel) an estimate
async function deleteEstimate(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { id, company_id, cancel_reason } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Estimate ID and Company ID are required' 
    });
  }

  try {
    // Check if the estimate exists and belongs to the company
    const checkSql = 'SELECT * FROM hvac_estimates WHERE id = $1 AND company_id = $2';
    const checkResult = await query(checkSql, [id, company_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estimate not found or does not belong to this company' 
      });
    }

    const currentEstimate = checkResult.rows[0];
    
    // Check if the estimate is already in a final state
    if (['converted', 'cancelled'].includes(currentEstimate.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Estimate is already in ${currentEstimate.status} status and cannot be cancelled` 
      });
    }

    // Start a transaction
    await query('BEGIN');

    // Mark estimate as cancelled instead of deleting
    const sql = `
      UPDATE hvac_estimates
      SET status = 'cancelled',
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN $3
            ELSE notes || E'\n\n' || $3
          END,
          updated_at = NOW()
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const cancelNote = `Estimate cancelled on ${new Date().toISOString()}.${cancel_reason ? ' Reason: ' + cancel_reason : ''}`;
    const params = [id, company_id, cancelNote];
    
    await query(sql, params);
    
    // Commit the transaction
    await query('COMMIT');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Estimate cancelled successfully' 
    });
  } catch (error: any) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error cancelling estimate:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Helper to get complete estimate with all related data
async function getCompleteEstimate(estimateId: number) {
  // Get the estimate with basic contact info
  const estimateResult = await query(`
    SELECT e.*, 
           c.name as contact_name, c.email as contact_email, c.phone as contact_phone,
           c.address as contact_address, c.city as contact_city, 
           c.state as contact_state, c.zip as contact_zip
    FROM hvac_estimates e
    JOIN hvac_contacts c ON e.contact_id = c.id
    WHERE e.id = $1
  `, [estimateId]);
  
  if (estimateResult.rows.length === 0) {
    throw new Error('Estimate not found');
  }
  
  const estimate = estimateResult.rows[0];
  
  // Get estimate items
  const itemsResult = await query(
    'SELECT * FROM hvac_estimate_items WHERE estimate_id = $1 ORDER BY id ASC', 
    [estimateId]
  );
  estimate.items = itemsResult.rows;
  
  // Get job details if job_id exists
  if (estimate.job_id) {
    const jobResult = await query(
      'SELECT * FROM hvac_jobs WHERE id = $1', 
      [estimate.job_id]
    );
    if (jobResult.rows.length > 0) {
      estimate.job = jobResult.rows[0];
    }
  }
  
  return estimate;
}