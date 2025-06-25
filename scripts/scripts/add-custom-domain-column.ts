import { createClient } from '@supabase/supabase-js';

async function addCustomDomainColumn() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Checking if custom domain columns exist...');

    // Try to select custom_domain column to see if it exists
    const { error: testError } = await supabase
      .from('companies')
      .select('custom_domain, domain_verified')
      .limit(1);

    if (testError && testError.message.includes('custom_domain')) {
      console.log('Columns do not exist. You need to run this SQL manually in your Supabase SQL editor:');
      console.log(`
ALTER TABLE companies 
ADD COLUMN custom_domain TEXT UNIQUE,
ADD COLUMN domain_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN domain_configured_at TIMESTAMPTZ;

CREATE INDEX idx_companies_custom_domain ON companies(custom_domain) WHERE custom_domain IS NOT NULL;
      `);
      return;
    }

    console.log('✅ Custom domain columns already exist or query successful');
    
    // Test that we can query them
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, custom_domain, domain_verified')
      .limit(1);
      
    if (error) {
      console.error('Error querying columns:', error);
    } else {
      console.log('✅ Successfully queried domain columns:', data?.[0] || 'No companies found');
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

addCustomDomainColumn();