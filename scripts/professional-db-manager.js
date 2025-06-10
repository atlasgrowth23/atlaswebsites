const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Professional Database Management CLI
class ProfessionalDBManager {
  
  async getCurrentStatus() {
    const client = await pool.connect();
    try {
      console.log('📊 PROFESSIONAL DATABASE STATUS REPORT');
      console.log('='.repeat(60));
      
      // Environment Status
      const envResult = await client.query('SELECT * FROM environment_metadata ORDER BY environment_name');
      console.log('\n🌍 ENVIRONMENTS:');
      envResult.rows.forEach(env => {
        const status = env.is_active ? '🟢 ACTIVE' : '🔴 INACTIVE';
        console.log(`   ${status} ${env.environment_name}: ${env.description}`);
      });
      
      // Migration Status
      const migrationResult = await client.query(`
        SELECT environment, COUNT(*) as total_migrations, 
               MAX(applied_at) as last_migration 
        FROM database_migrations 
        GROUP BY environment 
        ORDER BY environment
      `);
      console.log('\n📋 MIGRATION STATUS:');
      migrationResult.rows.forEach(row => {
        console.log(`   ${row.environment}: ${row.total_migrations} migrations (last: ${new Date(row.last_migration).toLocaleString()})`);
      });
      
      // Feature Flags
      const flagResult = await client.query('SELECT flag_name, is_enabled, rollout_percentage FROM feature_flags ORDER BY flag_name');
      console.log('\n🚩 FEATURE FLAGS:');
      flagResult.rows.forEach(flag => {
        const status = flag.is_enabled ? `🟢 ON (${flag.rollout_percentage}%)` : '🔴 OFF';
        console.log(`   ${status} ${flag.flag_name}`);
      });
      
      // Health Checks
      const healthResult = await client.query(`
        SELECT check_name, check_status, last_checked_at, response_time_ms 
        FROM system_health_checks 
        WHERE environment = 'production' 
        ORDER BY last_checked_at DESC
      `);
      console.log('\n🏥 HEALTH STATUS:');
      healthResult.rows.forEach(check => {
        const statusIcon = check.check_status === 'healthy' ? '✅' : 
                          check.check_status === 'warning' ? '⚠️' : '❌';
        console.log(`   ${statusIcon} ${check.check_name}: ${check.response_time_ms}ms`);
      });
      
    } finally {
      client.release();
    }
  }
  
  async createChangeRequest(title, description, changeType, sql, rollbackSql) {
    const client = await pool.connect();
    try {
      console.log('📝 CREATING CHANGE REQUEST...');
      
      const result = await client.query(`
        INSERT INTO change_requests (
          request_title, description, requested_by, target_environment, 
          change_type, sql_to_execute, rollback_sql, risk_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [title, description, 'automated', 'production', changeType, sql, rollbackSql, 'medium']);
      
      console.log(`✅ Change request created with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
      
    } finally {
      client.release();
    }
  }
  
  async executeApprovedChange(requestId) {
    const client = await pool.connect();
    try {
      // Get the change request
      const requestResult = await client.query(
        'SELECT * FROM change_requests WHERE id = $1 AND status = $2',
        [requestId, 'pending']
      );
      
      if (requestResult.rows.length === 0) {
        throw new Error('Change request not found or not in pending status');
      }
      
      const request = requestResult.rows[0];
      console.log(`🚀 EXECUTING CHANGE: ${request.request_title}`);
      
      const startTime = Date.now();
      
      try {
        // Execute the SQL
        await client.query('BEGIN');
        await client.query(request.sql_to_execute);
        await client.query('COMMIT');
        
        const executionTime = Date.now() - startTime;
        
        // Update the request status
        await client.query(`
          UPDATE change_requests 
          SET status = 'executed', executed_at = NOW(), execution_result = 'Success'
          WHERE id = $1
        `, [requestId]);
        
        // Log the migration
        await client.query(`
          INSERT INTO database_migrations (
            migration_name, migration_version, environment, applied_by, 
            sql_executed, execution_time_ms
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          request.request_title,
          'v1.0.0',
          request.target_environment,
          'professional_manager',
          request.sql_to_execute,
          executionTime
        ]);
        
        console.log(`✅ Change executed successfully in ${executionTime}ms`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        
        // Update the request with error
        await client.query(`
          UPDATE change_requests 
          SET status = 'failed', execution_result = $1
          WHERE id = $2
        `, [error.message, requestId]);
        
        throw error;
      }
      
    } finally {
      client.release();
    }
  }
  
  async updateFeatureFlag(flagName, enabled, rolloutPercentage = null) {
    const client = await pool.connect();
    try {
      console.log(`🚩 UPDATING FEATURE FLAG: ${flagName}`);
      
      let query = 'UPDATE feature_flags SET is_enabled = $1, updated_at = NOW() WHERE flag_name = $2';
      let params = [enabled, flagName];
      
      if (rolloutPercentage !== null) {
        query = 'UPDATE feature_flags SET is_enabled = $1, rollout_percentage = $2, updated_at = NOW() WHERE flag_name = $3';
        params = [enabled, rolloutPercentage, flagName];
      }
      
      await client.query(query, params);
      console.log(`✅ Feature flag updated: ${flagName} = ${enabled ? 'ON' : 'OFF'}${rolloutPercentage ? ` (${rolloutPercentage}%)` : ''}`);
      
    } finally {
      client.release();
    }
  }
  
  async runHealthCheck() {
    const client = await pool.connect();
    try {
      console.log('🏥 RUNNING HEALTH CHECKS...');
      
      const checks = [
        {
          name: 'database_connection',
          test: async () => {
            const start = Date.now();
            await client.query('SELECT 1');
            return Date.now() - start;
          }
        },
        {
          name: 'notes_json_structure',
          test: async () => {
            const start = Date.now();
            await client.query('SELECT COUNT(*) FROM lead_pipeline WHERE notes_json IS NOT NULL');
            return Date.now() - start;
          }
        },
        {
          name: 'tags_system',
          test: async () => {
            const start = Date.now();
            await client.query('SELECT COUNT(*) FROM lead_pipeline WHERE tags IS NOT NULL');
            return Date.now() - start;
          }
        },
        {
          name: 'business_owners_table',
          test: async () => {
            const start = Date.now();
            await client.query('SELECT COUNT(*) FROM business_owners');
            return Date.now() - start;
          }
        }
      ];
      
      for (const check of checks) {
        try {
          const responseTime = await check.test();
          await client.query(`
            INSERT INTO system_health_checks (check_name, environment, check_status, response_time_ms)
            VALUES ($1, $2, $3, $4)
          `, [check.name, 'production', 'healthy', responseTime]);
          
          console.log(`   ✅ ${check.name}: ${responseTime}ms`);
        } catch (error) {
          await client.query(`
            INSERT INTO system_health_checks (check_name, environment, check_status, error_message)
            VALUES ($1, $2, $3, $4)
          `, [check.name, 'production', 'critical', error.message]);
          
          console.log(`   ❌ ${check.name}: ${error.message}`);
        }
      }
      
    } finally {
      client.release();
    }
  }
  
  async getPendingChangeRequests() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id, request_title, change_type, risk_level, created_at 
        FROM change_requests 
        WHERE status = 'pending' 
        ORDER BY created_at DESC
      `);
      
      console.log('\n📋 PENDING CHANGE REQUESTS:');
      if (result.rows.length === 0) {
        console.log('   No pending change requests');
      } else {
        result.rows.forEach(req => {
          console.log(`   #${req.id}: ${req.request_title} (${req.change_type}, ${req.risk_level} risk)`);
        });
      }
      
      return result.rows;
    } finally {
      client.release();
    }
  }
}

// CLI Interface
async function main() {
  const manager = new ProfessionalDBManager();
  
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'status':
        await manager.getCurrentStatus();
        break;
        
      case 'health':
        await manager.runHealthCheck();
        break;
        
      case 'pending':
        await manager.getPendingChangeRequests();
        break;
        
      case 'flag':
        const flagName = process.argv[3];
        const enabled = process.argv[4] === 'true';
        const percentage = process.argv[5] ? parseInt(process.argv[5]) : null;
        await manager.updateFeatureFlag(flagName, enabled, percentage);
        break;
        
      default:
        console.log('🔧 PROFESSIONAL DATABASE MANAGER');
        console.log('================================');
        console.log('Usage:');
        console.log('  node professional-db-manager.js status    - Show system status');
        console.log('  node professional-db-manager.js health    - Run health checks');
        console.log('  node professional-db-manager.js pending   - Show pending changes');
        console.log('  node professional-db-manager.js flag <name> <true/false> [percentage]');
        console.log('');
        console.log('Examples:');
        console.log('  node professional-db-manager.js flag legacy_table_cleanup true 10');
        console.log('  node professional-db-manager.js flag modernized_notes_api false');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = ProfessionalDBManager;