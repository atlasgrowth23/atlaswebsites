const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkCurrentTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking current database structure...\n');
    
    // Check if company_frames table exists
    const framesResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'company_frames'
      );
    `);
    
    if (framesResult.rows[0].exists) {
      console.log('✅ company_frames table exists');
      
      // Get structure
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'company_frames'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 company_frames structure:');
      structure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      
      // Get sample data
      const sampleData = await client.query('SELECT * FROM company_frames LIMIT 3');
      console.log(`\n📊 Sample data (${sampleData.rows.length} rows):`);
      sampleData.rows.forEach((row, i) => {
        console.log(`  Row ${i + 1}:`, {
          company_id: row.company_id,
          slug: row.slug,
          url: row.url?.substring(0, 50) + '...'
        });
      });
    } else {
      console.log('❌ company_frames table does NOT exist');
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Check image storage patterns
    console.log('\n🖼️ Checking current image storage patterns...');
    
    const storagePatterns = await client.query(`
      SELECT 
        slug,
        url,
        CASE 
          WHEN url LIKE '%supabase.co/storage%' THEN 'supabase_storage'
          WHEN url LIKE '%googleusercontent.com%' THEN 'google_photos'
          WHEN url LIKE 'http%' THEN 'external_url'
          ELSE 'unknown'
        END as storage_type
      FROM company_frames 
      WHERE url IS NOT NULL
      LIMIT 10;
    `);
    
    console.log('📁 Current storage patterns:');
    const typeCount = {};
    storagePatterns.rows.forEach(row => {
      typeCount[row.storage_type] = (typeCount[row.storage_type] || 0) + 1;
      if (Object.keys(typeCount).length <= 3) {
        console.log(`  ${row.slug}: ${row.storage_type} - ${row.url.substring(0, 60)}...`);
      }
    });
    
    console.log('\n📈 Storage type breakdown:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} images`);
    });
    
    console.log('\n' + '='.repeat(50));
    
    // Check template keys being used
    console.log('\n🎨 Template usage patterns...');
    
    const templateUsage = await client.query(`
      SELECT 
        template_key,
        COUNT(*) as company_count
      FROM companies 
      WHERE template_key IS NOT NULL
      GROUP BY template_key
      ORDER BY company_count DESC;
    `);
    
    console.log('🏢 Templates in use:');
    templateUsage.rows.forEach(row => {
      console.log(`  ${row.template_key}: ${row.company_count} companies`);
    });
    
    // Check frame types being used
    const frameTypes = await client.query(`
      SELECT 
        slug as frame_type,
        COUNT(*) as usage_count
      FROM company_frames 
      GROUP BY slug
      ORDER BY usage_count DESC;
    `);
    
    console.log('\n🖼️ Frame types in use:');
    frameTypes.rows.forEach(row => {
      console.log(`  ${row.frame_type}: ${row.usage_count} companies`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkCurrentTables().catch(console.error);