import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { Invoice, InvoiceItem, InvoiceStatus } from '@/types/invoice';

type ResponseData = {
  success: boolean;
  message?: string;
  invoices?: any[];
  invoice?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getInvoices(req, res);
    case 'POST':
      return createInvoice(req, res);
    case 'PUT':
      return updateInvoice(req, res);
    case 'DELETE':
      return deleteInvoice(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}

// Get invoices with optional filters
async function getInvoices(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    company_id, 
    id, 
    contact_id, 
    job_id, 
    status, 
    from_date, 
    to_date, 
    include_items,
    include_payments
  } = req.query;

  if (!company_id) {
    return res.status(400).json({ success: false, message: 'Company ID is required' });
  }

  try {
    let sql;
    let params: any[] = [company_id];
    let paramIndex = 2; // Start from 2 because $1 is already used for company_id
    let whereConditions = ['i.company_id = $1'];

    if (id) {
      // Get a single invoice
      sql = `
        SELECT i.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
        FROM hvac_invoices i
        JOIN hvac_contacts c ON i.contact_id = c.id
        WHERE i.company_id = $1 AND i.id = $2
      `;
      params.push(id);
      
      const result = await query(sql, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
      
      const invoice = result.rows[0];
      
      // Get invoice items if requested
      if (include_items === 'true') {
        const itemsResult = await query(
          'SELECT * FROM hvac_invoice_items WHERE invoice_id = $1 ORDER BY id ASC', 
          [invoice.id]
        );
        invoice.items = itemsResult.rows;
      }
      
      // Get payment transactions if requested
      if (include_payments === 'true') {
        const paymentsResult = await query(
          'SELECT * FROM hvac_payment_transactions WHERE invoice_id = $1 ORDER BY transaction_date DESC', 
          [invoice.id]
        );
        invoice.payments = paymentsResult.rows;
      }
      
      return res.status(200).json({ success: true, invoice });
    } else {
      // Add filters if provided
      if (contact_id) {
        whereConditions.push(`i.contact_id = $${paramIndex}`);
        params.push(contact_id);
        paramIndex++;
      }
      
      if (job_id) {
        whereConditions.push(`i.job_id = $${paramIndex}`);
        params.push(job_id);
        paramIndex++;
      }
      
      if (status) {
        whereConditions.push(`i.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
      
      if (from_date) {
        whereConditions.push(`i.date_issued >= $${paramIndex}`);
        params.push(from_date);
        paramIndex++;
      }
      
      if (to_date) {
        whereConditions.push(`i.date_issued <= $${paramIndex}`);
        params.push(to_date);
        paramIndex++;
      }
      
      sql = `
        SELECT i.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
        FROM hvac_invoices i
        JOIN hvac_contacts c ON i.contact_id = c.id
        LEFT JOIN hvac_jobs j ON i.job_id = j.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY i.date_issued DESC
      `;
      
      const result = await query(sql, params);
      const invoices = result.rows;
      
      // Get invoice items if requested
      if (include_items === 'true' && invoices.length > 0) {
        const invoiceIds = invoices.map(inv => inv.id);
        const itemsResult = await query(
          'SELECT * FROM hvac_invoice_items WHERE invoice_id = ANY($1) ORDER BY invoice_id, id ASC', 
          [invoiceIds]
        );
        
        const itemsMap: {[key: number]: InvoiceItem[]} = {};
        itemsResult.rows.forEach((item: InvoiceItem) => {
          if (!itemsMap[item.invoice_id]) {
            itemsMap[item.invoice_id] = [];
          }
          itemsMap[item.invoice_id].push(item);
        });
        
        invoices.forEach(invoice => {
          invoice.items = itemsMap[invoice.id] || [];
        });
      }
      
      // Get payment transactions if requested
      if (include_payments === 'true' && invoices.length > 0) {
        const invoiceIds = invoices.map(inv => inv.id);
        const paymentsResult = await query(
          'SELECT * FROM hvac_payment_transactions WHERE invoice_id = ANY($1) ORDER BY invoice_id, transaction_date DESC', 
          [invoiceIds]
        );
        
        const paymentsMap: {[key: number]: any[]} = {};
        paymentsResult.rows.forEach(payment => {
          if (!paymentsMap[payment.invoice_id]) {
            paymentsMap[payment.invoice_id] = [];
          }
          paymentsMap[payment.invoice_id].push(payment);
        });
        
        invoices.forEach(invoice => {
          invoice.payments = paymentsMap[invoice.id] || [];
        });
      }
      
      return res.status(200).json({ success: true, invoices });
    }
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Create a new invoice
async function createInvoice(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    company_id, 
    contact_id, 
    job_id,
    estimate_id,
    invoice_number,
    subtotal_amount,
    tax_amount,
    discount_amount,
    total_amount,
    date_issued,
    due_date,
    status,
    notes,
    terms,
    payment_instructions,
    items
  } = req.body;

  if (!company_id || !contact_id || !invoice_number || !total_amount || !date_issued) {
    return res.status(400).json({ 
      success: false, 
      message: 'Company ID, contact ID, invoice number, total amount, and date issued are required' 
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

    // If estimate_id is provided, verify it exists and belongs to the company
    if (estimate_id) {
      const estimateCheck = await query(
        'SELECT id FROM hvac_estimates WHERE id = $1 AND company_id = $2',
        [estimate_id, company_id]
      );
      
      if (estimateCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Estimate not found or does not belong to this company' 
        });
      }
    }

    // Start a transaction
    await query('BEGIN');

    // Create the invoice
    const sql = `
      INSERT INTO hvac_invoices (
        company_id,
        contact_id,
        job_id,
        estimate_id,
        invoice_number,
        subtotal_amount,
        tax_amount,
        discount_amount,
        total_amount,
        date_issued,
        due_date,
        status,
        notes,
        terms,
        payment_instructions,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *
    `;

    const params = [
      company_id,
      contact_id,
      job_id || null,
      estimate_id || null,
      invoice_number,
      subtotal_amount || 0,
      tax_amount || 0,
      discount_amount || 0,
      total_amount,
      date_issued,
      due_date || null,
      status || 'draft',
      notes || '',
      terms || '',
      payment_instructions || ''
    ];
    
    const result = await query(sql, params);
    const invoice = result.rows[0];
    
    // Add invoice items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await query(`
          INSERT INTO hvac_invoice_items (
            invoice_id,
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
          invoice.id,
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
    
    // If this invoice is from an estimate, update the estimate status to 'converted'
    if (estimate_id) {
      await query(
        'UPDATE hvac_estimates SET status = $1, updated_at = NOW() WHERE id = $2',
        ['converted', estimate_id]
      );
    }
    
    // Commit the transaction
    await query('COMMIT');
    
    // Get complete invoice with items
    const completeInvoice = await getCompleteInvoice(invoice.id);
    
    return res.status(201).json({ 
      success: true, 
      invoice: completeInvoice,
      message: 'Invoice created successfully' 
    });
  } catch (error: any) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error creating invoice:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update an existing invoice
async function updateInvoice(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    id,
    company_id, 
    contact_id, 
    job_id,
    estimate_id,
    invoice_number,
    subtotal_amount,
    tax_amount,
    discount_amount,
    total_amount,
    date_issued,
    due_date,
    date_paid,
    status,
    notes,
    terms,
    payment_instructions,
    items
  } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invoice ID and Company ID are required' 
    });
  }

  try {
    // Check if the invoice exists and belongs to the company
    const checkSql = 'SELECT * FROM hvac_invoices WHERE id = $1 AND company_id = $2';
    const checkResult = await query(checkSql, [id, company_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invoice not found or does not belong to this company' 
      });
    }

    const currentInvoice = checkResult.rows[0];
    
    // Check if the invoice is in a status that can be updated (not paid, void, or cancelled)
    if (['paid', 'void', 'cancelled'].includes(currentInvoice.status) && status !== 'void' && status !== 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invoice is in a final state and cannot be modified' 
      });
    }

    // If contact_id is changed, verify it exists and belongs to the company
    if (contact_id && contact_id !== currentInvoice.contact_id) {
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

    // Update the invoice
    const sql = `
      UPDATE hvac_invoices
      SET contact_id = $3,
          job_id = $4,
          estimate_id = $5,
          invoice_number = $6,
          subtotal_amount = $7,
          tax_amount = $8,
          discount_amount = $9,
          total_amount = $10,
          date_issued = $11,
          due_date = $12,
          date_paid = $13,
          status = $14,
          notes = $15,
          terms = $16,
          payment_instructions = $17,
          updated_at = NOW()
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const params = [
      id,
      company_id,
      contact_id || currentInvoice.contact_id,
      job_id !== undefined ? job_id : currentInvoice.job_id,
      estimate_id !== undefined ? estimate_id : currentInvoice.estimate_id,
      invoice_number || currentInvoice.invoice_number,
      subtotal_amount !== undefined ? subtotal_amount : currentInvoice.subtotal_amount,
      tax_amount !== undefined ? tax_amount : currentInvoice.tax_amount,
      discount_amount !== undefined ? discount_amount : currentInvoice.discount_amount,
      total_amount !== undefined ? total_amount : currentInvoice.total_amount,
      date_issued || currentInvoice.date_issued,
      due_date !== undefined ? due_date : currentInvoice.due_date,
      date_paid !== undefined ? date_paid : currentInvoice.date_paid,
      status || currentInvoice.status,
      notes !== undefined ? notes : currentInvoice.notes,
      terms !== undefined ? terms : currentInvoice.terms,
      payment_instructions !== undefined ? payment_instructions : currentInvoice.payment_instructions
    ];
    
    const result = await query(sql, params);
    const invoice = result.rows[0];
    
    // Handle invoice items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await query('DELETE FROM hvac_invoice_items WHERE invoice_id = $1', [id]);
      
      // Add new items
      for (const item of items) {
        await query(`
          INSERT INTO hvac_invoice_items (
            invoice_id,
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
          invoice.id,
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
    
    // Get complete invoice with items
    const completeInvoice = await getCompleteInvoice(invoice.id);
    
    return res.status(200).json({ 
      success: true, 
      invoice: completeInvoice,
      message: 'Invoice updated successfully' 
    });
  } catch (error: any) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error updating invoice:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Delete (void) an invoice
async function deleteInvoice(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { id, company_id, void_reason } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invoice ID and Company ID are required' 
    });
  }

  try {
    // Check if the invoice exists and belongs to the company
    const checkSql = 'SELECT * FROM hvac_invoices WHERE id = $1 AND company_id = $2';
    const checkResult = await query(checkSql, [id, company_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invoice not found or does not belong to this company' 
      });
    }

    const currentInvoice = checkResult.rows[0];
    
    // Check if the invoice is already in a final state
    if (['paid', 'void', 'cancelled'].includes(currentInvoice.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invoice is already in ${currentInvoice.status} status and cannot be voided` 
      });
    }

    // Start a transaction
    await query('BEGIN');

    // Mark invoice as void instead of deleting
    const sql = `
      UPDATE hvac_invoices
      SET status = 'void',
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN $3
            ELSE notes || E'\n\n' || $3
          END,
          updated_at = NOW()
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const voidNote = `Invoice voided on ${new Date().toISOString()}.${void_reason ? ' Reason: ' + void_reason : ''}`;
    const params = [id, company_id, voidNote];
    
    await query(sql, params);
    
    // Commit the transaction
    await query('COMMIT');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Invoice voided successfully' 
    });
  } catch (error: any) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error voiding invoice:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Helper to get complete invoice with all related data
async function getCompleteInvoice(invoiceId: number) {
  // Get the invoice with basic contact info
  const invoiceResult = await query(`
    SELECT i.*, 
           c.name as contact_name, c.email as contact_email, c.phone as contact_phone,
           c.address as contact_address, c.city as contact_city, 
           c.state as contact_state, c.zip as contact_zip
    FROM hvac_invoices i
    JOIN hvac_contacts c ON i.contact_id = c.id
    WHERE i.id = $1
  `, [invoiceId]);
  
  if (invoiceResult.rows.length === 0) {
    throw new Error('Invoice not found');
  }
  
  const invoice = invoiceResult.rows[0];
  
  // Get invoice items
  const itemsResult = await query(
    'SELECT * FROM hvac_invoice_items WHERE invoice_id = $1 ORDER BY id ASC', 
    [invoiceId]
  );
  invoice.items = itemsResult.rows;
  
  // Get payment transactions
  const paymentsResult = await query(
    'SELECT * FROM hvac_payment_transactions WHERE invoice_id = $1 ORDER BY transaction_date DESC', 
    [invoiceId]
  );
  invoice.payments = paymentsResult.rows;
  
  // Get job details if job_id exists
  if (invoice.job_id) {
    const jobResult = await query(
      'SELECT * FROM hvac_jobs WHERE id = $1', 
      [invoice.job_id]
    );
    if (jobResult.rows.length > 0) {
      invoice.job = jobResult.rows[0];
    }
  }
  
  return invoice;
}