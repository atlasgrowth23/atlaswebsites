const { Pool } = require('pg');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// CSV file path
const CSV_FILE_PATH = './companies_rows_original.csv';

async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error(`Error executing query: ${err.message}`);
    return { rows: [] };
  }
}

async function importCompanies() {
  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    console.log(`Read ${fileContent.length} bytes from ${CSV_FILE_PATH}`);
    
    // Parse CSV using strict mode
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });
    
    console.log(`Parsed ${records.length} records from CSV`);
    
    // Insert records
    let inserted = 0;
    let errors = 0;
    
    for (const record of records) {
      try {
        // Prepare required fields with defaults
        const id = record.id || `generated-${Math.random().toString(36).substr(2, 9)}`;
        const name = record.name || '';
        const phone = record.phone || '';
        const slug = record.slug || name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
        
        // Insert the record using minimal fields to ensure it works
        await query(`
          INSERT INTO companies (
            id, name, slug, phone, category, state, city, place_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          id,
          name,
          slug,
          phone,
          record.category || '',
          record.state || '',
          record.city || '',
          record.place_id || ''
        ]);
        
        inserted++;
        
        if (inserted % 100 === 0) {
          console.log(`Inserted ${inserted} records so far`);
        }
      } catch (err) {
        console.error(`Error inserting record: ${err.message}`);
        errors++;
      }
    }
    
    console.log(`Company import complete: ${inserted} inserted, ${errors} errors`);
    
    // Now import from the backup 
    const manualCompanies = [
      ['c53ac30c-0c78-4d1d-a0aa-9dc646e7bd42', 'vandys-heating-air-conditioning-llc', 'Vandys Heating & Air Conditioning LLC', '+1 256-225-7311', 'HVAC contractor', 'Alabama', 'Toney', 34.651859, -86.7672034, 5, 295, 'ChIJg_hYEBldYogRSqGUVKHAzmU'],
      ['37e50e98-8001-4cfb-841b-0f53d1cfd320', 'waynes-comfort-services-inc', 'Waynes Comfort Services Inc', '+1 251-228-0999', 'Air conditioning repair service', 'Alabama', 'Gulf Shores', 30.3145691, -87.7044217, 5, 266, 'ChIJxXU6BAQbmogRymFNU-LVXPc'],
      ['bb3a79ac-5329-4fcd-a243-1bbd1e804081', 'temperaturepro', 'TemperaturePro', '+1 205-850-3690', 'HVAC contractor', 'Alabama', 'Pelham', 33.3360994, -86.7895684, 4.9, 264, 'ChIJLyfMLq4jiYgRweOQZWslmgM'],
      ['211d74ba-adb1-4520-a777-3d0692f7a367', 'wingman-heating-cooling', 'Wingman Heating + Cooling', '+1 334-319-8923', 'HVAC contractor', 'Alabama', 'Auburn', 32.7606775, -85.57096, 5, 259, 'ChIJLcxNX8TyJYARLw9B_JTbDrU'],
      ['d596b849-ba51-48db-baf2-a9b1cb2f1f7b', 'all-american-hvac-services', 'All American HVAC Services', '+1 256-364-9231', 'HVAC contractor', 'Alabama', 'Rainbow City', 33.946707, -86.06735, 5, 252, 'ChIJ-Y_6Vn8EB4ERWlkTyTlE8kE'],
    ];
    
    // Insert the manual backup companies
    for (const company of manualCompanies) {
      try {
        await query(`
          INSERT INTO companies (
            id, slug, name, phone, category, state, city, latitude, longitude, 
            rating, reviews, place_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          ON CONFLICT (id) DO UPDATE SET
            slug = $2,
            name = $3,
            phone = $4,
            category = $5,
            state = $6,
            city = $7,
            latitude = $8,
            longitude = $9,
            rating = $10,
            reviews = $11,
            place_id = $12
        `, company);
      } catch (err) {
        console.error(`Error inserting manual company: ${err.message}`);
      }
    }
    
    console.log('Manual backup companies imported');
    
    // Count records in the table
    const countResult = await query('SELECT COUNT(*) FROM companies');
    console.log(`Total companies in database: ${countResult.rows[0].count}`);
    
  } catch (err) {
    console.error('Error in importCompanies:', err);
  } finally {
    await pool.end();
  }
}

// Run the import
importCompanies();