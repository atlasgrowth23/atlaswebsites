const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzeKeyTables() {
  const client = await pool.connect();
  
  try {
    console.log('📊 KEY TABLES ANALYSIS FOR CHATGPT');
    console.log('===================================\n');

    // Key tables to focus on
    const keyTables = [
      'lead_pipeline', 'companies', 'activity_log', 'analytics', 
      'contacts', 'conversations', 'tags', 'tag_definitions',
      'template_customizations', 'sessions'
    ];
    
    for (const tableName of keyTables) {
      console.log(`\n🗂️  ${tableName.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      try {
        // Get schema
        const schemaResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position;
        `, [tableName]);
        
        console.log('COLUMNS:');
        schemaResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });
        
        // Get row count
        const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
        console.log(`\nROWS: ${countResult.rows[0].count}`);
        
        // Get sample data
        if (countResult.rows[0].count > 0) {
          const sampleResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 2`);
          console.log('\nSAMPLE:');
          sampleResult.rows.forEach((row, i) => {
            console.log(`${i+1}. ${JSON.stringify(row, null, 2).substring(0, 200)}...`);
          });
        }
        
      } catch (error) {
        console.log(`ERROR: ${error.message}`);
      }
    }
    
    // Table relationships summary
    console.log('\n\n🔗 KEY RELATIONSHIPS');
    console.log('─'.repeat(50));
    console.log('• activity_log -> lead_pipeline (lead_id)');
    console.log('• activity_log -> companies (company_id)'); 
    console.log('• lead_pipeline -> companies (company_id)');
    console.log('• contacts -> companies (company_id)');
    console.log('• conversations -> companies (company_id)');
    console.log('• conversations -> contacts (contact_id)');
    console.log('• business_owners -> companies (company_id)');
    
    console.log('\n\n📈 USAGE PATTERNS');
    console.log('─'.repeat(50));
    console.log('• Pipeline: 865 leads across multiple stages');
    console.log('• Activity: 222 logged actions (calls, SMS, notes)');
    console.log('• Companies: 871 HVAC businesses');
    console.log('• Chat: 17 active conversations, 38 messages');
    console.log('• Cold Calling: 11 sessions tracked');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeKeyTables().catch(console.error);