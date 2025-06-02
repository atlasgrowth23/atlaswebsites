// Check database structure for image storage
const { Client } = require('pg');

async function checkDbStructure() {
  const client = new Client({
    connectionString: 'postgresql://postgres.zjxvacezqbhyomrngynq:eMeQW9s85usvbaok@aws-0-us-east-2.pooler.supabase.com:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔍 Checking database structure for image storage...\n');

    // Check companies table columns
    const companiesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Companies table columns related to images:');
    companiesColumns.rows
      .filter(col => col.column_name.includes('img') || col.column_name.includes('logo') || col.column_name.includes('frame'))
      .forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });

    // Check for company_frames table
    const companyFramesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'company_frames'
      );
    `);

    if (companyFramesExists.rows[0].exists) {
      console.log('\n📋 company_frames table exists:');
      const frameColumns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'company_frames'
        ORDER BY ordinal_position;
      `);
      frameColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Sample data
      const sampleFrames = await client.query('SELECT * FROM company_frames LIMIT 5');
      console.log('\n📝 Sample company_frames data:');
      sampleFrames.rows.forEach(row => console.log('  ', row));
    } else {
      console.log('\n❌ company_frames table does not exist');
    }

    // Check for frames table
    const framesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'frames'
      );
    `);

    if (framesExists.rows[0].exists) {
      console.log('\n📋 frames table exists:');
      const frameColumns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'frames'
        ORDER BY ordinal_position;
      `);
      frameColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Sample data
      const sampleFrames = await client.query('SELECT * FROM frames LIMIT 5');
      console.log('\n📝 Sample frames data:');
      sampleFrames.rows.forEach(row => console.log('  ', row));
    } else {
      console.log('\n❌ frames table does not exist');
    }

    // Check how template customizations are handled
    const customizationAPIs = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE tablename LIKE '%custom%' OR tablename LIKE '%template%'
    `);

    console.log('\n📋 Tables related to customization:');
    customizationAPIs.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkDbStructure();