import { query } from '../lib/db';

/**
 * Creates the necessary tables for HVAC invoice and estimate management
 */
async function createInvoiceTables() {
  try {
    console.log('Creating invoice and estimate management tables...');

    // Create invoice_items table for line items
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        item_type VARCHAR(50) NOT NULL DEFAULT 'service', -- service, part, material, labor, fee
        tax_rate DECIMAL(5, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        discount_percentage DECIMAL(5, 2) DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        
        CONSTRAINT fk_invoice_items_invoice
          FOREIGN KEY(invoice_id) 
          REFERENCES hvac_invoices(id)
          ON DELETE CASCADE
      )
    `);
    console.log('- hvac_invoice_items table created');

    // Create estimates table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_estimates (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        contact_id INTEGER NOT NULL,
        job_id INTEGER,
        estimate_number VARCHAR(100) NOT NULL,
        subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        date_issued TIMESTAMP NOT NULL,
        date_expires TIMESTAMP,
        status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, approved, rejected, expired, converted
        notes TEXT,
        terms TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        
        CONSTRAINT fk_estimates_contact
          FOREIGN KEY(contact_id) 
          REFERENCES hvac_contacts(id)
          ON DELETE RESTRICT,
          
        CONSTRAINT fk_estimates_job
          FOREIGN KEY(job_id) 
          REFERENCES hvac_jobs(id)
          ON DELETE SET NULL
      )
    `);
    console.log('- hvac_estimates table created');

    // Create estimate_items table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_estimate_items (
        id SERIAL PRIMARY KEY,
        estimate_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        item_type VARCHAR(50) NOT NULL DEFAULT 'service', -- service, part, material, labor, fee
        tax_rate DECIMAL(5, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        discount_percentage DECIMAL(5, 2) DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        
        CONSTRAINT fk_estimate_items_estimate
          FOREIGN KEY(estimate_id) 
          REFERENCES hvac_estimates(id)
          ON DELETE CASCADE
      )
    `);
    console.log('- hvac_estimate_items table created');

    // Create payment_transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_payment_transactions (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        invoice_id INTEGER NOT NULL,
        contact_id INTEGER NOT NULL,
        transaction_date TIMESTAMP NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL, -- cash, check, credit_card, bank_transfer, other
        payment_reference VARCHAR(255), -- check number, transaction ID, etc.
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        
        CONSTRAINT fk_payment_invoice
          FOREIGN KEY(invoice_id) 
          REFERENCES hvac_invoices(id)
          ON DELETE RESTRICT,
          
        CONSTRAINT fk_payment_contact
          FOREIGN KEY(contact_id) 
          REFERENCES hvac_contacts(id)
          ON DELETE RESTRICT
      )
    `);
    console.log('- hvac_payment_transactions table created');

    // Create invoice_settings table for company-specific invoice settings
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_invoice_settings (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL UNIQUE,
        next_invoice_number INTEGER NOT NULL DEFAULT 1001,
        next_estimate_number INTEGER NOT NULL DEFAULT 1001,
        default_tax_rate DECIMAL(5, 2) DEFAULT 0,
        default_due_days INTEGER DEFAULT 30,
        default_estimate_expiry_days INTEGER DEFAULT 30,
        invoice_notes_template TEXT,
        estimate_notes_template TEXT,
        invoice_terms_template TEXT,
        estimate_terms_template TEXT,
        logo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `);
    console.log('- hvac_invoice_settings table created');

    // Update existing hvac_invoices table with additional fields
    await query(`
      ALTER TABLE hvac_invoices 
      ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS terms TEXT,
      ADD COLUMN IF NOT EXISTS payment_instructions TEXT,
      ADD COLUMN IF NOT EXISTS estimate_id INTEGER,
      ADD CONSTRAINT fk_invoices_estimate FOREIGN KEY(estimate_id) REFERENCES hvac_estimates(id) ON DELETE SET NULL
    `);
    console.log('- hvac_invoices table updated with additional fields');

    console.log('All invoice and estimate management tables created successfully!');
  } catch (error) {
    console.error('Error creating invoice tables:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await createInvoiceTables();
    console.log('Invoice system database setup completed!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    process.exit();
  }
}

// Run the script
main();