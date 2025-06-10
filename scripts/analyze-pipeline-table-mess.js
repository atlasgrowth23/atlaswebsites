const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzePipelineTableMess() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 LEAD_PIPELINE TABLE STRUCTURE ANALYSIS');
    console.log('='.repeat(60));
    
    // 1. Get full table structure
    console.log('\n📋 LEAD_PIPELINE COLUMNS:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'lead_pipeline'
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });
    
    // 2. Check which columns are actually being used
    console.log('\n📊 COLUMN USAGE ANALYSIS:');
    
    const columnStats = [];
    
    for (const col of structure.rows) {
      const columnName = col.column_name;
      
      // Skip system columns
      if (['id', 'created_at', 'updated_at'].includes(columnName)) {
        continue;
      }
      
      try {
        // Check how many rows have non-null values
        const nonNullCount = await client.query(`
          SELECT COUNT(*) as count 
          FROM lead_pipeline 
          WHERE ${columnName} IS NOT NULL 
            AND ${columnName} != ''
            ${col.data_type.includes('json') ? "AND jsonb_array_length(${columnName}) > 0" : ''}
        `);
        
        // Check total rows
        const totalCount = await client.query(`SELECT COUNT(*) as count FROM lead_pipeline`);
        
        const nonNull = parseInt(nonNullCount.rows[0].count);
        const total = parseInt(totalCount.rows[0].count);
        const percentage = total > 0 ? ((nonNull / total) * 100).toFixed(1) : 0;
        
        columnStats.push({
          column: columnName,
          nonNull,
          total,
          percentage,
          dataType: col.data_type
        });
        
      } catch (error) {
        console.log(`   ⚠️ Error checking ${columnName}: ${error.message}`);
      }
    }
    
    // Sort by usage percentage
    columnStats.sort((a, b) => b.percentage - a.percentage);
    
    console.log('\n📈 COLUMN USAGE STATS (sorted by usage):');
    columnStats.forEach(stat => {
      const icon = stat.percentage > 80 ? '🔥' : 
                   stat.percentage > 50 ? '✅' : 
                   stat.percentage > 10 ? '⚠️' : '❌';
      console.log(`   ${icon} ${stat.column}: ${stat.nonNull}/${stat.total} (${stat.percentage}%)`);
    });
    
    // 3. Identify problematic columns
    console.log('\n🚨 PROBLEMATIC COLUMNS:');
    
    const unusedColumns = columnStats.filter(s => s.percentage < 5);
    const partiallyUsedColumns = columnStats.filter(s => s.percentage >= 5 && s.percentage < 50);
    const wellUsedColumns = columnStats.filter(s => s.percentage >= 50);
    
    if (unusedColumns.length > 0) {
      console.log('\n❌ MOSTLY UNUSED COLUMNS (< 5% usage):');
      unusedColumns.forEach(col => {
        console.log(`   ${col.column}: ${col.percentage}% - CANDIDATE FOR DELETION`);
      });
    }
    
    if (partiallyUsedColumns.length > 0) {
      console.log('\n⚠️ PARTIALLY USED COLUMNS (5-50% usage):');
      partiallyUsedColumns.forEach(col => {
        console.log(`   ${col.column}: ${col.percentage}% - REVIEW NEEDED`);
      });
    }
    
    console.log('\n✅ WELL USED COLUMNS (>50% usage):');
    wellUsedColumns.forEach(col => {
      console.log(`   ${col.column}: ${col.percentage}% - KEEP`);
    });
    
    // 4. Check for duplicate/redundant data
    console.log('\n🔍 REDUNDANCY CHECK:');
    
    // Check if owner_name/owner_email duplicates business_owners
    const ownerRedundancy = await client.query(`
      SELECT 
        COUNT(*) as pipeline_with_owner,
        COUNT(bo.id) as business_owner_matches
      FROM lead_pipeline lp
      LEFT JOIN business_owners bo ON lp.company_id = bo.company_id 
        AND lp.owner_email = bo.email
      WHERE lp.owner_email IS NOT NULL
    `);
    
    const ownerStats = ownerRedundancy.rows[0];
    console.log(`   Pipeline entries with owner data: ${ownerStats.pipeline_with_owner}`);
    console.log(`   Matching business_owners entries: ${ownerStats.business_owner_matches}`);
    
    if (ownerStats.business_owner_matches > 0) {
      console.log(`   ⚠️ ${ownerStats.business_owner_matches} entries duplicate business_owners table`);
    }
    
    // 5. Sample problematic data
    if (unusedColumns.length > 0) {
      console.log('\n🔍 SAMPLE DATA FROM UNUSED COLUMNS:');
      for (const col of unusedColumns.slice(0, 3)) {
        const sample = await client.query(`
          SELECT ${col.column} 
          FROM lead_pipeline 
          WHERE ${col.column} IS NOT NULL 
          LIMIT 3
        `);
        
        if (sample.rows.length > 0) {
          console.log(`\n   ${col.column} samples:`);
          sample.rows.forEach((row, idx) => {
            console.log(`     ${idx + 1}. ${JSON.stringify(row[col.column])}`);
          });
        }
      }
    }
    
    // 6. Recommendations
    console.log('\n🎯 CLEANUP RECOMMENDATIONS:');
    console.log('\n✅ COLUMNS TO KEEP:');
    wellUsedColumns.forEach(col => {
      console.log(`   - ${col.column} (${col.percentage}% used)`);
    });
    
    if (partiallyUsedColumns.length > 0) {
      console.log('\n⚠️ COLUMNS TO REVIEW:');
      partiallyUsedColumns.forEach(col => {
        console.log(`   - ${col.column} (${col.percentage}% used) - might be feature-specific`);
      });
    }
    
    if (unusedColumns.length > 0) {
      console.log('\n❌ COLUMNS TO DELETE:');
      unusedColumns.forEach(col => {
        console.log(`   - ${col.column} (${col.percentage}% used) - waste of space`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzePipelineTableMess();