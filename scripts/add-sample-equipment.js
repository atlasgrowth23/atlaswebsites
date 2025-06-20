const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function addSampleEquipment() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in .env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding sample equipment for AtlasHVAC contacts...');
    
    // Get the company ID
    const companyResult = await client.query(`
      SELECT id FROM companies WHERE slug = 'ready-heating-and-air-llc' LIMIT 1
    `);
    
    if (companyResult.rows.length === 0) {
      throw new Error('Company not found');
    }
    
    const companyId = companyResult.rows[0].id;
    console.log('✓ Company found:', companyId);
    
    // Get all contacts for this company
    const contactsResult = await client.query(`
      SELECT id, first_name, last_name FROM atlashvac_contacts 
      WHERE tenant_id = $1 
      ORDER BY first_name
    `, [companyId]);
    
    if (contactsResult.rows.length === 0) {
      throw new Error('No contacts found for company');
    }
    
    console.log('✓ Found contacts:', contactsResult.rows.map(c => `${c.first_name} ${c.last_name}`).join(', '));
    
    // Sample equipment data for each contact
    const equipmentData = [
      // Sandy Sanders - Residential customer with central air and furnace
      {
        contact: 'Sandy Sanders',
        equipment: [
          {
            equipment_type: 'Split AC',
            brand: 'Trane',
            model_number: 'XR13-036-230',
            serial_number: 'TR2023001234',
            location_on_site: 'Backyard',
            capacity_size: '3 Ton',
            refrigerant: 'R-410A',
            efficiency_rating: '14 SEER',
            install_date: '2021-05-15',
            warranty_ends: '2031-05-15'
          },
          {
            equipment_type: 'Furnace',
            brand: 'Trane',
            model_number: 'S9V2-080-4',
            serial_number: 'TR2021005678',
            location_on_site: 'Basement',
            capacity_size: '80k BTU',
            refrigerant: null,
            efficiency_rating: '96% AFUE',
            install_date: '2021-05-15',
            warranty_ends: '2031-05-15'
          }
        ]
      },
      
      // Judith Harrison - Older home with heat pump
      {
        contact: 'Judith Harrison',
        equipment: [
          {
            equipment_type: 'Heat Pump',
            brand: 'Carrier',
            model_number: '25HCB436A003',
            serial_number: 'CR2020009876',
            location_on_site: 'Side Yard',
            capacity_size: '3.5 Ton',
            refrigerant: 'R-410A',
            efficiency_rating: '16 SEER',
            install_date: '2020-03-22',
            warranty_ends: '2030-03-22'
          }
        ]
      },
      
      // Mark Johnson - Commercial customer with rooftop unit
      {
        contact: 'Mark Johnson',
        equipment: [
          {
            equipment_type: 'Rooftop Unit',
            brand: 'Lennox',
            model_number: 'LGH120H4E',
            serial_number: 'LX2022003456',
            location_on_site: 'Rooftop',
            capacity_size: '10 Ton',
            refrigerant: 'R-410A',
            efficiency_rating: '11.2 EER',
            install_date: '2022-08-10',
            warranty_ends: '2032-08-10'
          },
          {
            equipment_type: 'Split AC',
            brand: 'Lennox',
            model_number: 'EL16XC1-036-230',
            serial_number: 'LX2022007890',
            location_on_site: 'Office Area',
            capacity_size: '3 Ton',
            refrigerant: 'R-410A',
            efficiency_rating: '17 SEER',
            install_date: '2022-08-12',
            warranty_ends: '2032-08-12'
          }
        ]
      }
    ];
    
    // Insert equipment for each contact
    for (const contactData of equipmentData) {
      // Find the contact by name
      const contact = contactsResult.rows.find(c => 
        `${c.first_name} ${c.last_name}` === contactData.contact
      );
      
      if (!contact) {
        console.log(`⚠️  Contact not found: ${contactData.contact}`);
        continue;
      }
      
      console.log(`📝 Adding equipment for ${contactData.contact}...`);
      
      for (const equipment of contactData.equipment) {
        await client.query(`
          INSERT INTO atlashvac_equipment (
            tenant_id, contact_id, equipment_type, brand, model_number, 
            serial_number, location_on_site, capacity_size, refrigerant, 
            efficiency_rating, install_date, warranty_ends
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          companyId,
          contact.id,
          equipment.equipment_type,
          equipment.brand,
          equipment.model_number,
          equipment.serial_number,
          equipment.location_on_site,
          equipment.capacity_size,
          equipment.refrigerant,
          equipment.efficiency_rating,
          equipment.install_date,
          equipment.warranty_ends
        ]);
        
        console.log(`  ✓ Added ${equipment.equipment_type} (${equipment.brand} ${equipment.model_number})`);
      }
    }
    
    // Verify what we created
    const equipmentCountResult = await client.query(`
      SELECT 
        c.first_name,
        c.last_name,
        COUNT(e.id) as equipment_count
      FROM atlashvac_contacts c
      LEFT JOIN atlashvac_equipment e ON c.id = e.contact_id
      WHERE c.tenant_id = $1
      GROUP BY c.id, c.first_name, c.last_name
      ORDER BY c.first_name
    `, [companyId]);
    
    console.log('\n📊 Equipment Summary:');
    equipmentCountResult.rows.forEach(row => {
      console.log(`  ${row.first_name} ${row.last_name}: ${row.equipment_count} pieces of equipment`);
    });
    
    console.log('\n✅ Sample equipment added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addSampleEquipment().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});