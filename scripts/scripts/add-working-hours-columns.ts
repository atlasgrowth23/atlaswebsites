import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addWorkingHoursColumns() {
  const client = await pool.connect();
  
  try {
    console.log('Adding working hours columns to companies table...');
    
    // Add working hours columns
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS hours VARCHAR(100),
      ADD COLUMN IF NOT EXISTS saturday_hours VARCHAR(100),
      ADD COLUMN IF NOT EXISTS sunday_hours VARCHAR(100),
      ADD COLUMN IF NOT EXISTS emergency_service BOOLEAN DEFAULT false;
    `);
    console.log('✓ Added working hours columns');
    
    // Set default working hours for existing companies
    await client.query(`
      UPDATE companies 
      SET 
        hours = COALESCE(hours, '8:00 AM - 6:00 PM'),
        saturday_hours = COALESCE(saturday_hours, '9:00 AM - 3:00 PM'),
        sunday_hours = COALESCE(sunday_hours, 'Closed'),
        emergency_service = COALESCE(emergency_service, true)
      WHERE hours IS NULL OR saturday_hours IS NULL OR sunday_hours IS NULL;
    `);
    console.log('✓ Set default working hours for existing companies');
    
    // Set standard working hours for all companies (can be customized later)
    await client.query(`
      UPDATE companies 
      SET 
        hours = '8:00 AM - 6:00 PM',
        saturday_hours = '9:00 AM - 3:00 PM', 
        sunday_hours = 'Closed',
        emergency_service = true
      WHERE hours IS NULL;
    `);
    console.log('✓ Set standard working hours for all companies');
    
    console.log('\n✅ Working hours columns added successfully!');
    console.log('Footer will now display dynamic working hours from database');
    
  } catch (error) {
    console.error('Error adding working hours columns:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  addWorkingHoursColumns().catch(console.error);
}

export { addWorkingHoursColumns };