const { Pool } = require('pg');

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some PostgreSQL providers
  }
});

async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function createEquipmentTable() {
  try {
    console.log('Creating equipment table...');

    // Create equipment table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_equipment (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        contact_id INTEGER NOT NULL,
        equipment_type VARCHAR(100) NOT NULL,
        make VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        installation_date DATE,
        btu_rating INTEGER,
        tonnage DECIMAL(4,1),
        efficiency_rating VARCHAR(50),
        refrigerant_type VARCHAR(50),
        location VARCHAR(100),
        notes TEXT,
        warranty_expiration DATE,
        warranty_details TEXT,
        last_service_date DATE,
        next_service_date DATE,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `);
    console.log('- Created hvac_equipment table');

    // Create equipment service history table
    await query(`
      CREATE TABLE IF NOT EXISTS hvac_equipment_service (
        id SERIAL PRIMARY KEY,
        equipment_id INTEGER NOT NULL,
        service_date DATE NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        technician VARCHAR(255),
        description TEXT,
        parts_replaced TEXT,
        cost DECIMAL(10,2),
        recommendations TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_equipment
          FOREIGN KEY(equipment_id) 
          REFERENCES hvac_equipment(id)
          ON DELETE CASCADE
      )
    `);
    console.log('- Created hvac_equipment_service table');

    console.log('Equipment tables created successfully!');
  } catch (error) {
    console.error('Error creating equipment tables:', error);
    throw error;
  }
}

async function main() {
  try {
    await createEquipmentTable();
    console.log('All done!');
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();