import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { PaymentMethod } from '@/types/invoice';

type ResponseData = {
  success: boolean;
  message?: string;
  payments?: any[];
  payment?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getPayments(req, res);
    case 'POST':
      return recordPayment(req, res);
    case 'DELETE':
      return deletePayment(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}

// Get payments with optional filters
async function getPayments(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { company_id, id, invoice_id, contact_id } = req.query;

  if (!company_id) {
    return res.status(400).json({ success: false, message: 'Company ID is required' });
  }

  try {
    let sql;
    let params: any[] = [company_id];
    let paramIndex = 2; // Start from 2 because $1 is already used for company_id
    let whereConditions = ['p.company_id = $1'];

    if (id) {
      // Get a single payment
      sql = `
        SELECT p.*, 
               i.invoice_number, i.total_amount as invoice_total,
               c.name as contact_name, c.email as contact_email
        FROM hvac_payment_transactions p
        JOIN hvac_invoices i ON p.invoice_id = i.id
        JOIN hvac_contacts c ON p.contact_id = c.id
        WHERE p.company_id = $1 AND p.id = $2
      `;
      params.push(id);
      
      const result = await query(sql, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
      
      return res.status(200).json({ success: true, payment: result.rows[0] });
    } else {
      // Add filters if provided
      if (invoice_id) {
        whereConditions.push(`p.invoice_id = $${paramIndex}`);
        params.push(invoice_id);
        paramIndex++;
      }
      
      if (contact_id) {
        whereConditions.push(`p.contact_id = $${paramIndex}`);
        params.push(contact_id);
        paramIndex++;
      }
      
      sql = `
        SELECT p.*, 
               i.invoice_number, i.total_amount as invoice_total,
               c.name as contact_name, c.email as contact_email
        FROM hvac_payment_transactions p
        JOIN hvac_invoices i ON p.invoice_id = i.id
        JOIN hvac_contacts c ON p.contact_id = c.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY p.transaction_date DESC
      `;
      
      const result = await query(sql, params);
      return res.status(200).json({ success: true, payments: result.rows });
    }
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Record a new payment
async function recordPayment(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    company_id, 
    invoice_id, 
    contact_id,
    transaction_date,
    amount,
    payment_method,
    payment_reference,
    notes
  } = req.body;

  if (!company_id || !invoice_id || !contact_id || !amount || !transaction_date) {
    return res.status(400).json({ 
      success: false, 
      message: 'Company ID, invoice ID, contact ID, amount, and transaction date are required' 
    });
  }

  if (amount <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Payment amount must be greater than zero' 
    });
  }

  try {
    // Start a transaction
    await query('BEGIN');

    // Verify that the invoice exists, belongs to the company, and is not already paid
    const invoiceCheck = await query(
      'SELECT * FROM hvac_invoices WHERE id = $1 AND company_id = $2 AND status NOT IN ($3, $4)',
      [invoice_id, company_id, 'paid', 'void']
    );
    
    if (invoiceCheck.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Invoice not found, does not belong to this company, or is already in a final state' 
      });
    }

    const invoice = invoiceCheck.rows[0];
    
    // Verify that the contact exists and belongs to the company
    const contactCheck = await query(
      'SELECT id FROM hvac_contacts WHERE id = $1 AND company_id = $2',
      [contact_id, company_id]
    );
    
    if (contactCheck.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Contact not found or does not belong to this company' 
      });
    }

    // Record the payment
    const sql = `
      INSERT INTO hvac_payment_transactions (
        company_id,
        invoice_id,
        contact_id,
        transaction_date,
        amount,
        payment_method,
        payment_reference,
        notes,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const params = [
      company_id,
      invoice_id,
      contact_id,
      transaction_date,
      amount,
      payment_method || 'other',
      payment_reference || '',
      notes || ''
    ];
    
    const result = await query(sql, params);
    const payment = result.rows[0];
    
    // Calculate total payments for this invoice
    const paymentsSum = await query(
      'SELECT SUM(amount) as total_paid FROM hvac_payment_transactions WHERE invoice_id = $1',
      [invoice_id]
    );
    
    const totalPaid = parseFloat(paymentsSum.rows[0].total_paid);
    const invoiceTotal = parseFloat(invoice.total_amount);
    
    // Update invoice status based on payment
    let newStatus: string;
    let date_paid: string | null = null;
    
    if (totalPaid >= invoiceTotal) {
      newStatus = 'paid';
      date_paid = new Date().toISOString();
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid';
      date_paid = null;
    } else {
      newStatus = invoice.status;
      date_paid = null;
    }
    
    await query(
      'UPDATE hvac_invoices SET status = $1, date_paid = $2, updated_at = NOW() WHERE id = $3',
      [newStatus, date_paid, invoice_id]
    );
    
    // Commit the transaction
    await query('COMMIT');
    
    // Get the updated payment with invoice details
    const completePayment = await query(`
      SELECT p.*, 
             i.invoice_number, i.total_amount as invoice_total, i.status as invoice_status,
             c.name as contact_name, c.email as contact_email
      FROM hvac_payment_transactions p
      JOIN hvac_invoices i ON p.invoice_id = i.id
      JOIN hvac_contacts c ON p.contact_id = c.id
      WHERE p.id = $1
    `, [payment.id]);
    
    return res.status(201).json({ 
      success: true, 
      payment: completePayment.rows[0],
      message: 'Payment recorded successfully' 
    });
  } catch (error: any) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error recording payment:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Delete a payment record
async function deletePayment(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { id, company_id } = req.body;

  if (!id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Payment ID and Company ID are required' 
    });
  }

  try {
    // Start a transaction
    await query('BEGIN');

    // Check if the payment exists and belongs to the company
    const paymentCheck = await query(
      'SELECT * FROM hvac_payment_transactions WHERE id = $1 AND company_id = $2',
      [id, company_id]
    );
    
    if (paymentCheck.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found or does not belong to this company' 
      });
    }

    const payment = paymentCheck.rows[0];
    const invoiceId = payment.invoice_id;
    
    // Delete the payment
    await query(
      'DELETE FROM hvac_payment_transactions WHERE id = $1',
      [id]
    );
    
    // Recalculate invoice status
    const paymentsSum = await query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM hvac_payment_transactions WHERE invoice_id = $1',
      [invoiceId]
    );
    
    const invoiceCheck = await query(
      'SELECT * FROM hvac_invoices WHERE id = $1',
      [invoiceId]
    );
    
    if (invoiceCheck.rows.length > 0) {
      const invoice = invoiceCheck.rows[0];
      const totalPaid = parseFloat(paymentsSum.rows[0].total_paid);
      const invoiceTotal = parseFloat(invoice.total_amount);
      
      // Update invoice status based on remaining payments
      let newStatus: string;
      let date_paid: string | null = null;
      
      if (totalPaid >= invoiceTotal) {
        newStatus = 'paid';
        date_paid = new Date().toISOString();
      } else if (totalPaid > 0) {
        newStatus = 'partially_paid';
        date_paid = null;
      } else if (invoice.status === 'paid' || invoice.status === 'partially_paid') {
        // If was paid before and now has no payments
        newStatus = 'sent'; // Or could be 'viewed' if was viewed
        date_paid = null;
      } else {
        // Keep current status
        newStatus = invoice.status;
        date_paid = null;
      }
      
      await query(
        'UPDATE hvac_invoices SET status = $1, date_paid = $2, updated_at = NOW() WHERE id = $3',
        [newStatus, date_paid, invoiceId]
      );
    }
    
    // Commit the transaction
    await query('COMMIT');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Payment deleted successfully' 
    });
  } catch (error: any) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error deleting payment:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}