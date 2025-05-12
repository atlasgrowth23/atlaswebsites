import { query } from '../lib/db';

async function main() {
  try {
    console.log('Creating messages table...');

    // Create messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_email VARCHAR(255) NOT NULL,
        sender_phone VARCHAR(50),
        message_content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        read BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('- messages table created successfully');

    // Seed messages with initial data
    const companies = await query(`
      SELECT slug FROM companies LIMIT 10
    `);
    
    console.log(`Found ${companies.rows.length} companies to seed messages for`);
    
    for (const company of companies.rows) {
      const companyId = company.slug;
      
      // Check if company already has messages
      const existingMessages = await query(
        'SELECT COUNT(*) FROM messages WHERE company_id = $1',
        [companyId]
      );
      
      if (parseInt(existingMessages.rows[0].count) > 0) {
        console.log(`- Company ${companyId} already has messages, skipping...`);
        continue;
      }
      
      console.log(`- Adding messages for company ${companyId}`);
      
      // Add messages
      await query(`
        INSERT INTO messages 
          (company_id, sender_name, sender_email, sender_phone, message_content, created_at, read)
        VALUES
          ($1, 'John Smith', 'john.smith@example.com', '(555) 123-4567', 'I need service for my AC unit. It''s not cooling properly and making strange noises. Can someone come take a look at it this week?', NOW() - INTERVAL '2 days', FALSE),
          ($1, 'Sarah Johnson', 'sarah.j@example.com', '(555) 987-6543', 'Hi there, I''m interested in getting a quote for a new HVAC system for my home. We have about 2,000 sq ft. When can someone come out for an estimate?', NOW() - INTERVAL '5 days', TRUE),
          ($1, 'Mike Wilson', 'mike.w@example.com', '(555) 555-5555', 'My furnace is making a loud banging noise when it turns on. It''s concerning and I need someone to check it ASAP. Please call me when you can fit me in.', NOW() - INTERVAL '1 day', FALSE),
          ($1, 'Emily Davis', 'emily.davis@example.com', NULL, 'Just wanted to say thank you for the great service last week. The technician was professional and fixed our issue quickly.', NOW() - INTERVAL '10 days', TRUE),
          ($1, 'Robert Brown', 'robert.b@example.com', '(555) 222-3333', 'I need to schedule my annual maintenance for my HVAC system. I''m a regular customer and would like to set something up for next month.', NOW() - INTERVAL '3 hours', FALSE)
      `, [companyId]);
    }

    console.log('Messages table setup completed successfully!');
  } catch (error) {
    console.error('Error setting up messages table:', error);
  } finally {
    process.exit();
  }
}

// Run the script
main();