const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  try {
    // Check contacts
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    console.log('👥 Current Contacts Data:');
    if (contacts?.length > 0) {
      console.log(`Found ${contacts.length} contacts`);
      console.log('Available fields:', Object.keys(contacts[0]));
      contacts.forEach(c => {
        console.log(`  - ${c.first_name} ${c.last_name} (${c.phone || 'no phone'})`);
        if (c.notes) console.log(`    Notes: ${c.notes.substring(0, 50)}...`);
        if (c.address?.formatted) console.log(`    Address: ${c.address.formatted}`);
        if (c.serial_number) console.log(`    Equipment: ${c.equip_type} serial ${c.serial_number}`);
      });
    } else {
      console.log('  No contacts found');
    }
    
    // Check what business data we have  
    const { data: companies, error: cError } = await supabase
      .from('companies')
      .select('name, city, state')
      .limit(5);
      
    if (!cError && companies?.length > 0) {
      console.log('\n🏢 Available Business Data:');
      companies.forEach(c => console.log(`  - ${c.name} (${c.city}, ${c.state})`));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();