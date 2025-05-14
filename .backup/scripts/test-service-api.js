// Test script for the HVAC service-related API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const COMPANY_ID = 'demo-company';
const CONTACT_ID = 1;
const EQUIPMENT_ID = 1;
const JOB_ID = 1;

async function testServiceRecords() {
  console.log('\n=== Testing Service Records API ===');
  try {
    // Test listing service records
    const response = await fetch(`${BASE_URL}/api/hvac/service-records?company_id=${COMPANY_ID}&contact_id=${CONTACT_ID}`);
    const data = await response.json();
    
    console.log('GET service records status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // If the previous test was successful, try creating a record
    if (response.ok) {
      const createResponse = await fetch(`${BASE_URL}/api/hvac/service-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: COMPANY_ID,
          equipment_id: EQUIPMENT_ID,
          service_date: new Date().toISOString().split('T')[0],
          service_type: 'Test Service',
          technician: 'Test Technician',
          findings: 'Test findings',
          work_performed: 'Test work',
          recommendations: 'Test recommendations',
          follow_up_required: false
        }),
      });
      
      const createData = await createResponse.json();
      console.log('\nPOST create service record status:', createResponse.status);
      console.log('Response:', JSON.stringify(createData, null, 2));
    }
  } catch (error) {
    console.error('Error testing service records API:', error);
  }
}

async function testAppointments() {
  console.log('\n=== Testing Appointments API ===');
  try {
    // Test listing appointments
    const response = await fetch(`${BASE_URL}/api/hvac/appointments?company_id=${COMPANY_ID}&contact_id=${CONTACT_ID}`);
    const data = await response.json();
    
    console.log('GET appointments status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // If the previous test was successful, try creating an appointment
    if (response.ok) {
      const createResponse = await fetch(`${BASE_URL}/api/hvac/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: COMPANY_ID,
          customer_id: CONTACT_ID,
          equipment_id: EQUIPMENT_ID,
          description: 'Test appointment',
          priority: 'medium',
          scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          scheduled_time_start: '10:00',
          scheduled_time_end: '12:00',
          technician: 'Test Technician',
          job_type: 'maintenance'
        }),
      });
      
      const createData = await createResponse.json();
      console.log('\nPOST create appointment status:', createResponse.status);
      console.log('Response:', JSON.stringify(createData, null, 2));
    }
  } catch (error) {
    console.error('Error testing appointments API:', error);
  }
}

async function testJobStatus() {
  console.log('\n=== Testing Job Status API ===');
  try {
    // Update job status to in-progress
    const response = await fetch(`${BASE_URL}/api/hvac/job-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: COMPANY_ID,
        id: JOB_ID,
        status: 'in-progress',
        technician: 'Test Technician',
        notes: 'Started work on this job'
      }),
    });
    
    const data = await response.json();
    console.log('PUT update job status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing job status API:', error);
  }
}

// Run the tests
async function runTests() {
  try {
    console.log('=== Starting API Tests ===');
    console.log('Make sure the development server is running on localhost:3000\n');
    
    await testServiceRecords();
    await testAppointments();
    await testJobStatus();
    
    console.log('\n=== Completed API Tests ===');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests();