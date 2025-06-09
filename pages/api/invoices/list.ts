import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters for pagination and filtering
    const { limit = '20', starting_after, status } = req.query;

    // Build query parameters
    const queryParams: any = {
      limit: parseInt(limit as string),
      expand: ['data.customer'],
    };

    if (starting_after) {
      queryParams.starting_after = starting_after;
    }

    if (status && status !== 'all') {
      queryParams.status = status;
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list(queryParams);

    // Format the response data
    const formattedInvoices = invoices.data.map(invoice => {
      const customer = invoice.customer as Stripe.Customer;
      
      return {
        id: invoice.id,
        customer_name: customer?.name || 'Unknown Customer',
        customer_email: customer?.email || '',
        amount: invoice.amount_due,
        status: invoice.status,
        created: invoice.created,
        due_date: invoice.due_date,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        description: invoice.lines.data[0]?.description || '',
        currency: invoice.currency,
      };
    });

    res.status(200).json({
      invoices: formattedInvoices,
      has_more: invoices.has_more,
      total_count: invoices.data.length,
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    
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