const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAppointmentsTable() {
  const client = await pool.connect();
  
  try {
    console.log('📅 Creating appointments table...\n');

    // Create appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID REFERENCES lead_pipeline(id) ON DELETE SET NULL,
        company_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        owner_email VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50),
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        created_by VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
      CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(appointment_time);
      CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    `);

    console.log('✅ Appointments table created with indexes');

    // Add some sample appointments for testing
    console.log('\n📝 Adding sample appointments...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterString = dayAfter.toISOString().split('T')[0];

    await client.query(`
      INSERT INTO appointments (
        company_name, owner_name, owner_email, phone_number,
        appointment_date, appointment_time, created_by, status, notes
      ) VALUES 
        ('Demo Company 1', 'John Smith', 'john@demo1.com', '205-555-0101', $1, '10:00', 'nick', 'scheduled', 'Initial consultation'),
        ('Demo Company 2', 'Jane Doe', 'jane@demo2.com', '501-555-0102', $1, '14:30', 'jared', 'scheduled', 'Follow-up meeting'),
        ('Demo Company 3', 'Bob Wilson', 'bob@demo3.com', '601-555-0103', $2, '11:00', 'nick', 'scheduled', 'Website review')
      ON CONFLICT DO NOTHING
    `, [tomorrowString, dayAfterString]);

    console.log('✅ Sample appointments added');

    // Test the table
    const appointmentCount = await client.query('SELECT COUNT(*) as count FROM appointments');
    console.log(`\n📊 Total appointments in system: ${appointmentCount.rows[0].count}`);

    console.log('\n🎉 Appointments system ready!');
    console.log('📅 Access at: /admin/calendar');
    
  } catch (error) {
    console.error('❌ Error creating appointments table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAppointmentsTable().catch(console.error);