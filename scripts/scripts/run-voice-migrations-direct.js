const { createClient } = require('@supabase/supabase-js');

async function runVoiceMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('🎙️ Running Atlas Voice setup...');

    // Create voice_logs table directly
    console.log('Creating voice_logs table...');
    const { error: tableError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS voice_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID,
          tenant_id UUID,
          transcript TEXT,
          intent TEXT,
          confidence NUMERIC,
          success BOOLEAN,
          error_message TEXT,
          response_time_ms INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_voice_logs_tenant_id ON voice_logs(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_voice_logs_created_at ON voice_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_voice_logs_intent ON voice_logs(intent);
        CREATE INDEX IF NOT EXISTS idx_voice_logs_success ON voice_logs(success);
        
        ALTER TABLE voice_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "allow_all_voice_logs" ON voice_logs;
        CREATE POLICY "allow_all_voice_logs" ON voice_logs FOR ALL USING (true);
      `
    });

    if (tableError) {
      console.error('Table creation error:', tableError);
      throw tableError;
    }
    console.log('✓ voice_logs table created');

    // Add demo contacts
    console.log('Adding demo contacts...');
    const devTenantId = process.env.DEV_TENANT_ID || 'fb8681ab-f3e3-46c4-85b2-ea4aa0816adf';
    
    const demoContacts = [
      {
        first_name: 'Sandy',
        last_name: 'Sanders',
        phone: '(601) 555-0101',
        email: 'sandy.sanders@email.com',
        address: {
          street: '31 Bridgeport Ln',
          city: 'Madison',
          state: 'MS',
          zip: '39110',
          formatted: '31 Bridgeport Ln, Madison, MS 39110'
        },
        lat: 32.4637,
        lng: -90.1284,
        equip_type: 'central_ac',
        model_number: 'TRANE-XR16',
        serial_number: 'AB-12345',
        install_date: '2022-06-15',
        filter_size: '16x25x1',
        warranty_expiry: '2027-06-15',
        notes: 'Prefers afternoon service calls. Gate code is 1234.'
      },
      {
        first_name: 'Laney',
        last_name: 'Sanders',
        phone: '(601) 555-0102',
        email: 'laney.sanders@email.com',
        address: {
          street: '4620 Jiggetts Rd',
          city: 'Jackson',
          state: 'MS',
          zip: '39211',
          formatted: '4620 Jiggetts Rd, Jackson, MS 39211'
        },
        lat: 32.3498,
        lng: -90.1848,
        equip_type: 'heat_pump',
        model_number: 'CARRIER-25HCB6',
        serial_number: 'CD-67890',
        install_date: '2021-03-20',
        filter_size: '20x25x1',
        warranty_expiry: '2026-03-20',
        notes: 'Customer has two small dogs. Use side entrance.'
      },
      {
        first_name: 'Judith',
        last_name: 'Harrison',
        phone: '(601) 555-0103',
        email: 'judith.harrison@email.com',
        address: {
          street: '5930 Baxter Dr',
          city: 'Jackson',
          state: 'MS',
          zip: '39211',
          formatted: '5930 Baxter Dr, Jackson, MS 39211'
        },
        lat: 32.3667,
        lng: -90.1976,
        equip_type: 'furnace',
        model_number: 'GOODMAN-GMVC96',
        serial_number: 'EF-11223',
        install_date: '2020-11-10',
        filter_size: '16x20x1',
        warranty_expiry: '2025-11-10',
        notes: 'Elderly customer. Prefers morning appointments.'
      },
      {
        first_name: 'Mark',
        last_name: 'Johnson',
        phone: '(601) 555-0104',
        email: 'mark.johnson@email.com',
        address: {
          street: '1234 Highland Dr',
          city: 'Jackson',
          state: 'MS',
          zip: '39216',
          formatted: '1234 Highland Dr, Jackson, MS 39216'
        },
        lat: 32.3317,
        lng: -90.2073,
        equip_type: 'mini_split',
        model_number: 'MITSUBISHI-MSZ',
        serial_number: 'GH-33445',
        install_date: '2023-02-14',
        filter_size: '12x24x1',
        warranty_expiry: '2028-02-14',
        notes: 'New customer. System still under warranty.'
      },
      {
        first_name: 'Lisa',
        last_name: 'Chen',
        phone: '(601) 555-0105',
        email: 'lisa.chen@email.com',
        address: {
          street: '789 Meadowbrook Rd',
          city: 'Jackson',
          state: 'MS',
          zip: '39206',
          formatted: '789 Meadowbrook Rd, Jackson, MS 39206'
        },
        lat: 32.3843,
        lng: -90.1370,
        equip_type: 'central_ac',
        model_number: 'RHEEM-RA17',
        serial_number: 'IJ-55667',
        install_date: '2019-08-05',
        filter_size: '20x25x4',
        warranty_expiry: '2024-08-05',
        notes: 'Property manager contact. Schedule through office.'
      }
    ];

    // Insert demo contacts
    for (const contact of demoContacts) {
      const { error: contactError } = await supabase
        .from('contacts')
        .upsert({
          ...contact,
          tenant_id: devTenantId
        }, { onConflict: 'tenant_id,first_name,last_name' });

      if (contactError && !contactError.message.includes('duplicate')) {
        console.warn(`Warning adding ${contact.first_name} ${contact.last_name}:`, contactError.message);
      }
    }

    console.log('✓ Demo contacts added');

    // Verify setup
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('first_name, last_name, address, lat, lng')
      .eq('tenant_id', devTenantId);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
    } else {
      console.log('📊 Demo contacts ready:');
      contacts.forEach(c => {
        console.log(`  - ${c.first_name} ${c.last_name} (${c.lat ? 'geocoded' : 'no location'})`);
      });
    }

    console.log('🎉 Atlas Voice database setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

runVoiceMigrations();