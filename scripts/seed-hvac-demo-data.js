// Script to seed realistic HVAC demo data
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

// Realistic HVAC demo companies (using some of your existing companies as templates)
const demoCompanies = [
  {
    name: 'Atlas Heating & Air',
    city: 'Birmingham',
    state: 'AL',
    phone: '(205) 555-0101'
  },
  {
    name: 'Comfort Zone HVAC',
    city: 'Montgomery', 
    state: 'AL',
    phone: '(334) 555-0202'
  },
  {
    name: 'Elite Air Solutions',
    city: 'Mobile',
    state: 'AL', 
    phone: '(251) 555-0303'
  },
  {
    name: 'ProTech Heating & Cooling',
    city: 'Huntsville',
    state: 'AL',
    phone: '(256) 555-0404'
  }
];

// Realistic HVAC customer scenarios
const demoContacts = [
  {
    firstName: 'John',
    lastName: 'Smith',
    phone: '(205) 555-1234',
    email: 'john.smith@gmail.com',
    status: 'new_lead',
    serviceType: 'Repair',
    issue: 'AC unit making loud noises and not cooling properly'
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson', 
    phone: '(205) 555-5678',
    email: 'sarah.johnson@outlook.com',
    status: 'existing_customer',
    serviceType: 'Tune Up',
    issue: 'Annual maintenance for heat pump system'
  },
  {
    firstName: 'Mike',
    lastName: 'Davis',
    phone: '(205) 555-9012',
    email: null,
    status: 'new_lead',
    serviceType: 'Install',
    issue: 'Need new HVAC system for 2,400 sq ft home'
  },
  {
    firstName: 'Jennifer',
    lastName: 'Wilson',
    phone: '(205) 555-3456',
    email: 'j.wilson@email.com',
    status: 'new_lead',
    serviceType: 'Emergency',
    issue: 'Heater completely stopped working - family has no heat'
  },
  {
    firstName: 'Robert',
    lastName: 'Brown',
    phone: '(205) 555-7890',
    email: 'robert.brown@yahoo.com',
    status: 'existing_customer',
    serviceType: 'Repair',
    issue: 'Thermostat not responding, temperature inconsistent'
  },
  {
    firstName: 'Lisa',
    lastName: 'Anderson',
    phone: '(205) 555-2468',
    email: 'lisa.anderson@gmail.com',
    status: 'new_lead',
    serviceType: 'Install',
    issue: 'Replacing old unit, interested in energy efficient options'
  },
  {
    firstName: 'David',
    lastName: 'Martinez',
    phone: '(205) 555-1357',
    email: null,
    status: 'new_lead',
    serviceType: 'Repair',
    issue: 'AC blowing warm air, possible refrigerant leak'
  },
  {
    firstName: 'Amanda',
    lastName: 'Taylor',
    phone: '(205) 555-8024',
    email: 'amanda.taylor@hotmail.com',
    status: 'existing_customer',
    serviceType: 'Tune Up',
    issue: 'Pre-summer maintenance check for central air'
  }
];

// Additional chat messages for conversations
const demoMessages = [
  "Hi, I need help with my AC",
  "My heating system isn't working properly",
  "Can you give me a quote for a new HVAC system?",
  "I'm having an emergency - no heat and it's freezing",
  "My thermostat is acting up",
  "The air conditioner is making strange noises",
  "I need to schedule maintenance",
  "What's the cost for duct cleaning?",
  "My energy bills are really high lately",
  "The air quality in my home seems poor"
];

async function seedHVACDemoData() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in .env.local');
  }

  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding HVAC demo data...');

    // First, add is_demo column to tables if it doesn't exist
    console.log('📋 Adding demo flags to tables...');
    
    await client.query(`
      ALTER TABLE hvac_contacts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
      ALTER TABLE hvac_contact_activities ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
      ALTER TABLE hvac_conversations ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
      ALTER TABLE hvac_messages ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
    `);

    // Get existing companies to use for demo data
    const { rows: companies } = await client.query(`
      SELECT id, name FROM companies 
      WHERE name ILIKE '%heating%' OR name ILIKE '%air%' OR name ILIKE '%hvac%'
      LIMIT 4
    `);

    if (companies.length === 0) {
      console.log('⚠️  No HVAC companies found. Please create some companies first.');
      return;
    }

    console.log(`📊 Using ${companies.length} existing companies for demo data`);

    // Create demo contacts and activities for each company
    for (const company of companies) {
      console.log(`👥 Creating demo contacts for ${company.name}...`);
      
      // Create 2-3 contacts per company
      const contactsForCompany = demoContacts.slice(0, 3);
      
      for (let i = 0; i < contactsForCompany.length; i++) {
        const contact = contactsForCompany[i];
        const contactId = uuidv4();
        const conversationId = uuidv4();
        const visitorId = uuidv4();
        
        // Create contact
        await client.query(`
          INSERT INTO hvac_contacts (
            id, company_id, first_name, last_name, phone, email, 
            status, source, is_demo, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          contactId,
          company.id,
          contact.firstName,
          contact.lastName,
          contact.phone,
          contact.email,
          contact.status,
          'chat_widget',
          true, // is_demo
          new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
          new Date()
        ]);

        // Create conversation
        await client.query(`
          INSERT INTO hvac_conversations (
            id, company_id, contact_id, visitor_id, service_type, 
            status, is_demo, started_at, last_message_at, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          conversationId,
          company.id,
          contactId,
          visitorId,
          contact.serviceType,
          'active',
          true, // is_demo
          new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          new Date(),
          new Date()
        ]);

        // Create activities
        const activities = [
          {
            type: 'contact_created',
            description: `New contact created via chat widget for ${contact.serviceType} request`
          },
          {
            type: 'chat_service_request', 
            description: `Requested ${contact.serviceType} service via chat widget`
          },
          {
            type: 'chat_message_sent',
            description: `Sent message: "${contact.issue}"`
          }
        ];

        for (let j = 0; j < activities.length; j++) {
          const activity = activities[j];
          await client.query(`
            INSERT INTO hvac_contact_activities (
              contact_id, activity_type, description, is_demo, created_at
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            contactId,
            activity.type,
            activity.description,
            true, // is_demo
            new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 + (j * 60000)) // Stagger activities
          ]);
        }

        // Create some demo messages
        const messagesToCreate = Math.floor(Math.random() * 3) + 2; // 2-4 messages
        for (let k = 0; k < messagesToCreate; k++) {
          const isFromVisitor = k % 2 === 0; // Alternate between visitor and company
          const messageText = isFromVisitor ? 
            (k === 0 ? contact.issue : demoMessages[Math.floor(Math.random() * demoMessages.length)]) :
            "Thanks for reaching out! We'll help you with that right away.";

          await client.query(`
            INSERT INTO hvac_messages (
              conversation_id, company_id, contact_id, visitor_id,
              message, is_from_visitor, message_type, is_demo, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            conversationId,
            company.id,
            contactId,
            visitorId,
            messageText,
            isFromVisitor,
            'text',
            true, // is_demo
            new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 + (k * 120000)) // Stagger messages
          ]);
        }
      }
      
      console.log(`✓ Created ${contactsForCompany.length} demo contacts for ${company.name}`);
    }

    // Summary
    const { rows: summary } = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_demo = true) as demo_contacts,
        COUNT(*) FILTER (WHERE is_demo = false OR is_demo IS NULL) as real_contacts
      FROM hvac_contacts
    `);

    console.log('\n🎉 Demo data seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   • Demo contacts: ${summary[0].demo_contacts}`);
    console.log(`   • Real contacts: ${summary[0].real_contacts}`);
    console.log(`   • Demo activities and messages created`);
    console.log('\n💡 Next steps:');
    console.log('   1. Add demo mode toggle to /hvac/contacts');
    console.log('   2. Filter data by is_demo flag');
    console.log('   3. Perfect for sales demos and investor meetings!');
    
  } catch (error) {
    console.error('❌ Demo seeding error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedHVACDemoData().catch(error => {
  console.error('Demo seeding failed:', error.message);
  process.exit(1);
});