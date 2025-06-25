// Safe test script - only sends to your test number: 205-500-5170

const TEST_COMPANIES = [
  {
    slug: 'ready-heating-and-air-llc',
    name: 'Ready Heating and Air LLC',
    videoContact: 'John Rangan'
  },
  {
    slug: 'calderas-heating-and-air', 
    name: 'Calderas Heating and Air',
    videoContact: 'Sarah Acker'
  },
  {
    slug: 'toms-heating-and-air-conditioning',
    name: "Tom's Heating & Air Conditioning", 
    videoContact: 'Robert Suun'
  }
];

const YOUR_TEST_PHONE = '205-500-5170'; // Only sends to this number

async function testVideoIntroSafe() {
  console.log('🧪 Safe Video Intro Test - Only sending to 205-500-5170\n');

  // Test video landing page URLs
  console.log('🔗 Video Landing Page URLs:');
  for (const company of TEST_COMPANIES) {
    const videoUrl = `http://localhost:3000/video-intro/${company.slug}`;
    console.log(`📹 ${company.name}: ${videoUrl}`);
  }

  // Test SMS API endpoint (test mode only)
  console.log('\n📱 Testing SMS API (test mode):');
  for (const company of TEST_COMPANIES) {
    try {
      const response = await fetch('http://localhost:3000/api/textgrid/send-video-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companySlug: company.slug,
          phoneNumber: YOUR_TEST_PHONE,
          testMode: true, // Always test mode for safety
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${company.name}: Ready to send`);
        console.log(`   👤 Video by: ${result.videoData?.firstName} ${result.videoData?.lastName}`);
        console.log(`   🎬 Video ID: ${result.videoData?.videoId}`);
      } else {
        console.log(`❌ ${company.name}: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${company.name}: Server not running (npm run dev)`);
    }
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. Start dev server: npm run dev');  
  console.log('2. Visit the landing page URLs above');
  console.log('3. When ready, set testMode: false and send to 205-500-5170');
}

testVideoIntroSafe();