import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { generateInvoicePdf, generateEstimatePdf } from '@/lib/invoice-pdf';

/**
 * API endpoint to generate PDFs for invoices and estimates
 * 
 * Required query parameters:
 * - type: 'invoice' or 'estimate'
 * - id: ID of the invoice or estimate
 * - company_id: ID of the company
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { type, id, company_id } = req.query;

  // Validate required parameters
  if (!type || !id || !company_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required parameters: type, id, company_id'
    });
  }

  // Validate type parameter
  if (type !== 'invoice' && type !== 'estimate') {
    return res.status(400).json({ 
      success: false, 
      message: 'Type parameter must be either "invoice" or "estimate"'
    });
  }

  try {
    // Get company details
    const companyResult = await query(
      'SELECT * FROM companies WHERE id = $1 OR slug = $1',
      [company_id]
    );
    
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    const company = companyResult.rows[0];
    
    // Generate the appropriate PDF based on type
    let pdfBuffer: Buffer;
    let filename: string;
    
    if (type === 'invoice') {
      // Get invoice with items and payment info
      const invoiceResult = await query(`
        SELECT i.*, 
               c.name as contact_name, c.email as contact_email, c.phone as contact_phone,
               c.address as contact_address, c.city as contact_city, 
               c.state as contact_state, c.zip as contact_zip
        FROM hvac_invoices i
        JOIN hvac_contacts c ON i.contact_id = c.id
        WHERE i.id = $1 AND i.company_id = $2
      `, [id, company_id]);
      
      if (invoiceResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
      
      const invoice = invoiceResult.rows[0];
      
      // Get invoice items
      const itemsResult = await query(
        'SELECT * FROM hvac_invoice_items WHERE invoice_id = $1 ORDER BY id ASC', 
        [id]
      );
      invoice.items = itemsResult.rows;
      
      // Get payment transactions
      const paymentsResult = await query(
        'SELECT * FROM hvac_payment_transactions WHERE invoice_id = $1 ORDER BY transaction_date DESC', 
        [id]
      );
      const payments = paymentsResult.rows;
      
      // Generate PDF
      pdfBuffer = await generateInvoicePdf(invoice, company, payments);
      filename = `Invoice_${invoice.invoice_number}.pdf`;
    } else {
      // Get estimate with items
      const estimateResult = await query(`
        SELECT e.*, 
               c.name as contact_name, c.email as contact_email, c.phone as contact_phone,
               c.address as contact_address, c.city as contact_city, 
               c.state as contact_state, c.zip as contact_zip
        FROM hvac_estimates e
        JOIN hvac_contacts c ON e.contact_id = c.id
        WHERE e.id = $1 AND e.company_id = $2
      `, [id, company_id]);
      
      if (estimateResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Estimate not found' });
      }
      
      const estimate = estimateResult.rows[0];
      
      // Get estimate items
      const itemsResult = await query(
        'SELECT * FROM hvac_estimate_items WHERE estimate_id = $1 ORDER BY id ASC', 
        [id]
      );
      estimate.items = itemsResult.rows;
      
      // Generate PDF
      pdfBuffer = await generateEstimatePdf(estimate, company);
      filename = `Estimate_${estimate.estimate_number}.pdf`;
    }
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF buffer
    res.send(pdfBuffer);
    
  } catch (error: any) {
    console.error(`Error generating ${type} PDF:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
}