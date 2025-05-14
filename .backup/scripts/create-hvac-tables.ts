import { query } from '../lib/db';
import { createServiceTables } from './create-service-tables';

/**
 * Creates the necessary tables for HVAC business management
 */
async function createHvacTables() {
  try {
    console.log('Creating HVAC management tables...');

    // Create contacts table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_contacts (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(50),
        zip VARCHAR(20),
        type VARCHAR(50) DEFAULT 'residential',
        notes TEXT,
        last_service_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `);
    console.log('- hvac_contacts table created');

    // Create equipment table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_equipment (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        contact_id INTEGER NOT NULL REFERENCES hvac_contacts(id),
        equipment_type VARCHAR(100) NOT NULL,
        brand VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        installation_date TIMESTAMP,
        last_service_date TIMESTAMP,
        warranty_expiration TIMESTAMP,
        location VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        
        CONSTRAINT fk_equipment_contact
          FOREIGN KEY(contact_id) 
          REFERENCES hvac_contacts(id)
          ON DELETE RESTRICT
      )
    `);
    console.log('- hvac_equipment table created');

    // Create jobs table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_jobs (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        customer_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        priority VARCHAR(50) DEFAULT 'medium',
        scheduled_date TIMESTAMP NOT NULL,
        completion_date TIMESTAMP,
        technician VARCHAR(255),
        job_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        
        CONSTRAINT fk_jobs_contact
          FOREIGN KEY(customer_id) 
          REFERENCES hvac_contacts(id)
          ON DELETE RESTRICT
      )
    `);
    console.log('- hvac_jobs table created');

    // Create invoices table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_invoices (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        job_id INTEGER,
        contact_id INTEGER NOT NULL,
        invoice_number VARCHAR(100),
        amount DECIMAL(10, 2) NOT NULL,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        date_issued TIMESTAMP NOT NULL,
        date_paid TIMESTAMP,
        status VARCHAR(50) DEFAULT 'unpaid',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        
        CONSTRAINT fk_invoices_contact
          FOREIGN KEY(contact_id) 
          REFERENCES hvac_contacts(id)
          ON DELETE RESTRICT,
          
        CONSTRAINT fk_invoices_job
          FOREIGN KEY(job_id) 
          REFERENCES hvac_jobs(id)
          ON DELETE SET NULL
      )
    `);
    console.log('- hvac_invoices table created');

    // Create service history table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_service_history (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        equipment_id INTEGER NOT NULL,
        job_id INTEGER,
        service_date TIMESTAMP NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        technician VARCHAR(255),
        findings TEXT,
        recommendations TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_service_equipment
          FOREIGN KEY(equipment_id) 
          REFERENCES hvac_equipment(id)
          ON DELETE RESTRICT,
          
        CONSTRAINT fk_service_job
          FOREIGN KEY(job_id) 
          REFERENCES hvac_jobs(id)
          ON DELETE SET NULL
      )
    `);
    console.log('- hvac_service_history table created');

    console.log('All HVAC management tables created successfully!');
  } catch (error) {
    console.error('Error creating HVAC tables:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await createHvacTables();

    // Also create service tables
    try {
      await createServiceTables();
    } catch (err) {
      console.error('Error creating service tables:', err);
    }

    console.log('HVAC database setup completed!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    process.exit();
  }
}

// Run the script
main();