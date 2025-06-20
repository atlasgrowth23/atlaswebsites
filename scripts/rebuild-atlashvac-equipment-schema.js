const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function rebuildAtlasHVACEquipmentSchema() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in .env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Rebuilding AtlasHVAC Equipment schema (starting fresh)...');
    
    // 1. Drop existing equipment tables (start fresh)
    console.log('🗑️  Dropping existing equipment tables...');
    await client.query(`
      DROP TABLE IF EXISTS atlashvac_equipment_photos CASCADE;
      DROP TABLE IF EXISTS atlashvac_service_notes CASCADE;
      DROP TABLE IF EXISTS atlashvac_equipment CASCADE;
    `);
    console.log('✓ Existing tables dropped');
    
    // 2. Create atlashvac_equipment table
    console.log('📝 Creating atlashvac_equipment table...');
    await client.query(`
      CREATE TABLE atlashvac_equipment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL REFERENCES atlashvac_contacts(id) ON DELETE CASCADE,
        equipment_type TEXT NOT NULL CHECK (equipment_type IN ('Split AC', 'Furnace', 'Heat Pump', 'Rooftop Unit', 'Chiller', 'Other')),
        brand TEXT,
        model_number TEXT,
        serial_number TEXT,
        location_on_site TEXT,
        capacity_size TEXT,
        refrigerant TEXT,
        efficiency_rating TEXT,
        install_date DATE,
        warranty_ends DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX idx_atlashvac_equipment_tenant_id ON atlashvac_equipment(tenant_id);
      CREATE INDEX idx_atlashvac_equipment_contact_id ON atlashvac_equipment(contact_id);
      CREATE INDEX idx_atlashvac_equipment_tenant_contact ON atlashvac_equipment(tenant_id, contact_id);
    `);
    console.log('✓ atlashvac_equipment table created');
    
    // 3. Create atlashvac_equipment_photos table
    console.log('📝 Creating atlashvac_equipment_photos table...');
    await client.query(`
      CREATE TABLE atlashvac_equipment_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        equipment_id UUID NOT NULL REFERENCES atlashvac_equipment(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX idx_atlashvac_equipment_photos_tenant_id ON atlashvac_equipment_photos(tenant_id);
      CREATE INDEX idx_atlashvac_equipment_photos_equipment_id ON atlashvac_equipment_photos(equipment_id);
    `);
    console.log('✓ atlashvac_equipment_photos table created');
    
    // 4. Create atlashvac_service_notes table
    console.log('📝 Creating atlashvac_service_notes table...');
    await client.query(`
      CREATE TABLE atlashvac_service_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL REFERENCES atlashvac_contacts(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        notes TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX idx_atlashvac_service_notes_tenant_id ON atlashvac_service_notes(tenant_id);
      CREATE INDEX idx_atlashvac_service_notes_contact_id ON atlashvac_service_notes(contact_id);
      CREATE INDEX idx_atlashvac_service_notes_date ON atlashvac_service_notes(date);
    `);
    console.log('✓ atlashvac_service_notes table created');
    
    // 5. Create trigger for updated_at on atlashvac_equipment
    console.log('📝 Creating updated_at trigger...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      CREATE TRIGGER update_atlashvac_equipment_updated_at 
        BEFORE UPDATE ON atlashvac_equipment 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✓ Updated_at trigger created');
    
    // 6. Verify schema
    console.log('📝 Verifying new schema...');
    const equipmentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'atlashvac_equipment' 
      ORDER BY ordinal_position;
    `);
    
    const photoColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'atlashvac_equipment_photos' 
      ORDER BY ordinal_position;
    `);
    
    const serviceColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'atlashvac_service_notes' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Final Schema:');
    console.log('Equipment columns:', equipmentColumns.rows.map(r => `${r.column_name}(${r.data_type})`).join(', '));
    console.log('Photos columns:', photoColumns.rows.map(r => r.column_name).join(', '));
    console.log('Service columns:', serviceColumns.rows.map(r => r.column_name).join(', '));
    
    console.log('✅ Schema rebuild completed successfully');
    
  } catch (error) {
    console.error('❌ Schema rebuild failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

rebuildAtlasHVACEquipmentSchema().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});