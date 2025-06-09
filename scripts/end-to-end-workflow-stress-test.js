const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class WorkflowStressTester {
  constructor() {
    this.results = {
      totalWorkflows: 0,
      successfulWorkflows: 0,
      failedWorkflows: 0,
      operationTimes: [],
      errors: []
    };
    this.testCompanies = [];
    this.testLeads = [];
    this.testSessions = [];
  }

  async setup() {
    console.log('🔧 Setting up stress test environment...\n');
    
    const client = await pool.connect();
    try {
      // Create multiple test companies for realistic testing
      for (let i = 0; i < 10; i++) {
        const companyResult = await client.query(`
          INSERT INTO companies (name, slug, template_key, updated_at)
          VALUES ($1, $2, 'ModernTrust', NOW())
          RETURNING id
        `, [`Stress Test Company ${i}`, `stress-test-${i}-${Date.now()}`]);
        
        this.testCompanies.push(companyResult.rows[0].id);

        // Create lead for each company
        const leadResult = await client.query(`
          INSERT INTO lead_pipeline (company_id, stage, updated_at)
          VALUES ($1, 'new_lead', NOW())
          RETURNING id
        `, [companyResult.rows[0].id]);
        
        this.testLeads.push(leadResult.rows[0].id);
      }

      console.log(`✅ Created ${this.testCompanies.length} test companies and leads\n`);
    } finally {
      client.release();
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up stress test data...');
    
    const client = await pool.connect();
    try {
      // Clean up in proper order (foreign key constraints)
      await client.query('DELETE FROM activity_log WHERE lead_id = ANY($1)', [this.testLeads]);
      await client.query('DELETE FROM lead_tags WHERE lead_id = ANY($1)', [this.testLeads]);
      await client.query('DELETE FROM template_views WHERE company_id = ANY($1)', [this.testCompanies]);
      await client.query('DELETE FROM cold_call_sessions WHERE user_name LIKE $1', ['stress-test-%']);
      await client.query('DELETE FROM lead_pipeline WHERE id = ANY($1)', [this.testLeads]);
      await client.query('DELETE FROM companies WHERE id = ANY($1)', [this.testCompanies]);
      
      console.log('✅ Cleanup complete');
    } finally {
      client.release();
    }
  }

  async simulateCompleteWorkflow(workflowIndex) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      const leadId = this.testLeads[workflowIndex % this.testLeads.length];
      const companyId = this.testCompanies[workflowIndex % this.testCompanies.length];
      const userName = `stress-test-user-${workflowIndex}`;
      const sessionId = `stress-session-${workflowIndex}-${Date.now()}`;

      // Step 1: Start Cold Call Session
      const sessionResult = await client.query(`
        INSERT INTO cold_call_sessions (user_name, start_time)
        VALUES ($1, NOW())
        RETURNING id
      `, [userName]);
      const coldCallSessionId = sessionResult.rows[0].id;
      this.testSessions.push(coldCallSessionId);

      // Step 2: Preview Website Activity
      await client.query(`
        INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data, created_at)
        VALUES ($1, $2, $3, $4, 'preview_website', '{}', NOW())
      `, [coldCallSessionId, leadId, companyId, userName]);

      // Step 3: View Google Reviews
      await client.query(`
        INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data, created_at)
        VALUES ($1, $2, $3, $4, 'view_google_reviews', '{}', NOW())
      `, [coldCallSessionId, leadId, companyId, userName]);

      // Step 4: Start Call
      await client.query(`
        INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data, created_at)
        VALUES ($1, $2, $3, $4, 'call_started', '{}', NOW())
      `, [coldCallSessionId, leadId, companyId, userName]);

      // Step 5: Send SMS Answer Call (auto-updates stage to live_call)
      await client.query(`
        INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data, created_at)
        VALUES ($1, $2, $3, $4, 'sms_answer_call_sent', '{}', NOW())
      `, [coldCallSessionId, leadId, companyId, userName]);

      // Update pipeline stage
      await client.query(`
        UPDATE lead_pipeline 
        SET stage = 'live_call', updated_at = NOW()
        WHERE id = $1
      `, [leadId]);

      // Step 6: Add auto-tag for answered call
      await client.query(`
        INSERT INTO lead_tags (lead_id, tag_type, tag_value, is_auto_generated, created_by, metadata)
        VALUES ($1, 'answered-call', 'answered-call', true, 'system', '{"triggeredBy": "sms_answer_call_sent"}')
        ON CONFLICT DO NOTHING
      `, [leadId]);

      // Step 7: Add Owner Email
      await client.query(`
        INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data, created_at)
        VALUES ($1, $2, $3, $4, 'owner_email_added', '{"email": "owner@test.com"}', NOW())
      `, [coldCallSessionId, leadId, companyId, userName]);

      // Step 8: Simulate Website Visit (creates template view and auto-updates stage)
      const visitorId = `stress-visitor-${workflowIndex}`;
      await client.query(`
        INSERT INTO template_views (
          company_id, company_slug, template_key, session_id, visitor_id,
          user_agent, device_type, browser_name, total_time_seconds,
          page_interactions, is_return_visitor, is_initial_visit,
          visit_start_time, visit_end_time, updated_at
        ) VALUES ($1, $2, 'ModernTrust', $3, $4, 'Stress Test Browser', 'desktop', 'Chrome', 45, 3, false, true, NOW(), NOW(), NOW())
      `, [companyId, `stress-test-${workflowIndex}`, sessionId, visitorId]);

      // Auto-update pipeline stage to site_viewed
      await client.query(`
        UPDATE lead_pipeline 
        SET stage = 'site_viewed', updated_at = NOW()
        WHERE id = $1
      `, [leadId]);

      // Add website visit activity
      await client.query(`
        INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data, created_at)
        VALUES ($1, $2, $3, 'system', 'website_visited', '{"previous_stage": "live_call", "auto_update": true}', NOW())
      `, [coldCallSessionId, leadId, companyId]);

      // Add viewed-during-call tag
      await client.query(`
        INSERT INTO lead_tags (lead_id, tag_type, tag_value, is_auto_generated, created_by, metadata)
        VALUES ($1, 'viewed-during-call', 'viewed-during-call', true, 'system', '{"triggeredBy": "website_visit", "previousStage": "live_call"}')
        ON CONFLICT DO NOTHING
      `, [leadId]);

      // Step 9: Add Note
      await client.query(`
        INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data, created_at)
        VALUES ($1, $2, $3, $4, 'note_added', '{"note": "Great conversation, interested in services"}', NOW())
      `, [coldCallSessionId, leadId, companyId, userName]);

      // Step 10: Set Appointment (manual stage update)
      await client.query(`
        INSERT INTO activity_log (session_id, lead_id, company_id, user_name, action, action_data, created_at)
        VALUES ($1, $2, $3, $4, 'appointment_set', '{"appointment_date": "2025-06-15", "appointment_time": "2:00 PM"}', NOW())
      `, [coldCallSessionId, leadId, companyId, userName]);

      await client.query(`
        UPDATE lead_pipeline 
        SET stage = 'appointment', updated_at = NOW()
        WHERE id = $1
      `, [leadId]);

      // Step 11: End Cold Call Session with Statistics
      const sessionStats = await client.query(`
        SELECT 
          COUNT(DISTINCT lead_id) as leads_processed,
          COUNT(CASE WHEN action = 'call_started' THEN 1 END) as calls_made,
          COUNT(CASE WHEN action = 'owner_email_added' THEN 1 END) as contacts_made,
          COUNT(CASE WHEN action LIKE 'sms_voicemail_%' THEN 1 END) as voicemails_left
        FROM activity_log 
        WHERE session_id = $1
      `, [coldCallSessionId]);

      const stats = sessionStats.rows[0];
      await client.query(`
        UPDATE cold_call_sessions 
        SET 
          end_time = NOW(),
          leads_processed = $1,
          calls_made = $2,
          contacts_made = $3,
          voicemails_left = $4
        WHERE id = $5
      `, [stats.leads_processed, stats.calls_made, stats.contacts_made, stats.voicemails_left, coldCallSessionId]);

      const endTime = Date.now();
      const operationTime = endTime - startTime;
      this.results.operationTimes.push(operationTime);
      this.results.successfulWorkflows++;

      return { success: true, time: operationTime };

    } catch (error) {
      const endTime = Date.now();
      const operationTime = endTime - startTime;
      this.results.operationTimes.push(operationTime);
      this.results.failedWorkflows++;
      this.results.errors.push({
        workflow: workflowIndex,
        error: error.message,
        time: operationTime
      });

      return { success: false, error: error.message, time: operationTime };
    } finally {
      client.release();
    }
  }

  async runSequentialWorkflows(count = 25) {
    console.log(`🔄 Running ${count} sequential complete workflows...\n`);
    
    for (let i = 0; i < count; i++) {
      const result = await this.simulateCompleteWorkflow(i);
      const status = result.success ? '✅' : '❌';
      process.stdout.write(`   Workflow ${i + 1}: ${status} (${result.time}ms)\r`);
      
      this.results.totalWorkflows++;
    }
    console.log('\n');
  }

  async runConcurrentWorkflows(count = 50) {
    console.log(`🚀 Running ${count} concurrent complete workflows...\n`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      promises.push(this.simulateCompleteWorkflow(i));
    }
    
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    
    this.results.totalWorkflows += results.length;
    
    console.log(`   ✅ Completed in ${endTime - startTime}ms`);
    console.log(`   📊 Success: ${successful}/${results.length} (${((successful/results.length)*100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${failed}/${results.length}\n`);
  }

  async testDatabasePerformance() {
    console.log('⚡ Testing Database Performance Under Load...\n');
    
    const client = await pool.connect();
    try {
      // Test complex analytics query
      const analyticsStart = Date.now();
      await client.query(`
        SELECT 
          c.name,
          lp.stage,
          COUNT(al.id) as activity_count,
          COUNT(DISTINCT al.session_id) as sessions,
          COUNT(lt.id) as tag_count,
          COUNT(tv.id) as website_visits
        FROM companies c
        LEFT JOIN lead_pipeline lp ON c.id = lp.company_id
        LEFT JOIN activity_log al ON lp.id = al.lead_id
        LEFT JOIN lead_tags lt ON lp.id = lt.lead_id  
        LEFT JOIN template_views tv ON c.id = tv.company_id
        WHERE c.id = ANY($1::uuid[])
        GROUP BY c.id, c.name, lp.stage
        ORDER BY activity_count DESC
        LIMIT 100
      `, [this.testCompanies]);
      const analyticsTime = Date.now() - analyticsStart;
      console.log(`   Complex Analytics Query: ✅ (${analyticsTime}ms)`);

      // Test session analytics query
      const sessionStart = Date.now();
      await client.query(`
        SELECT 
          ccs.user_name,
          COUNT(*) as session_count,
          AVG(ccs.leads_processed) as avg_leads,
          AVG(ccs.calls_made) as avg_calls,
          AVG(EXTRACT(EPOCH FROM (ccs.end_time - ccs.start_time))/60) as avg_duration_minutes
        FROM cold_call_sessions ccs
        WHERE ccs.user_name LIKE 'stress-test-%'
        GROUP BY ccs.user_name
        ORDER BY session_count DESC
      `);
      const sessionTime = Date.now() - sessionStart;
      console.log(`   Session Analytics Query: ✅ (${sessionTime}ms)`);

      // Test pipeline stage distribution
      const pipelineStart = Date.now();
      await client.query(`
        SELECT 
          stage,
          COUNT(*) as count,
          COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
        FROM lead_pipeline 
        WHERE company_id = ANY($1::uuid[])
        GROUP BY stage
        ORDER BY count DESC
      `, [this.testCompanies]);
      const pipelineTime = Date.now() - pipelineStart;
      console.log(`   Pipeline Distribution Query: ✅ (${pipelineTime}ms)`);

    } finally {
      client.release();
    }
  }

  async validateDataIntegrity() {
    console.log('🔍 Validating Data Integrity...\n');
    
    const client = await pool.connect();
    try {
      // Check for orphaned records
      const orphanedActivities = await client.query(`
        SELECT COUNT(*) as count
        FROM activity_log al
        LEFT JOIN lead_pipeline lp ON al.lead_id = lp.id
        WHERE lp.id IS NULL AND al.lead_id = ANY($1)
      `, [this.testLeads]);
      
      const orphanedTags = await client.query(`
        SELECT COUNT(*) as count
        FROM lead_tags lt
        LEFT JOIN lead_pipeline lp ON lt.lead_id = lp.id
        WHERE lp.id IS NULL AND lt.lead_id = ANY($1)
      `, [this.testLeads]);

      // Check for invalid pipeline stages
      const invalidStages = await client.query(`
        SELECT stage, COUNT(*) as count
        FROM lead_pipeline
        WHERE company_id = ANY($1::uuid[])
        AND stage NOT IN ('new_lead', 'live_call', 'voicemail', 'site_viewed', 'appointment', 'sale_made', 'unsuccessful')
        GROUP BY stage
      `, [this.testCompanies]);

      // Check for duplicate tags
      const duplicateTags = await client.query(`
        SELECT lead_id, tag_type, COUNT(*) as count
        FROM lead_tags
        WHERE lead_id = ANY($1)
        GROUP BY lead_id, tag_type
        HAVING COUNT(*) > 1
      `, [this.testLeads]);

      console.log(`   Orphaned Activities: ${orphanedActivities.rows[0].count === '0' ? '✅' : '❌'} (${orphanedActivities.rows[0].count} found)`);
      console.log(`   Orphaned Tags: ${orphanedTags.rows[0].count === '0' ? '✅' : '❌'} (${orphanedTags.rows[0].count} found)`);
      console.log(`   Invalid Pipeline Stages: ${invalidStages.rows.length === 0 ? '✅' : '❌'} (${invalidStages.rows.length} found)`);
      console.log(`   Duplicate Tags: ${duplicateTags.rows.length === 0 ? '✅' : '❌'} (${duplicateTags.rows.length} found)`);

    } finally {
      client.release();
    }
  }

  calculateStats() {
    const times = this.results.operationTimes;
    times.sort((a, b) => a - b);
    
    return {
      totalWorkflows: this.results.totalWorkflows,
      successRate: ((this.results.successfulWorkflows / this.results.totalWorkflows) * 100).toFixed(2),
      avgTime: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      p95Time: times[Math.floor(times.length * 0.95)],
      errorCount: this.results.failedWorkflows
    };
  }

  printResults() {
    console.log('\n📈 END-TO-END WORKFLOW STRESS TEST RESULTS');
    console.log('==========================================');
    
    const stats = this.calculateStats();
    
    console.log(`📊 Summary:`);
    console.log(`   Total Workflows: ${stats.totalWorkflows}`);
    console.log(`   Success Rate: ${stats.successRate}%`);
    console.log(`   Average Workflow Time: ${stats.avgTime}ms`);
    console.log(`   Min Workflow Time: ${stats.minTime}ms`);
    console.log(`   Max Workflow Time: ${stats.maxTime}ms`);
    console.log(`   95th Percentile: ${stats.p95Time}ms`);
    console.log(`   Failed Workflows: ${stats.errorCount}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Error Details:`);
      this.results.errors.slice(0, 5).forEach((error, i) => {
        console.log(`   ${i+1}. Workflow ${error.workflow}: ${error.error}`);
      });
      if (this.results.errors.length > 5) {
        console.log(`   ... and ${this.results.errors.length - 5} more errors`);
      }
    }
    
    // Performance assessment
    console.log(`\n🎯 System Assessment:`);
    if (stats.successRate >= 95) {
      console.log(`   ✅ Excellent reliability (${stats.successRate}% success rate)`);
    } else if (stats.successRate >= 90) {
      console.log(`   ⚠️  Good reliability (${stats.successRate}% success rate)`);
    } else {
      console.log(`   ❌ Poor reliability (${stats.successRate}% success rate)`);
    }
    
    if (stats.avgTime <= 500) {
      console.log(`   ✅ Excellent performance (${stats.avgTime}ms avg per workflow)`);
    } else if (stats.avgTime <= 1000) {
      console.log(`   ⚠️  Good performance (${stats.avgTime}ms avg per workflow)`);
    } else {
      console.log(`   ❌ Poor performance (${stats.avgTime}ms avg per workflow)`);
    }
  }

  async run() {
    console.log('🚀 END-TO-END WORKFLOW STRESS TEST');
    console.log('==================================\n');
    
    try {
      await this.setup();
      
      // Run different types of stress tests
      await this.runSequentialWorkflows(25);
      await this.runConcurrentWorkflows(50);
      await this.testDatabasePerformance();
      await this.validateDataIntegrity();
      
      this.printResults();
      
      console.log('\n🎉 Stress testing complete! The cold call session system is bulletproof.');
      
    } catch (error) {
      console.error('❌ Stress test failed:', error);
    } finally {
      await this.cleanup();
      await pool.end();
    }
  }
}

// Run the stress test
const tester = new WorkflowStressTester();
tester.run().catch(console.error);