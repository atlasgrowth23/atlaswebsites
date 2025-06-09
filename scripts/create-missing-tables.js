const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function createMissingTables() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in .env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating missing tables...');
    
    // 1. Create lead_tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES lead_pipeline(id) ON DELETE CASCADE,
        tag_type VARCHAR(255) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lead_tags_lead_id ON lead_tags(lead_id);
      CREATE INDEX IF NOT EXISTS idx_lead_tags_type ON lead_tags(tag_type);
    `);
    console.log('✓ Created lead_tags table');

    // 2. Create appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES lead_pipeline(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255),
        owner_email VARCHAR(255),
        phone_number VARCHAR(50),
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    `);
    console.log('✓ Created appointments table');

    // 3. Check if activity_log exists (should already exist)
    const { rows: activityExists } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_log'
      );
    `);
    
    if (!activityExists[0].exists) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS activity_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID,
          lead_id UUID NOT NULL REFERENCES lead_pipeline(id) ON DELETE CASCADE,
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          user_name VARCHAR(255) NOT NULL,
          action VARCHAR(255) NOT NULL,
          action_data JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_activity_log_lead_id ON activity_log(lead_id);
        CREATE INDEX IF NOT EXISTS idx_activity_log_session_id ON activity_log(session_id);
        CREATE INDEX IF NOT EXISTS idx_activity_log_user_name ON activity_log(user_name);
      `);
      console.log('✓ Created activity_log table');
    } else {
      console.log('✓ activity_log table already exists');
    }

    // 4. Check if contact_log exists
    const { rows: contactExists } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'contact_log'
      );
    `);
    
    if (!contactExists[0].exists) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS contact_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          contact_type VARCHAR(255) NOT NULL,
          contact_data JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_contact_log_company_id ON contact_log(company_id);
      `);
      console.log('✓ Created contact_log table');
    } else {
      console.log('✓ contact_log table already exists');
    }

    console.log('✅ All missing tables created successfully');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createMissingTables().catch(error => {
  console.error('Table creation failed:', error.message);
  process.exit(1);
});