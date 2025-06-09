const fetch = require('node-fetch');
require('dotenv').config({ path: 'env.local' });

async function testAppointmentEmail() {
  try {
    console.log('🚀 Testing appointment email API...');
    
    const response = await fetch('http://localhost:3000/api/send-appointment-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ownerEmail: 'nicksanford2341@gmail.com',
        ownerName: 'Nick Test',
        companyName: 'Test Company',
        appointmentDate: 'Tuesday, June 10, 2025',
        appointmentTime: '2:00 PM',
        phoneNumber: '205-500-5170',
        setBy: 'nick'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data);
    } else {
      console.log('❌ Error:', response.status, data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAppointmentEmail();