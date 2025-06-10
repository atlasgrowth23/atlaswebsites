const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 FULL DATABASE ANALYSIS FOR CHATGPT');
    console.log('=====================================\n');

    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`📋 TOTAL TABLES: ${tablesResult.rows.length}\n`);
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`\n🗂️  TABLE: ${tableName.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      // Get table schema
      const schemaResult = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `, [tableName]);
      
      console.log('SCHEMA:');
      schemaResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`);
      });
      
      // Get row count
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
        const rowCount = countResult.rows[0].count;
        console.log(`\nROW COUNT: ${rowCount}`);
        
        // Get sample data if rows exist
        if (rowCount > 0) {
          const sampleResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 3`);
          console.log('\nSAMPLE DATA:');
          sampleResult.rows.forEach((row, index) => {
            console.log(`  Row ${index + 1}:`, JSON.stringify(row, null, 2));
          });
        } else {
          console.log('\nSAMPLE DATA: (empty table)');
        }
        
      } catch (error) {
        console.log(`\nERROR accessing table: ${error.message}`);
      }
      
      // Get foreign key relationships
      try {
        const fkResult = await client.query(`
          SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = $1;
        `, [tableName]);
        
        if (fkResult.rows.length > 0) {
          console.log('\nFOREIGN KEYS:');
          fkResult.rows.forEach(fk => {
            console.log(`  ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
          });
        }
      } catch (error) {
        console.log(`\nFK error: ${error.message}`);
      }
      
      console.log('\n');
    }
    
    // Get indexes
    console.log('\n📊 INDEXES');
    console.log('─'.repeat(50));
    const indexResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    
    indexResult.rows.forEach(idx => {
      console.log(`${idx.tablename}.${idx.indexname}:`);
      console.log(`  ${idx.indexdef}\n`);
    });
    
    // Get views
    console.log('\n👁️  VIEWS');
    console.log('─'.repeat(50));
    const viewResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public';
    `);
    
    if (viewResult.rows.length > 0) {
      viewResult.rows.forEach(view => {
        console.log(`- ${view.table_name}`);
      });
    } else {
      console.log('No views found');
    }
    
    // Get functions/triggers
    console.log('\n⚡ FUNCTIONS & TRIGGERS');
    console.log('─'.repeat(50));
    const funcResult = await client.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'public';
    `);
    
    if (funcResult.rows.length > 0) {
      funcResult.rows.forEach(func => {
        console.log(`- ${func.routine_name} (${func.routine_type})`);
      });
    } else {
      console.log('No custom functions found');
    }
    
    console.log('\n✅ ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeDatabase().catch(console.error);