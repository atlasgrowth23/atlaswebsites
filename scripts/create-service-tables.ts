import { query } from '../lib/db';

/**
 * Creates the necessary tables for HVAC service history management
 */
async function createServiceTables() {
  try {
    console.log('Creating HVAC service history tables...');

    // Create service history table if it doesn't exist
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
        work_performed TEXT,
        parts_used TEXT,
        recommendations TEXT,
        follow_up_required BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        
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

    // Add status column to hvac_jobs table if it doesn't exist
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'hvac_jobs' AND column_name = 'status'
        ) THEN
          ALTER TABLE hvac_jobs 
          ADD COLUMN status VARCHAR(50) DEFAULT 'scheduled';
        END IF;
      END $$;
    `);
    console.log('- Added status column to hvac_jobs if needed');

    // Add job_type column to hvac_jobs table if it doesn't exist
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'hvac_jobs' AND column_name = 'job_type'
        ) THEN
          ALTER TABLE hvac_jobs 
          ADD COLUMN job_type VARCHAR(50) DEFAULT 'service';
        END IF;
      END $$;
    `);
    console.log('- Added job_type column to hvac_jobs if needed');

    // Add scheduled_time columns to hvac_jobs table if they don't exist
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'hvac_jobs' AND column_name = 'scheduled_time_start'
        ) THEN
          ALTER TABLE hvac_jobs 
          ADD COLUMN scheduled_time_start VARCHAR(5);
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'hvac_jobs' AND column_name = 'scheduled_time_end'
        ) THEN
          ALTER TABLE hvac_jobs 
          ADD COLUMN scheduled_time_end VARCHAR(5);
        END IF;
      END $$;
    `);
    console.log('- Added time columns to hvac_jobs if needed');

    // Create indexes for performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_service_history_company_id ON hvac_service_history(company_id);
      CREATE INDEX IF NOT EXISTS idx_service_history_equipment_id ON hvac_service_history(equipment_id);
      CREATE INDEX IF NOT EXISTS idx_service_history_job_id ON hvac_service_history(job_id);
      CREATE INDEX IF NOT EXISTS idx_service_history_service_date ON hvac_service_history(service_date);
      
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON hvac_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON hvac_jobs(customer_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON hvac_jobs(scheduled_date);
    `);
    console.log('- Created indexes for performance optimization');

    console.log('All HVAC service history tables created successfully!');
  } catch (error) {
    console.error('Error creating service history tables:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await createServiceTables();
    console.log('Service history database setup completed!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    process.exit();
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { createServiceTables };