import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer_name, customer_email, amount, description, due_days } = req.body;

    // Validate required fields
    if (!customer_name || !customer_email || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: customer_name, customer_email, amount' 
      });
    }

    // Convert amount to cents (Stripe uses cents)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (amountInCents <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Create or retrieve customer
    let customer;
    try {
      // Try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: customer_email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          name: customer_name,
          email: customer_email,
        });
      }
    } catch (error) {
      console.error('Error creating/retrieving customer:', error);
      return res.status(500).json({ error: 'Failed to create customer' });
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(due_days || '30'));

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: parseInt(due_days || '30'),
      metadata: {
        created_by: 'admin_panel',
        customer_name: customer_name,
      },
    });

    // Add invoice item
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      amount: amountInCents,
      currency: 'usd',
      description: description || 'Service provided',
    });

    // Finalize the invoice to make it ready for sending
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Send the invoice
    const sentInvoice = await stripe.invoices.sendInvoice(finalizedInvoice.id);

    // Format response data
    const responseInvoice = {
      id: sentInvoice.id,
      customer_name: customer_name,
      customer_email: customer_email,
      amount: sentInvoice.amount_due,
      status: sentInvoice.status,
      created: sentInvoice.created,
      due_date: sentInvoice.due_date,
      invoice_pdf: sentInvoice.invoice_pdf,
      hosted_invoice_url: sentInvoice.hosted_invoice_url,
    };

    res.status(200).json({ 
      success: true, 
      invoice: responseInvoice,
      message: 'Invoice created and sent successfully'
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: `Stripe error: ${error.message}`,
        type: error.type 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}