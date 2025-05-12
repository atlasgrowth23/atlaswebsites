import { query } from '../lib/db';

/**
 * Seeds the database with initial HVAC business data for testing
 */
async function seedHvacData() {
  try {
    console.log('Seeding HVAC business data...');

    // Get list of companies for seeding data
    const companiesResult = await query(`
      SELECT id, slug, name, city, state 
      FROM companies 
      LIMIT 10
    `);
    
    if (companiesResult.rows.length === 0) {
      console.log('No companies found for seeding data');
      return;
    }

    for (const company of companiesResult.rows) {
      const companyId = company.slug; // Using slug as company_id
      console.log(`Seeding data for company: ${company.name} (${companyId})`);
      
      // Check if company already has contacts
      const existingContacts = await query(
        'SELECT COUNT(*) FROM hvac_contacts WHERE company_id = $1',
        [companyId]
      );
      
      if (parseInt(existingContacts.rows[0].count) > 0) {
        console.log(`- Company ${company.name} already has data, skipping...`);
        continue;
      }
      
      // Seed contacts
      const contactsData = [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '(555) 123-4567',
          address: '123 Oak Street',
          city: company.city || 'Springfield',
          state: company.state || 'IL',
          zip: '12345',
          type: 'residential'
        },
        {
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          phone: '(555) 987-6543',
          address: '456 Maple Avenue',
          city: company.city || 'Springfield', 
          state: company.state || 'IL',
          zip: '12345',
          type: 'residential'
        },
        {
          name: 'Riverside Elementary School',
          email: 'admin@riversideelem.edu',
          phone: '(555) 555-1000',
          address: '789 River Road',
          city: company.city || 'Springfield',
          state: company.state || 'IL',
          zip: '12345',
          type: 'commercial'
        },
        {
          name: 'David Wilson',
          email: 'david.wilson@example.com',
          phone: '(555) 222-3333',
          address: '321 Pine Lane',
          city: company.city || 'Springfield',
          state: company.state || 'IL',
          zip: '12345',
          type: 'residential'
        },
        {
          name: 'Main Street Cafe',
          email: 'info@mainstreetcafe.com',
          phone: '(555) 444-5555',
          address: '567 Main Street',
          city: company.city || 'Springfield',
          state: company.state || 'IL',
          zip: '12345',
          type: 'commercial'
        }
      ];
      
      console.log(`- Adding ${contactsData.length} contacts`);
      const contactIds = [];
      
      for (const contact of contactsData) {
        const insertResult = await query(`
          INSERT INTO hvac_contacts 
            (company_id, name, email, phone, address, city, state, zip, type, created_at)
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING id
        `, [
          companyId,
          contact.name,
          contact.email,
          contact.phone,
          contact.address,
          contact.city,
          contact.state,
          contact.zip,
          contact.type
        ]);
        
        contactIds.push(insertResult.rows[0].id);
      }
      
      // Seed equipment for each contact
      console.log('- Adding equipment for contacts');
      
      const equipmentData = [
        {
          contact_index: 0,
          equipment_type: 'Air Conditioner',
          brand: 'Carrier',
          model: 'Infinity 21',
          serial_number: 'CA123456789',
          installation_date: '2022-05-15',
          warranty_expiration: '2027-05-15'
        },
        {
          contact_index: 0,
          equipment_type: 'Furnace',
          brand: 'Trane',
          model: 'XC95m',
          serial_number: 'TF987654321',
          installation_date: '2021-10-20',
          warranty_expiration: '2031-10-20'
        },
        {
          contact_index: 1,
          equipment_type: 'Heat Pump',
          brand: 'Lennox',
          model: 'XP25',
          serial_number: 'LH456789123',
          installation_date: '2023-03-10',
          warranty_expiration: '2033-03-10'
        },
        {
          contact_index: 2,
          equipment_type: 'Commercial HVAC',
          brand: 'York',
          model: 'Predator',
          serial_number: 'YP123987456',
          installation_date: '2020-08-01',
          warranty_expiration: '2025-08-01'
        },
        {
          contact_index: 3,
          equipment_type: 'Air Conditioner',
          brand: 'Rheem',
          model: 'RA16',
          serial_number: 'RH789456123',
          installation_date: '2022-07-15',
          warranty_expiration: '2027-07-15'
        },
        {
          contact_index: 4,
          equipment_type: 'Rooftop Unit',
          brand: 'Daikin',
          model: 'Rebel',
          serial_number: 'DR159753486',
          installation_date: '2021-12-10',
          warranty_expiration: '2026-12-10'
        }
      ];
      
      for (const equipment of equipmentData) {
        const contactId = contactIds[equipment.contact_index];
        
        await query(`
          INSERT INTO hvac_equipment 
            (company_id, contact_id, equipment_type, brand, model, serial_number, 
             installation_date, warranty_expiration, created_at)
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          companyId,
          contactId,
          equipment.equipment_type,
          equipment.brand,
          equipment.model,
          equipment.serial_number,
          equipment.installation_date,
          equipment.warranty_expiration
        ]);
      }
      
      // Seed jobs
      console.log('- Adding jobs');
      
      const currentDate = new Date();
      const yesterday = new Date(currentDate);
      yesterday.setDate(currentDate.getDate() - 1);
      
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      
      const lastWeek = new Date(currentDate);
      lastWeek.setDate(currentDate.getDate() - 7);
      
      const jobsData = [
        {
          contact_index: 0,
          description: 'Annual maintenance check for AC unit',
          status: 'scheduled',
          priority: 'medium',
          scheduled_date: tomorrow.toISOString(),
          technician: 'Mike Johnson',
          job_type: 'Maintenance'
        },
        {
          contact_index: 1,
          description: 'Heat pump not working properly, making strange noise',
          status: 'in-progress',
          priority: 'high',
          scheduled_date: yesterday.toISOString(),
          technician: 'Robert Davis',
          job_type: 'Repair'
        },
        {
          contact_index: 2,
          description: 'Commercial system maintenance and filter replacement',
          status: 'completed',
          priority: 'medium',
          scheduled_date: lastWeek.toISOString(),
          completion_date: yesterday.toISOString(),
          technician: 'James Wilson',
          job_type: 'Maintenance'
        },
        {
          contact_index: 3,
          description: 'New thermostat installation',
          status: 'scheduled',
          priority: 'low',
          scheduled_date: nextWeek.toISOString(),
          technician: 'Mike Johnson',
          job_type: 'Installation'
        },
        {
          contact_index: 4,
          description: 'Emergency - No cooling in restaurant dining area',
          status: 'completed',
          priority: 'emergency',
          scheduled_date: yesterday.toISOString(),
          completion_date: yesterday.toISOString(),
          technician: 'Emergency Team',
          job_type: 'Emergency'
        }
      ];
      
      const jobIds = [];
      
      for (const job of jobsData) {
        const contactId = contactIds[job.contact_index];
        
        const insertResult = await query(`
          INSERT INTO hvac_jobs 
            (company_id, customer_id, description, status, priority, 
             scheduled_date, completion_date, technician, job_type, created_at)
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING id
        `, [
          companyId,
          contactId,
          job.description,
          job.status,
          job.priority,
          job.scheduled_date,
          job.completion_date || null,
          job.technician,
          job.job_type
        ]);
        
        jobIds.push(insertResult.rows[0].id);
      }
      
      // Create invoices for completed jobs
      console.log('- Adding invoices');
      
      // List of completed jobs indices
      const completedJobsIndices = [2, 4];
      
      for (const jobIndex of completedJobsIndices) {
        const jobId = jobIds[jobIndex];
        const contactId = contactIds[jobsData[jobIndex].contact_index];
        
        await query(`
          INSERT INTO hvac_invoices 
            (company_id, job_id, contact_id, invoice_number, amount, tax_amount, 
             total_amount, date_issued, status, created_at)
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `, [
          companyId,
          jobId,
          contactId,
          `INV-${Date.now().toString().substring(7)}`,
          jobIndex === 2 ? 150.00 : 350.00,
          jobIndex === 2 ? 12.00 : 28.00,
          jobIndex === 2 ? 162.00 : 378.00,
          yesterday.toISOString(),
          'paid'
        ]);
      }
      
      console.log(`Completed seeding data for ${company.name}`);
    }

    console.log('HVAC data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding HVAC data:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await seedHvacData();
    console.log('HVAC database seeding completed!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    process.exit();
  }
}

// Run the script
main();