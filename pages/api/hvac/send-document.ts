import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { generateInvoicePdf, generateEstimatePdf } from '@/lib/invoice-pdf';

// Note: This is a placeholder for email sending functionality
// In a real implementation, you would use a library like Nodemailer or a service like SendGrid

/**
 * Placeholder function to send an email with attachment
 * In a real implementation, this would use an email service
 */
async function sendEmail(
  to: string,
  subject: string,
  message: string,
  attachmentBuffer?: Buffer,
  attachmentName?: string
): Promise<boolean> {
  // This is a placeholder - in a real implementation, you would:
  // 1. Use a service like SendGrid, Mailgun, AWS SES, etc.
  // 2. Properly handle the email sending logic
  // 3. Return success/failure appropriately
  
  console.log(`EMAIL SENDING PLACEHOLDER`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: ${message}`);
  console.log(`Attachment: ${attachmentName ? attachmentName + ' (' + attachmentBuffer?.length + ' bytes)' : 'None'}`);
  
  // Simulate success
  return true;
}

/**
 * API endpoint to send invoices or estimates via email
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { 
    type, 
    id, 
    company_id, 
    recipient_email, 
    subject, 
    message,
    cc_emails,
    update_status
  } = req.body;

  // Validate required parameters
  if (!type || !id || !company_id || !recipient_email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required parameters: type, id, company_id, recipient_email'
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
    
    // Prepare document and email content based on type
    let pdfBuffer: Buffer;
    let emailSubject = subject || '';
    let emailMessage = message || '';
    let attachmentName: string;
    
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
      attachmentName = `Invoice_${invoice.invoice_number}.pdf`;
      
      // Set default subject and message if not provided
      if (!emailSubject) {
        emailSubject = `Invoice #${invoice.invoice_number} from ${company.name}`;
      }
      
      if (!emailMessage) {
        emailMessage = `
Dear ${invoice.contact_name || 'Customer'},

Please find attached invoice #${invoice.invoice_number} for ${company.name}.

Total amount: $${invoice.total_amount}
Due date: ${new Date(invoice.due_date).toLocaleDateString()}

If you have any questions, please don't hesitate to contact us.

Thank you for your business!

${company.name}
${company.phone || ''}
${company.email_1 || ''}
        `;
      }
      
      // Update invoice status if requested
      if (update_status && update_status === 'true') {
        await query(
          'UPDATE hvac_invoices SET status = $1, updated_at = NOW() WHERE id = $2 AND status = $3',
          ['sent', id, 'draft']
        );
      }
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
      attachmentName = `Estimate_${estimate.estimate_number}.pdf`;
      
      // Set default subject and message if not provided
      if (!emailSubject) {
        emailSubject = `Estimate #${estimate.estimate_number} from ${company.name}`;
      }
      
      if (!emailMessage) {
        const expiryDate = estimate.date_expires 
          ? new Date(estimate.date_expires).toLocaleDateString() 
          : 'N/A';
        
        emailMessage = `
Dear ${estimate.contact_name || 'Customer'},

Please find attached our estimate #${estimate.estimate_number}.

Total amount: $${estimate.total_amount}
Valid until: ${expiryDate}

We look forward to working with you. If you have any questions or would like to proceed with this estimate, please contact us.

Thank you for considering our services!

${company.name}
${company.phone || ''}
${company.email_1 || ''}
        `;
      }
      
      // Update estimate status if requested
      if (update_status && update_status === 'true') {
        await query(
          'UPDATE hvac_estimates SET status = $1, updated_at = NOW() WHERE id = $2 AND status = $3',
          ['sent', id, 'draft']
        );
      }
    }
    
    // Send the email with attachment
    const emailResult = await sendEmail(
      recipient_email,
      emailSubject,
      emailMessage,
      pdfBuffer,
      attachmentName
    );
    
    if (emailResult) {
      return res.status(200).json({ 
        success: true, 
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} sent successfully`
      });
    } else {
      throw new Error('Failed to send email');
    }
    
  } catch (error: any) {
    console.error(`Error sending ${type}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
}