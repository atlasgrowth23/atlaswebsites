const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test configuration
const TEST_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 50,
  TEST_DURATION_MS: 30000, // 30 seconds
  STRESS_TEST_ITERATIONS: 100,
  API_BASE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
};

class APIStressTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      responseTimeMs: [],
      errors: [],
      endpointResults: {}
    };
    this.testLeadId = null;
    this.testCompanyId = null;
    this.testSessionId = null;
  }

  async setup() {
    console.log('🔧 Setting up test environment...\n');
    
    const client = await pool.connect();
    try {
      // Check companies table structure first
      const tableInfo = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'companies' 
        ORDER BY ordinal_position
      `);
      const columns = tableInfo.rows.map(r => r.column_name);
      console.log('Companies table columns:', columns.join(', '));

      // Create test company with only required fields
      const companyResult = await client.query(`
        INSERT INTO companies (name, slug, template_key, updated_at)
        VALUES ('Test Company Stress', 'test-company-stress', 'ModernTrust', NOW())
        RETURNING id
      `);
      this.testCompanyId = companyResult.rows[0].id;

      // Create test lead
      const leadResult = await client.query(`
        INSERT INTO lead_pipeline (company_id, stage, updated_at)
        VALUES ($1, 'new_lead', NOW())
        RETURNING id
      `, [this.testCompanyId]);
      this.testLeadId = leadResult.rows[0].id;

      this.testSessionId = 'test-session-' + Date.now();

      console.log(`✅ Test setup complete:
   Company ID: ${this.testCompanyId}
   Lead ID: ${this.testLeadId}
   Session ID: ${this.testSessionId}\n`);
    } finally {
      client.release();
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM activity_log WHERE lead_id = $1', [this.testLeadId]);
      await client.query('DELETE FROM lead_tags WHERE lead_id = $1', [this.testLeadId]);
      await client.query('DELETE FROM template_views WHERE company_id = $1', [this.testCompanyId]);
      await client.query('DELETE FROM cold_call_sessions WHERE user_name LIKE $1', ['test-user-%']);
      await client.query('DELETE FROM lead_pipeline WHERE id = $1', [this.testLeadId]);
      await client.query('DELETE FROM companies WHERE id = $1', [this.testCompanyId]);
      
      console.log('✅ Test cleanup complete');
    } finally {
      client.release();
    }
  }

  async makeRequest(endpoint, method = 'POST', body = {}) {
    const startTime = Date.now();
    try {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify(body) : undefined
      });

      const responseTime = Date.now() - startTime;
      this.results.responseTimeMs.push(responseTime);
      this.results.totalRequests++;

      if (response.ok) {
        this.results.successCount++;
        return { success: true, data: await response.json(), responseTime };
      } else {
        this.results.errorCount++;
        const errorText = await response.text();
        this.results.errors.push({ endpoint, status: response.status, error: errorText });
        return { success: false, error: errorText, status: response.status, responseTime };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.results.responseTimeMs.push(responseTime);
      this.results.totalRequests++;
      this.results.errorCount++;
      this.results.errors.push({ endpoint, error: error.message });
      return { success: false, error: error.message, responseTime };
    }
  }

  async testAnalyticsTracking() {
    console.log('📊 Testing Analytics Tracking API...');
    
    const tests = [
      // Valid tracking request
      {
        name: 'Valid tracking request',
        payload: {
          companyId: this.testCompanyId,
          sessionId: this.testSessionId,
          visitorId: 'test-visitor-123',
          templateKey: 'ModernTrust',
          timeOnPage: 30,
          deviceType: 'desktop',
          userAgent: 'Mozilla/5.0 Test Browser',
          isInitial: true
        }
      },
      // Update existing session
      {
        name: 'Update existing session',
        payload: {
          companyId: this.testCompanyId,
          sessionId: this.testSessionId,
          visitorId: 'test-visitor-123',
          templateKey: 'ModernTrust',
          timeOnPage: 60,
          deviceType: 'desktop',
          userAgent: 'Mozilla/5.0 Test Browser',
          isInitial: false
        }
      },
      // Missing required fields
      {
        name: 'Missing companyId',
        payload: {
          sessionId: this.testSessionId,
          templateKey: 'ModernTrust',
          timeOnPage: 30
        }
      },
      // Invalid company ID
      {
        name: 'Invalid companyId',
        payload: {
          companyId: '00000000-0000-0000-0000-000000000000',
          sessionId: this.testSessionId,
          templateKey: 'ModernTrust',
          timeOnPage: 30
        }
      },
      // Edge case: very long session
      {
        name: 'Very long session (capped)',
        payload: {
          companyId: this.testCompanyId,
          sessionId: this.testSessionId + '-long',
          visitorId: 'test-visitor-long',
          templateKey: 'ModernTrust',
          timeOnPage: 3600, // 1 hour (should be capped at 30 min)
          deviceType: 'desktop',
          userAgent: 'Mozilla/5.0 Test Browser',
          isInitial: true
        }
      }
    ];

    for (const test of tests) {
      const result = await this.makeRequest('/api/analytics/track', 'POST', test.payload);
      console.log(`   ${test.name}: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
      if (!result.success && test.name.includes('Valid')) {
        console.log(`      Error: ${result.error}`);
      }
    }
  }

  async testActivityTracking() {
    console.log('\n🎯 Testing Activity Tracking API...');
    
    const tests = [
      {
        name: 'Preview website',
        payload: {
          leadId: this.testLeadId,
          companyId: this.testCompanyId,
          userName: 'test-user-stress',
          action: 'preview_website'
        }
      },
      {
        name: 'Call started',
        payload: {
          leadId: this.testLeadId,
          companyId: this.testCompanyId,
          userName: 'test-user-stress',
          action: 'call_started'
        }
      },
      {
        name: 'SMS answer call sent',
        payload: {
          leadId: this.testLeadId,
          companyId: this.testCompanyId,
          userName: 'test-user-stress',
          action: 'sms_answer_call_sent'
        }
      },
      {
        name: 'Owner email added',
        payload: {
          leadId: this.testLeadId,
          companyId: this.testCompanyId,
          userName: 'test-user-stress',
          action: 'owner_email_added',
          actionData: { email: 'test@stress.com' }
        }
      },
      {
        name: 'Missing required fields',
        payload: {
          leadId: this.testLeadId,
          action: 'test_action'
        }
      }
    ];

    for (const test of tests) {
      const result = await this.makeRequest('/api/activity/track', 'POST', test.payload);
      console.log(`   ${test.name}: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    }
  }

  async testSessionManagement() {
    console.log('\n⏱️  Testing Session Management APIs...');
    
    const userName = `test-user-${Date.now()}`;
    
    // Start session
    let result = await this.makeRequest('/api/sessions/start', 'POST', { userName });
    console.log(`   Start session: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    
    // Get active session
    result = await this.makeRequest(`/api/sessions/active?userName=${userName}`, 'GET');
    console.log(`   Get active session: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    
    // End session
    result = await this.makeRequest('/api/sessions/end', 'POST', { userName });
    console.log(`   End session: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    
    // Start multiple sessions (should end previous)
    result = await this.makeRequest('/api/sessions/start', 'POST', { userName });
    result = await this.makeRequest('/api/sessions/start', 'POST', { userName });
    console.log(`   Multiple sessions handling: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
  }

  async testTagsSystem() {
    console.log('\n🏷️  Testing Tags System APIs...');
    
    // Add tag
    let result = await this.makeRequest('/api/tags/add', 'POST', {
      leadId: this.testLeadId,
      tagType: 'answered-call',
      createdBy: 'test-user'
    });
    console.log(`   Add tag: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    
    // Add duplicate tag (should handle gracefully)
    result = await this.makeRequest('/api/tags/add', 'POST', {
      leadId: this.testLeadId,
      tagType: 'answered-call',
      createdBy: 'test-user'
    });
    console.log(`   Add duplicate tag: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    
    // Get tags
    result = await this.makeRequest(`/api/tags/lead/${this.testLeadId}`, 'GET');
    console.log(`   Get tags: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    
    // Invalid tag type
    result = await this.makeRequest('/api/tags/add', 'POST', {
      leadId: this.testLeadId,
      tagType: 'invalid-tag-type',
      createdBy: 'test-user'
    });
    console.log(`   Invalid tag type: ${result.success ? '❌' : '✅'} (${result.responseTime}ms)`);
  }

  async testPipelineManagement() {
    console.log('\n🔄 Testing Pipeline Management APIs...');
    
    // Move lead
    let result = await this.makeRequest('/api/pipeline/move-lead', 'POST', {
      leadId: this.testLeadId,
      newStage: 'live_call',
      userName: 'test-user-stress'
    });
    console.log(`   Move lead: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    
    // Add note
    result = await this.makeRequest('/api/pipeline/notes', 'POST', {
      leadId: this.testLeadId,
      note: 'Test stress note',
      userName: 'test-user-stress'
    });
    console.log(`   Add note: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    
    // Get lead details
    result = await this.makeRequest(`/api/pipeline/lead-details/${this.testLeadId}`, 'GET');
    console.log(`   Get lead details: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
  }

  async stressTestConcurrency() {
    console.log('\n🔥 Running Concurrency Stress Test...');
    console.log(`   Sending ${TEST_CONFIG.STRESS_TEST_ITERATIONS} concurrent requests...`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < TEST_CONFIG.STRESS_TEST_ITERATIONS; i++) {
      const sessionId = `stress-session-${i}`;
      const visitorId = `stress-visitor-${i}`;
      
      promises.push(
        this.makeRequest('/api/analytics/track', 'POST', {
          companyId: this.testCompanyId,
          sessionId,
          visitorId,
          templateKey: 'ModernTrust',
          timeOnPage: Math.floor(Math.random() * 300) + 10,
          deviceType: ['desktop', 'mobile', 'tablet'][i % 3],
          userAgent: 'Stress Test Browser',
          isInitial: true
        })
      );
    }
    
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    
    console.log(`   ✅ Completed in ${endTime - startTime}ms`);
    console.log(`   📊 Success: ${successful}/${results.length} (${((successful/results.length)*100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${failed}/${results.length}`);
  }

  async runEdgeCaseTests() {
    console.log('\n⚡ Testing Edge Cases...');
    
    // Test with malformed data
    let result = await this.makeRequest('/api/analytics/track', 'POST', 'invalid json');
    console.log(`   Malformed JSON: ${result.success ? '❌' : '✅'} (${result.responseTime}ms)`);
    
    // Test with very large payload
    const largePayload = {
      companyId: this.testCompanyId,
      sessionId: 'large-session',
      templateKey: 'ModernTrust',
      timeOnPage: 30,
      userAgent: 'x'.repeat(10000) // Very long user agent
    };
    result = await this.makeRequest('/api/analytics/track', 'POST', largePayload);
    console.log(`   Large payload: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
    
    // Test SQL injection attempts
    result = await this.makeRequest('/api/tags/add', 'POST', {
      leadId: "'; DROP TABLE lead_tags; --",
      tagType: 'answered-call'
    });
    console.log(`   SQL injection attempt: ${result.success ? '❌' : '✅'} (${result.responseTime}ms)`);
  }

  calculateStats() {
    const responseTimes = this.results.responseTimeMs;
    responseTimes.sort((a, b) => a - b);
    
    return {
      totalRequests: this.results.totalRequests,
      successRate: ((this.results.successCount / this.results.totalRequests) * 100).toFixed(2),
      avgResponseTime: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      errorCount: this.results.errorCount
    };
  }

  printResults() {
    console.log('\n📈 STRESS TEST RESULTS');
    console.log('====================');
    
    const stats = this.calculateStats();
    
    console.log(`📊 Summary:`);
    console.log(`   Total Requests: ${stats.totalRequests}`);
    console.log(`   Success Rate: ${stats.successRate}%`);
    console.log(`   Average Response Time: ${stats.avgResponseTime}ms`);
    console.log(`   Min Response Time: ${stats.minResponseTime}ms`);
    console.log(`   Max Response Time: ${stats.maxResponseTime}ms`);
    console.log(`   95th Percentile: ${stats.p95ResponseTime}ms`);
    console.log(`   Errors: ${stats.errorCount}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Error Details:`);
      this.results.errors.slice(0, 10).forEach((error, i) => {
        console.log(`   ${i+1}. ${error.endpoint}: ${error.error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }
    
    // Performance assessment
    console.log(`\n🎯 Performance Assessment:`);
    if (stats.successRate >= 99) {
      console.log(`   ✅ Excellent reliability (${stats.successRate}% success rate)`);
    } else if (stats.successRate >= 95) {
      console.log(`   ⚠️  Good reliability (${stats.successRate}% success rate)`);
    } else {
      console.log(`   ❌ Poor reliability (${stats.successRate}% success rate)`);
    }
    
    if (stats.avgResponseTime <= 100) {
      console.log(`   ✅ Excellent performance (${stats.avgResponseTime}ms avg)`);
    } else if (stats.avgResponseTime <= 500) {
      console.log(`   ⚠️  Good performance (${stats.avgResponseTime}ms avg)`);
    } else {
      console.log(`   ❌ Poor performance (${stats.avgResponseTime}ms avg)`);
    }
  }

  async run() {
    console.log('🚀 COMPREHENSIVE API STRESS TEST');
    console.log('================================\n');
    
    try {
      await this.setup();
      
      // Run all test suites
      await this.testAnalyticsTracking();
      await this.testActivityTracking();
      await this.testSessionManagement();
      await this.testTagsSystem();
      await this.testPipelineManagement();
      await this.runEdgeCaseTests();
      await this.stressTestConcurrency();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Stress test failed:', error);
    } finally {
      await this.cleanup();
      await pool.end();
    }
  }
}

// Run the stress test
const tester = new APIStressTester();
tester.run().catch(console.error);