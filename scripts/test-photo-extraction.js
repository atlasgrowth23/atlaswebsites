const fetch = require('node-fetch');

async function testPhotoExtraction() {
  console.log('🚀 Testing photo extraction API...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/extract-photos-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('📊 TEST RESULTS:');
    console.log('================');
    console.log(`✅ Successful: ${result.summary.successful} companies`);
    console.log(`⏭️ Skipped: ${result.summary.skipped} companies`);
    console.log(`❌ Errors: ${result.summary.errors} companies`);
    console.log(`📸 Total photos: ${result.summary.total_photos_saved}`);
    console.log(`📐 Avg dimensions: ${result.summary.avg_dimensions.width}x${result.summary.avg_dimensions.height}`);
    
    console.log('\n📋 COMPANY DETAILS:');
    console.log('==================');
    result.companies.forEach((company, i) => {
      console.log(`${i + 1}. ${company.name} (${company.status.toUpperCase()})`);
      if (company.status === 'success') {
        console.log(`   📸 Photos: ${company.photos_saved}/${company.photos_found} saved`);
        console.log(`   📍 Location: ${company.city}, ${company.state}`);
      } else if (company.status === 'skipped') {
        console.log(`   ⚠️ Reason: ${company.reason}`);
      } else if (company.status === 'error') {
        console.log(`   ❌ Error: ${company.error}`);
      }
    });

    console.log('\n🎯 Next Steps:');
    console.log('- Review successful extractions');
    console.log('- Add Claude analysis for companies with 5+ photos');
    console.log('- Implement auto-placement for company_frames');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPhotoExtraction();