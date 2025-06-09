const sgMail = require('@sendgrid/mail');
require('dotenv').config({ path: 'env.local' });

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testEmail() {
  try {
    console.log('🚀 Testing SendGrid email...');
    console.log('API Key:', process.env.SENDGRID_API_KEY ? 'Found' : 'Missing');
    
    const msg = {
      to: 'nicksanford2341@gmail.com',
      from: 'contact@atlasgrowth.ai', // Verified sender
      subject: 'Test Appointment Email from Atlas Growth',
      html: `
        <h2>🎉 Test Appointment Confirmation</h2>
        <p>This is a test email to verify SendGrid is working.</p>
        <p><strong>Date:</strong> Tomorrow</p>
        <p><strong>Time:</strong> 2:00 PM</p>
        <p><strong>Company:</strong> Test Company</p>
      `,
      text: 'Test appointment confirmation email from Atlas Growth'
    };

    await sgMail.send(msg);
    console.log('✅ Email sent successfully!');
    
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  }
}

testEmail();