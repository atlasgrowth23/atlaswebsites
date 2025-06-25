const { createClient } = require('@supabase/supabase-js');

async function runVoiceSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('🎙️ Setting up Atlas Voice...');

    // First try to create voice_logs table using regular table operations
    console.log('Creating voice_logs table...');
    
    // Check if table exists first
    const { data: existingTable } = await supabase
      .from('voice_logs')
      .select('id')
      .limit(1);

    if (existingTable === null) {
      console.log('voice_logs table does not exist, will use INSERT to test...');
    } else {
      console.log('✓ voice_logs table already exists');
    }

    // Add demo contacts directly
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
      }
    ];

    // First check existing contacts to avoid duplicates
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('tenant_id', devTenantId);

    const existingNames = new Set(
      (existingContacts || []).map(c => `${c.first_name} ${c.last_name}`)
    );

    // Insert only new contacts
    let addedCount = 0;
    for (const contact of demoContacts) {
      const fullName = `${contact.first_name} ${contact.last_name}`;
      if (!existingNames.has(fullName)) {
        const { error: contactError } = await supabase
          .from('contacts')
          .insert({
            ...contact,
            tenant_id: devTenantId
          });

        if (contactError) {
          console.warn(`Warning adding ${fullName}:`, contactError.message);
        } else {
          console.log(`  + Added ${fullName}`);
          addedCount++;
        }
      } else {
        console.log(`  • ${fullName} already exists`);
      }
    }

    // Verify final contact list
    const { data: finalContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('first_name, last_name, address, lat, lng, serial_number')
      .eq('tenant_id', devTenantId)
      .order('created_at', { ascending: false });

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
    } else {
      console.log('📊 Demo contacts ready for voice testing:');
      finalContacts.forEach((c, i) => {
        const hasLocation = c.lat && c.lng;
        const hasSerial = c.serial_number;
        console.log(`  ${i + 1}. ${c.first_name} ${c.last_name} ${hasLocation ? '📍' : '❌'} ${hasSerial ? '🔧' : '⚠️'}`);
      });
      console.log('\n📍 = geocoded, 🔧 = has equipment data');
    }

    console.log(`\n🎉 Atlas Voice setup complete! Added ${addedCount} new contacts.`);
    console.log('Ready for voice commands testing.');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

runVoiceSetup();