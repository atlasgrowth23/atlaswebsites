import PDFDocument from 'pdfkit';
import { Invoice, Estimate, PaymentTransaction, InvoiceItem, EstimateItem } from '@/types/invoice';

/**
 * Generates a PDF buffer for an invoice
 */
export async function generateInvoicePdf(
  invoice: Invoice, 
  companyDetails: any, 
  paymentTransactions?: PaymentTransaction[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });
      
      // Collect the PDF data chunks
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      
      // When document is done, resolve with the PDF buffer
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      
      // Format helpers
      const formatDate = (dateString?: string | null): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };
      
      const formatCurrency = (amount?: number): string => {
        if (amount === undefined || amount === null) return '$0.00';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      };
      
      // Calculate totals
      const totalPaid = (paymentTransactions || []).reduce((sum, payment) => 
        sum + Number(payment.amount), 0);
      const balanceDue = invoice.total_amount - totalPaid;
      
      // Define common colors
      const primaryColor = '#2563eb';
      const secondaryColor = '#1e40af';
      const textColor = '#333333';
      const lightGray = '#f8f9fa';
      
      // Add company logo if available
      if (companyDetails.logo) {
        doc.image(companyDetails.logo, 50, 45, { width: 150 });
        doc.moveDown(2);
      }
      
      // Add invoice title
      doc.fontSize(24)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('INVOICE', 50, companyDetails.logo ? 130 : 50);
      
      // Add company information
      doc.fontSize(10)
         .fillColor(textColor)
         .font('Helvetica');
      
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(companyDetails.name || 'Company Name');
      doc.font('Helvetica');
      if (companyDetails.address) doc.text(companyDetails.address);
      if (companyDetails.city || companyDetails.state || companyDetails.postal_code) {
        doc.text(`${companyDetails.city || ''}, ${companyDetails.state || ''} ${companyDetails.postal_code || ''}`);
      }
      if (companyDetails.phone) doc.text(`Phone: ${companyDetails.phone}`);
      if (companyDetails.email_1) doc.text(`Email: ${companyDetails.email_1}`);
      
      // Add invoice information (on the right side)
      const invoiceInfoX = 400;
      doc.fontSize(10)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Invoice #:', invoiceInfoX, companyDetails.logo ? 130 : 50, { align: 'right' })
         .text('Date:', invoiceInfoX, doc.y, { align: 'right' })
         .text('Due Date:', invoiceInfoX, doc.y, { align: 'right' })
         .text('Status:', invoiceInfoX, doc.y, { align: 'right' });
      
      // Reset cursor position
      doc.moveUp(4);
      
      // Add invoice information values
      doc.font('Helvetica')
         .text(invoice.invoice_number, 500, companyDetails.logo ? 130 : 50, { align: 'right' })
         .text(formatDate(invoice.date_issued), 500, doc.y, { align: 'right' })
         .text(formatDate(invoice.due_date), 500, doc.y, { align: 'right' })
         .text(invoice.status, 500, doc.y, { align: 'right' });
      
      // Add customer information
      doc.moveDown(2);
      doc.font('Helvetica-Bold').text('Bill To:', 50, doc.y);
      doc.font('Helvetica-Bold').text(invoice.contact?.name || 'Customer');
      doc.font('Helvetica');
      if (invoice.contact?.address) doc.text(invoice.contact.address);
      if (invoice.contact?.city || invoice.contact?.state || invoice.contact?.zip) {
        doc.text(`${invoice.contact.city || ''}, ${invoice.contact.state || ''} ${invoice.contact.zip || ''}`);
      }
      if (invoice.contact?.phone) doc.text(invoice.contact.phone);
      if (invoice.contact?.email) doc.text(invoice.contact.email);
      
      // Add line items table
      doc.moveDown(2);
      
      // Define table coordinates
      const tableTop = doc.y;
      const itemX = 50;
      const quantityX = 300;
      const priceX = 350;
      const taxX = 400;
      const amountX = 470;
      
      // Draw table header background
      doc.fillColor(lightGray)
         .rect(itemX, tableTop, amountX + 30 - itemX, 20)
         .fill();
      
      // Draw table headers
      doc.fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Description', itemX + 5, tableTop + 5)
         .text('Qty', quantityX, tableTop + 5)
         .text('Price', priceX, tableTop + 5)
         .text('Tax', taxX, tableTop + 5)
         .text('Amount', amountX, tableTop + 5, { align: 'right' });
      
      // Draw table content
      let tableY = tableTop + 20;
      
      // Add each line item
      (invoice.items || []).forEach((item: InvoiceItem) => {
        // Check if we need a new page
        if (tableY > 700) {
          doc.addPage();
          tableY = 50;
        }
        
        const itemHeight = 20;
        
        doc.font('Helvetica')
           .fontSize(9)
           .text(item.description, itemX + 5, tableY + 5, { width: 240 })
           .text(item.quantity.toString(), quantityX, tableY + 5)
           .text(formatCurrency(item.unit_price), priceX, tableY + 5)
           .text(item.tax_rate ? `${item.tax_rate}%` : '0%', taxX, tableY + 5)
           .text(formatCurrency(item.amount), amountX, tableY + 5, { align: 'right' });
        
        // Draw line below item
        tableY += itemHeight;
        doc.strokeColor('#ddd')
           .moveTo(itemX, tableY)
           .lineTo(amountX + 30, tableY)
           .stroke();
      });
      
      // Add totals section
      const totalsX = 350;
      const totalsLabelX = totalsX;
      const totalsValueX = amountX + 30;
      
      doc.moveDown(1);
      tableY = doc.y;
      
      // Subtotal
      doc.font('Helvetica')
         .fontSize(10)
         .text('Subtotal:', totalsLabelX, tableY, { align: 'left' })
         .text(formatCurrency(invoice.subtotal_amount || 0), totalsValueX, tableY, { align: 'right' });
      
      // Discount if applicable
      if (invoice.discount_amount && invoice.discount_amount > 0) {
        doc.text('Discount:', totalsLabelX, doc.y + 15, { align: 'left' })
           .text('-' + formatCurrency(invoice.discount_amount), totalsValueX, doc.y, { align: 'right' });
      }
      
      // Tax if applicable
      if (invoice.tax_amount && invoice.tax_amount > 0) {
        doc.text('Tax:', totalsLabelX, doc.y + 15, { align: 'left' })
           .text(formatCurrency(invoice.tax_amount), totalsValueX, doc.y, { align: 'right' });
      }
      
      // Total
      doc.font('Helvetica-Bold')
         .strokeColor('#333')
         .moveTo(totalsLabelX, doc.y + 10)
         .lineTo(totalsValueX, doc.y + 10)
         .stroke()
         .text('Total:', totalsLabelX, doc.y + 15, { align: 'left' })
         .text(formatCurrency(invoice.total_amount), totalsValueX, doc.y, { align: 'right' });
      
      // Amount paid and balance due if there are payments
      if (paymentTransactions && paymentTransactions.length > 0) {
        doc.font('Helvetica')
           .text('Amount Paid:', totalsLabelX, doc.y + 15, { align: 'left' })
           .text(formatCurrency(totalPaid), totalsValueX, doc.y, { align: 'right' });
        
        // Balance due
        doc.fillColor(balanceDue > 0 ? '#e53e3e' : '#38a169')
           .font('Helvetica-Bold')
           .text('Balance Due:', totalsLabelX, doc.y + 15, { align: 'left' })
           .text(formatCurrency(balanceDue), totalsValueX, doc.y, { align: 'right' })
           .fillColor(textColor);
      }
      
      // Add payment transactions if available
      if (paymentTransactions && paymentTransactions.length > 0) {
        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage();
        }
        
        doc.moveDown(2);
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('Payment History', 50, doc.y);
        
        doc.moveDown(0.5);
        
        // Draw payment table headers
        const paymentTableTop = doc.y;
        const dateX = 50;
        const methodX = 150;
        const referenceX = 250;
        const paymentAmountX = 450;
        
        // Draw table header background
        doc.fillColor(lightGray)
           .rect(dateX, paymentTableTop, paymentAmountX + 30 - dateX, 20)
           .fill();
        
        // Draw headers
        doc.fillColor(textColor)
           .font('Helvetica-Bold')
           .fontSize(10)
           .text('Date', dateX + 5, paymentTableTop + 5)
           .text('Method', methodX, paymentTableTop + 5)
           .text('Reference', referenceX, paymentTableTop + 5)
           .text('Amount', paymentAmountX, paymentTableTop + 5, { align: 'right' });
        
        // Draw payment lines
        let paymentY = paymentTableTop + 20;
        
        paymentTransactions.forEach(payment => {
          doc.font('Helvetica')
             .fontSize(9)
             .text(formatDate(payment.transaction_date), dateX + 5, paymentY + 5)
             .text(payment.payment_method, methodX, paymentY + 5)
             .text(payment.payment_reference || '-', referenceX, paymentY + 5)
             .text(formatCurrency(payment.amount), paymentAmountX, paymentY + 5, { align: 'right' });
          
          // Draw line below item
          paymentY += 20;
          doc.strokeColor('#ddd')
             .moveTo(dateX, paymentY)
             .lineTo(paymentAmountX + 30, paymentY)
             .stroke();
        });
      }
      
      // Add notes, terms, and payment instructions
      if (invoice.notes || invoice.terms || invoice.payment_instructions) {
        // Check if we need a new page
        if (doc.y > 600) {
          doc.addPage();
        } else {
          doc.moveDown(2);
        }
        
        // Add a divider line
        doc.strokeColor('#ddd')
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        
        doc.moveDown(1);
        
        // Add notes if available
        if (invoice.notes) {
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .text('Notes:', 50, doc.y);
          
          doc.font('Helvetica')
             .fontSize(9)
             .text(invoice.notes, 50, doc.y, { width: 500 });
          
          doc.moveDown(1);
        }
        
        // Add terms if available
        if (invoice.terms) {
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .text('Terms & Conditions:', 50, doc.y);
          
          doc.font('Helvetica')
             .fontSize(9)
             .text(invoice.terms, 50, doc.y, { width: 500 });
          
          doc.moveDown(1);
        }
        
        // Add payment instructions if available
        if (invoice.payment_instructions) {
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .text('Payment Instructions:', 50, doc.y);
          
          doc.font('Helvetica')
             .fontSize(9)
             .text(invoice.payment_instructions, 50, doc.y, { width: 500 });
        }
      }
      
      // Add page numbers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .text(
             `Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center', width: doc.page.width - 100 }
           );
      }
      
      // Finalize the PDF and end the stream
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates a PDF buffer for an estimate
 */
export async function generateEstimatePdf(
  estimate: Estimate, 
  companyDetails: any
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });
      
      // Collect the PDF data chunks
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      
      // When document is done, resolve with the PDF buffer
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      
      // Format helpers
      const formatDate = (dateString?: string | null): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };
      
      const formatCurrency = (amount?: number): string => {
        if (amount === undefined || amount === null) return '$0.00';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      };
      
      // Define common colors
      const primaryColor = '#2563eb';
      const secondaryColor = '#1e40af';
      const textColor = '#333333';
      const lightGray = '#f8f9fa';
      
      // Add company logo if available
      if (companyDetails.logo) {
        doc.image(companyDetails.logo, 50, 45, { width: 150 });
        doc.moveDown(2);
      }
      
      // Add estimate title
      doc.fontSize(24)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('ESTIMATE', 50, companyDetails.logo ? 130 : 50);
      
      // Add company information
      doc.fontSize(10)
         .fillColor(textColor)
         .font('Helvetica');
      
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(companyDetails.name || 'Company Name');
      doc.font('Helvetica');
      if (companyDetails.address) doc.text(companyDetails.address);
      if (companyDetails.city || companyDetails.state || companyDetails.postal_code) {
        doc.text(`${companyDetails.city || ''}, ${companyDetails.state || ''} ${companyDetails.postal_code || ''}`);
      }
      if (companyDetails.phone) doc.text(`Phone: ${companyDetails.phone}`);
      if (companyDetails.email_1) doc.text(`Email: ${companyDetails.email_1}`);
      
      // Add estimate information (on the right side)
      const estimateInfoX = 400;
      doc.fontSize(10)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Estimate #:', estimateInfoX, companyDetails.logo ? 130 : 50, { align: 'right' })
         .text('Date:', estimateInfoX, doc.y, { align: 'right' })
         .text('Expires On:', estimateInfoX, doc.y, { align: 'right' })
         .text('Status:', estimateInfoX, doc.y, { align: 'right' });
      
      // Reset cursor position
      doc.moveUp(4);
      
      // Add estimate information values
      doc.font('Helvetica')
         .text(estimate.estimate_number, 500, companyDetails.logo ? 130 : 50, { align: 'right' })
         .text(formatDate(estimate.date_issued), 500, doc.y, { align: 'right' })
         .text(formatDate(estimate.date_expires), 500, doc.y, { align: 'right' })
         .text(estimate.status, 500, doc.y, { align: 'right' });
      
      // Add customer information
      doc.moveDown(2);
      doc.font('Helvetica-Bold').text('Prepared For:', 50, doc.y);
      doc.font('Helvetica-Bold').text(estimate.contact?.name || 'Customer');
      doc.font('Helvetica');
      if (estimate.contact?.address) doc.text(estimate.contact.address);
      if (estimate.contact?.city || estimate.contact?.state || estimate.contact?.zip) {
        doc.text(`${estimate.contact.city || ''}, ${estimate.contact.state || ''} ${estimate.contact.zip || ''}`);
      }
      if (estimate.contact?.phone) doc.text(estimate.contact.phone);
      if (estimate.contact?.email) doc.text(estimate.contact.email);
      
      // Add line items table
      doc.moveDown(2);
      
      // Define table coordinates
      const tableTop = doc.y;
      const itemX = 50;
      const quantityX = 300;
      const priceX = 350;
      const taxX = 400;
      const amountX = 470;
      
      // Draw table header background
      doc.fillColor(lightGray)
         .rect(itemX, tableTop, amountX + 30 - itemX, 20)
         .fill();
      
      // Draw table headers
      doc.fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Description', itemX + 5, tableTop + 5)
         .text('Qty', quantityX, tableTop + 5)
         .text('Price', priceX, tableTop + 5)
         .text('Tax', taxX, tableTop + 5)
         .text('Amount', amountX, tableTop + 5, { align: 'right' });
      
      // Draw table content
      let tableY = tableTop + 20;
      
      // Add each line item
      (estimate.items || []).forEach((item: EstimateItem) => {
        // Check if we need a new page
        if (tableY > 700) {
          doc.addPage();
          tableY = 50;
        }
        
        const itemHeight = 20;
        
        doc.font('Helvetica')
           .fontSize(9)
           .text(item.description, itemX + 5, tableY + 5, { width: 240 })
           .text(item.quantity.toString(), quantityX, tableY + 5)
           .text(formatCurrency(item.unit_price), priceX, tableY + 5)
           .text(item.tax_rate ? `${item.tax_rate}%` : '0%', taxX, tableY + 5)
           .text(formatCurrency(item.amount), amountX, tableY + 5, { align: 'right' });
        
        // Draw line below item
        tableY += itemHeight;
        doc.strokeColor('#ddd')
           .moveTo(itemX, tableY)
           .lineTo(amountX + 30, tableY)
           .stroke();
      });
      
      // Add totals section
      const totalsX = 350;
      const totalsLabelX = totalsX;
      const totalsValueX = amountX + 30;
      
      doc.moveDown(1);
      tableY = doc.y;
      
      // Subtotal
      doc.font('Helvetica')
         .fontSize(10)
         .text('Subtotal:', totalsLabelX, tableY, { align: 'left' })
         .text(formatCurrency(estimate.subtotal_amount || 0), totalsValueX, tableY, { align: 'right' });
      
      // Discount if applicable
      if (estimate.discount_amount && estimate.discount_amount > 0) {
        doc.text('Discount:', totalsLabelX, doc.y + 15, { align: 'left' })
           .text('-' + formatCurrency(estimate.discount_amount), totalsValueX, doc.y, { align: 'right' });
      }
      
      // Tax if applicable
      if (estimate.tax_amount && estimate.tax_amount > 0) {
        doc.text('Tax:', totalsLabelX, doc.y + 15, { align: 'left' })
           .text(formatCurrency(estimate.tax_amount), totalsValueX, doc.y, { align: 'right' });
      }
      
      // Total
      doc.font('Helvetica-Bold')
         .strokeColor('#333')
         .moveTo(totalsLabelX, doc.y + 10)
         .lineTo(totalsValueX, doc.y + 10)
         .stroke()
         .text('Total:', totalsLabelX, doc.y + 15, { align: 'left' })
         .text(formatCurrency(estimate.total_amount), totalsValueX, doc.y, { align: 'right' });
      
      // Add validity notice
      doc.moveDown(2);
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#666')
         .text(`This estimate is valid until ${formatDate(estimate.date_expires)}.`, 50, doc.y, { 
            width: 500,
            align: 'center',
            oblique: true
         });
      
      // Add notes and terms if available
      if (estimate.notes || estimate.terms) {
        // Check if we need a new page
        if (doc.y > 600) {
          doc.addPage();
        } else {
          doc.moveDown(2);
        }
        
        // Add a divider line
        doc.strokeColor('#ddd')
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        
        doc.moveDown(1);
        
        // Add notes if available
        if (estimate.notes) {
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .fillColor(textColor)
             .text('Notes:', 50, doc.y);
          
          doc.font('Helvetica')
             .fontSize(9)
             .text(estimate.notes, 50, doc.y, { width: 500 });
          
          doc.moveDown(1);
        }
        
        // Add terms if available
        if (estimate.terms) {
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .text('Terms & Conditions:', 50, doc.y);
          
          doc.font('Helvetica')
             .fontSize(9)
             .text(estimate.terms, 50, doc.y, { width: 500 });
        }
      }
      
      // Add approval section
      doc.moveDown(3);
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .text('Estimate Approval', 50, doc.y);
      
      doc.moveDown(0.5);
      
      // Add signature line
      doc.strokeColor('#333')
         .moveTo(50, doc.y + 30)
         .lineTo(275, doc.y + 30)
         .stroke();
      
      doc.font('Helvetica')
         .fontSize(8)
         .text('Authorized Signature', 50, doc.y + 35);
      
      // Add date line
      doc.strokeColor('#333')
         .moveTo(325, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.font('Helvetica')
         .fontSize(8)
         .text('Date', 325, doc.y + 5);
      
      // Add page numbers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .text(
             `Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center', width: doc.page.width - 100 }
           );
      }
      
      // Finalize the PDF and end the stream
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Utility function to create a simple PDF with HTML-like content (for non-invoice/estimate documents)
 */
export async function generateSimplePdf(title: string, content: string, options?: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });
      
      // Collect the PDF data chunks
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      
      // When document is done, resolve with the PDF buffer
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      
      // Add title
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text(title, 50, 50, { align: 'center' });
      
      doc.moveDown(2);
      
      // Add content
      doc.fontSize(10)
         .font('Helvetica')
         .text(content, 50, doc.y, { align: 'left', width: 500 });
      
      // Add page numbers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .text(
             `Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center', width: doc.page.width - 100 }
           );
      }
      
      // Finalize the PDF and end the stream
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}