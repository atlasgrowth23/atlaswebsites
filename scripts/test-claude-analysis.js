const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testClaudeAnalysis() {
  console.log('🤖 Testing Claude photo analysis...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/analyze-photos-claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        limit: 3,  // Test with just 3 companies first
        maxPhotos: 5  // Max 5 photos per company for testing
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('📊 CLAUDE ANALYSIS RESULTS:');
    console.log('============================');
    console.log(`✅ Successful: ${result.summary.successful} companies`);
    console.log(`❌ Errors: ${result.summary.errors} companies`);
    console.log(`📸 Photos analyzed: ${result.summary.total_photos_analyzed}`);
    
    console.log('\n📋 COMPANY DETAILS:');
    console.log('===================');
    result.summary.companies.forEach((company, i) => {
      console.log(`${i + 1}. ${company.name}`);
      if (company.error) {
        console.log(`   ❌ Error: ${company.error}`);
      } else {
        console.log(`   📸 Photos analyzed: ${company.photos_analyzed}`);
        console.log(`   🎯 Best photos found: ${company.best_photos}`);
        console.log(`   📋 Placements:`);
        Object.entries(company.placements).forEach(([slot, placement]) => {
          if (placement) {
            console.log(`     ${slot}: Score ${placement.score}`);
          } else {
            console.log(`     ${slot}: No suitable photo`);
          }
        });
      }
    });

    console.log('\n🎯 Next Steps:');
    console.log('- Review Claude analysis results');
    console.log('- Run auto-placement to update company_frames');
    console.log('- Test website display with new photos');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testClaudeAnalysis();