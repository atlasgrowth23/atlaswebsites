const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzeUserConfusion() {
  const client = await pool.connect();
  
  try {
    console.log('👥 USER STRUCTURE CONFUSION ANALYSIS');
    console.log('='.repeat(60));
    
    // 1. Check business_owners table
    console.log('\n📋 BUSINESS_OWNERS TABLE:');
    const businessOwnersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'business_owners'
      ORDER BY ordinal_position
    `);
    
    businessOwnersStructure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });
    
    const businessOwnersSample = await client.query(`SELECT * FROM business_owners LIMIT 3`);
    console.log('\n📊 BUSINESS_OWNERS SAMPLE DATA:');
    businessOwnersSample.rows.forEach((row, index) => {
      console.log(`\n--- Business Owner ${index + 1} ---`);
      Object.keys(row).forEach(key => {
        console.log(`   ${key}: ${row[key]}`);
      });
    });
    
    // 2. Check client_users table
    console.log('\n\n📋 CLIENT_USERS TABLE:');
    const clientUsersExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'client_users'
      )
    `);
    
    if (clientUsersExists.rows[0].exists) {
      const clientUsersStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'client_users'
        ORDER BY ordinal_position
      `);
      
      clientUsersStructure.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
      });
      
      const clientUsersSample = await client.query(`SELECT * FROM client_users LIMIT 3`);
      console.log('\n📊 CLIENT_USERS SAMPLE DATA:');
      clientUsersSample.rows.forEach((row, index) => {
        console.log(`\n--- Client User ${index + 1} ---`);
        Object.keys(row).forEach(key => {
          console.log(`   ${key}: ${row[key]}`);
        });
      });
    } else {
      console.log('   ❌ CLIENT_USERS table does not exist');
    }
    
    // 3. Check for scattered owner/email fields
    console.log('\n\n🔍 SCATTERED OWNER/EMAIL FIELDS ANALYSIS:');
    
    // Check companies table for owner fields
    const companiesFields = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'companies' 
        AND (column_name ILIKE '%owner%' OR column_name ILIKE '%email%')
      ORDER BY column_name
    `);
    
    console.log('\n📊 COMPANIES table owner/email fields:');
    companiesFields.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    // Check lead_pipeline table for owner fields  
    const pipelineFields = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'lead_pipeline' 
        AND (column_name ILIKE '%owner%' OR column_name ILIKE '%email%')
      ORDER BY column_name
    `);
    
    console.log('\n📊 LEAD_PIPELINE table owner/email fields:');
    pipelineFields.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    // 4. Check for admin users (Nick/Nicholas/Jared)
    console.log('\n\n👑 ADMIN USERS ANALYSIS:');
    
    // Look for any user tables that might contain Nick/Nicholas/Jared
    const userTables = ['users', 'admins', 'admin_users'];
    
    for (const table of userTables) {
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = '${table}'
        )
      `);
      
      if (tableExists.rows[0].exists) {
        console.log(`\n📋 ${table.toUpperCase()} TABLE FOUND:`);
        const tableData = await client.query(`SELECT * FROM ${table} LIMIT 5`);
        tableData.rows.forEach((row, index) => {
          console.log(`\n--- ${table} ${index + 1} ---`);
          Object.keys(row).forEach(key => {
            console.log(`   ${key}: ${row[key]}`);
          });
        });
      }
    }
    
    console.log('\n\n🎯 CONFUSION POINTS IDENTIFIED:');
    console.log('   1. business_owners vs client_users - what\'s the difference?');
    console.log('   2. Multiple owner/email fields scattered across tables');
    console.log('   3. Need clear admin hierarchy (Nick > Nicholas/Jared)');
    console.log('   4. Permission structure unclear');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeUserConfusion();