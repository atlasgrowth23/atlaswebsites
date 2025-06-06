const fetch = require('node-fetch');

async function testApiFix() {
  try {
    console.log('🧪 Testing fixed API...');
    
    const response = await fetch('http://localhost:3000/api/pipeline/leads?pipeline_type=no_website_alabama');
    
    if (!response.ok) {
      console.error('❌ API Response not OK:', response.status, response.statusText);
      const text = await response.text();
      console.error('Error details:', text);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response:');
    console.log(`  Pipeline Type: ${data.pipeline_type}`);
    console.log(`  Leads Count: ${data.leads?.length || 0}`);
    console.log(`  Pipeline Stats:`, data.pipeline_stats);
    
    if (data.leads && data.leads.length > 0) {
      console.log('\n📋 Sample leads:');
      data.leads.slice(0, 3).forEach((lead, i) => {
        console.log(`  ${i+1}. ${lead.company.name}: ${lead.stage}`);
      });
    } else {
      console.log('\n❌ No leads returned!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testApiFix();