require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Seed one owner for each company in the database
 */
async function seedCompanyOwners() {
  try {
    console.log('Starting to seed company owners...');
    
    // Get all companies
    const companies = await query('SELECT id, name, slug FROM companies');
    console.log(`Found ${companies.rows.length} companies to process`);
    
    // For each company, add an owner if one doesn't exist
    for (const company of companies.rows) {
      // Check if the company already has an owner
      const existingOwner = await query(
        'SELECT id FROM company_users WHERE company_id = $1 AND role = $2 LIMIT 1',
        [company.id, 'owner']
      );
      
      if (existingOwner.rows.length === 0) {
        // Create owner email based on company slug
        const ownerEmail = `owner@${company.slug}.test`;
        
        // Insert the owner
        await query(
          `INSERT INTO company_users 
          (company_id, name, email, role, invite_status) 
          VALUES ($1, $2, $3, $4, $5)`,
          [company.id, `${company.name} Owner`, ownerEmail, 'owner', 'accepted']
        );
        
        console.log(`Created owner for ${company.name} (${company.slug})`);
      } else {
        console.log(`Owner already exists for ${company.name} (${company.slug})`);
      }
    }
    
    console.log('Completed seeding company owners successfully!');
  } catch (error) {
    console.error('Error seeding company owners:', error);
  } finally {
    pool.end();
  }
}

// Run the seed function
seedCompanyOwners();