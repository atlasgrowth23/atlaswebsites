const { Pool } = require('pg');

// Create a new Pool using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Execute a query with error handling
 */
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
 * Creates the necessary tables for HVAC sales management
 */
async function createSalesTables() {
  // Create pipeline stages table
  await query(`
    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      order_num INTEGER NOT NULL,
      color VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create sales users table
  await query(`
    CREATE TABLE IF NOT EXISTS sales_users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      territory VARCHAR(100),
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create leads table
  await query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      company_id VARCHAR(255) NOT NULL,
      assigned_to INTEGER REFERENCES sales_users(id) ON DELETE SET NULL,
      stage_id INTEGER REFERENCES pipeline_stages(id) ON DELETE SET NULL,
      template_shared BOOLEAN DEFAULT FALSE,
      template_viewed BOOLEAN DEFAULT FALSE,
      template_view_count INTEGER DEFAULT 0,
      template_last_viewed TIMESTAMP,
      last_contact_date TIMESTAMP,
      next_follow_up TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create lead activities table
  await query(`
    CREATE TABLE IF NOT EXISTS lead_activities (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      notes TEXT,
      created_by INTEGER REFERENCES sales_users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create appointments table
  await query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      scheduled_date TIMESTAMP NOT NULL,
      status VARCHAR(50) DEFAULT 'scheduled',
      created_by INTEGER REFERENCES sales_users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('All sales tables created successfully!');

  // Insert default pipeline stages
  const stagesExist = await query('SELECT COUNT(*) FROM pipeline_stages');
  if (parseInt(stagesExist.rows[0].count) === 0) {
    await query(`
      INSERT INTO pipeline_stages (name, order_num, color) VALUES
        ('New Lead', 1, '#6366F1'),
        ('Initial Contact', 2, '#3B82F6'),
        ('Template Shared', 3, '#F59E0B'),
        ('Template Viewed', 4, '#10B981'),
        ('Appointment Scheduled', 5, '#8B5CF6'),
        ('Appointment Completed', 6, '#EC4899'),
        ('Deal Proposed', 7, '#F97316'),
        ('Closed Won', 8, '#22C55E'),
        ('Closed Lost', 9, '#EF4444')
    `);
    console.log('Default pipeline stages added');
  }

  // Insert default admin user
  const usersExist = await query('SELECT COUNT(*) FROM sales_users');
  if (parseInt(usersExist.rows[0].count) === 0) {
    await query(`
      INSERT INTO sales_users (name, email, territory, is_admin) VALUES
        ('Admin User', 'admin@example.com', NULL, TRUE),
        ('Jared Smith', 'jared@example.com', 'Arkansas', FALSE),
        ('Alabama Rep', 'alabama@example.com', 'Alabama', FALSE),
        ('Georgia Rep', 'georgia@example.com', 'Georgia', FALSE)
    `);
    console.log('Default users added');
  }

  // Insert sample leads for testing
  const leadsExist = await query('SELECT COUNT(*) FROM leads');
  if (parseInt(leadsExist.rows[0].count) === 0) {
    // Get first 10 companies from companies table
    const companiesResult = await query('SELECT id, name FROM companies LIMIT 10');
    const companies = companiesResult.rows;
    
    // Get actual sales user IDs from the database
    const usersResult = await query('SELECT id FROM sales_users');
    const userIds = usersResult.rows.map(user => user.id);
    
    // Get actual pipeline stage IDs from the database
    const stagesResult = await query('SELECT id FROM pipeline_stages');
    const stageIds = stagesResult.rows.map(stage => stage.id);

    if (companies.length > 0 && userIds.length > 0 && stageIds.length > 0) {
      for (const company of companies) {
        // Randomly select from actual stage IDs
        const stageId = stageIds[Math.floor(Math.random() * stageIds.length)];
        // Randomly select from actual user IDs
        const assignedTo = userIds[Math.floor(Math.random() * userIds.length)];
        // 50% chance of template shared
        const templateShared = Math.random() > 0.5;
        // If template shared, 30% chance of template viewed
        const templateViewed = templateShared && Math.random() > 0.7;
        // Random view count 0-5 if viewed
        const viewCount = templateViewed ? Math.floor(Math.random() * 5) + 1 : 0;
        
        await query(`
          INSERT INTO leads (
            company_id, stage_id, assigned_to, 
            template_shared, template_viewed, template_view_count,
            template_last_viewed, last_contact_date, next_follow_up, 
            notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          company.id,
          stageId,
          assignedTo,
          templateShared,
          templateViewed,
          viewCount,
          templateViewed ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null, // Random date in last week
          Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null, // 70% chance of contact in last month
          Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null, // 50% chance of follow-up in next week
          `Sample lead notes for ${company.name}. This HVAC company is located in our service area and has been identified as a potential sales opportunity.`
        ]);
      }
      console.log(`Added ${companies.length} sample leads`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await createSalesTables();
    console.log('Successfully created all sales tables!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sales tables:', error);
    process.exit(1);
  }
}

main();