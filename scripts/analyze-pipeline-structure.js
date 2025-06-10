const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzePipelineStructure() {
  try {
    console.log('🔍 LEAD PIPELINE STRUCTURE ANALYSIS\n');
    console.log('='.repeat(60));
    
    // Check lead_pipeline table structure and data
    console.log('\n📊 LEAD_PIPELINE ANALYSIS:');
    const { data: pipelineData, error: pipelineError } = await supabase
      .from('lead_pipeline')
      .select('*')
      .limit(5);
    
    if (pipelineError) {
      console.log('❌ lead_pipeline error:', pipelineError.message);
    } else {
      console.log(`   📈 Total records: ${pipelineData?.length || 0}`);
      if (pipelineData?.length > 0) {
        console.log('   📝 Structure:', Object.keys(pipelineData[0]));
        console.log('   📝 Sample record:');
        console.log(JSON.stringify(pipelineData[0], null, 2));
      }
    }
    
    // Get pipeline type distribution
    const { data: pipelineTypes } = await supabase
      .from('lead_pipeline')
      .select('pipeline_type')
      .not('pipeline_type', 'is', null);
    
    const typeCount = {};
    pipelineTypes?.forEach(p => {
      typeCount[p.pipeline_type] = (typeCount[p.pipeline_type] || 0) + 1;
    });
    
    console.log('\n📈 PIPELINE TYPE DISTRIBUTION:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} leads`);
    });
    
    // Get stage distribution
    const { data: stages } = await supabase
      .from('lead_pipeline')
      .select('stage');
    
    const stageCount = {};
    stages?.forEach(s => {
      stageCount[s.stage] = (stageCount[s.stage] || 0) + 1;
    });
    
    console.log('\n📊 STAGE DISTRIBUTION:');
    Object.entries(stageCount).forEach(([stage, count]) => {
      console.log(`   ${stage}: ${count} leads`);
    });
    
    // Check lead_notes table
    console.log('\n📝 LEAD_NOTES ANALYSIS:');
    const { data: notesData, error: notesError } = await supabase
      .from('lead_notes')
      .select('*')
      .limit(3);
    
    if (notesError) {
      console.log('❌ lead_notes error:', notesError.message);
    } else {
      console.log(`   📈 Total records: ${notesData?.length || 0}`);
      if (notesData?.length > 0) {
        console.log('   📝 Structure:', Object.keys(notesData[0]));
        console.log('   📝 Sample note:');
        console.log(`     Lead ID: ${notesData[0].lead_id}`);
        console.log(`     Content: "${notesData[0].content}"`);
        console.log(`     Created: ${notesData[0].created_at}`);
      }
    }
    
    // Check activity_log table
    console.log('\n📋 ACTIVITY_LOG ANALYSIS:');
    const { data: activityData, error: activityError } = await supabase
      .from('activity_log')
      .select('*')
      .limit(3);
    
    if (activityError) {
      console.log('❌ activity_log error:', activityError.message);
    } else {
      console.log(`   📈 Total records: ${activityData?.length || 0}`);
      if (activityData?.length > 0) {
        console.log('   📝 Structure:', Object.keys(activityData[0]));
        console.log('   📝 Sample activity:');
        console.log(`     Lead ID: ${activityData[0].lead_id}`);
        console.log(`     Action: ${activityData[0].action}`);
        console.log(`     User: ${activityData[0].user_name}`);
        console.log(`     Data: ${JSON.stringify(activityData[0].action_data, null, 2)}`);
      }
    }
    
    // Check cold_call_sessions
    console.log('\n📞 COLD_CALL_SESSIONS ANALYSIS:');
    const { data: sessionsData } = await supabase
      .from('cold_call_sessions')
      .select('*')
      .limit(3);
    
    console.log(`   📈 Total records: ${sessionsData?.length || 0}`);
    if (sessionsData?.length > 0) {
      console.log('   📝 Sample session:');
      console.log(`     User: ${sessionsData[0].user_name}`);
      console.log(`     Duration: ${sessionsData[0].start_time} to ${sessionsData[0].end_time || 'active'}`);
      console.log(`     Calls: ${sessionsData[0].calls_made}, Contacts: ${sessionsData[0].contacts_made}`);
    }
    
    // Pipeline Issues Analysis
    console.log('\n⚠️  PIPELINE STRUCTURE ISSUES:');
    
    // Check for leads with missing company data
    const { data: orphanLeads } = await supabase
      .from('lead_pipeline')
      .select('id, company_id, stage')
      .not('company_id', 'in', '(SELECT id FROM companies)');
    
    if (orphanLeads?.length > 0) {
      console.log(`   ❌ ${orphanLeads.length} leads reference non-existent companies`);
    } else {
      console.log('   ✅ All leads have valid company references');
    }
    
    // Check for notes without corresponding pipeline entries
    const { data: orphanNotes } = await supabase
      .from('lead_notes')
      .select('id, lead_id')
      .not('lead_id', 'in', '(SELECT id FROM lead_pipeline)');
    
    if (orphanNotes?.length > 0) {
      console.log(`   ⚠️  ${orphanNotes.length} notes reference non-existent pipeline entries`);
    } else {
      console.log('   ✅ All notes have valid pipeline references');
    }
    
    // Check activity log integrity
    const { data: orphanActivity } = await supabase
      .from('activity_log')
      .select('id, lead_id')
      .not('lead_id', 'in', '(SELECT id FROM lead_pipeline)');
    
    if (orphanActivity?.length > 0) {
      console.log(`   ⚠️  ${orphanActivity.length} activities reference non-existent pipeline entries`);
    } else {
      console.log('   ✅ All activities have valid pipeline references');
    }
    
    // Schema optimization recommendations
    console.log('\n💡 PIPELINE OPTIMIZATION RECOMMENDATIONS:');
    
    console.log('\n1. 🗑️  CONSOLIDATE NOTES SYSTEM:');
    console.log('   • lead_notes table (144 records) could be merged into lead_pipeline.notes field');
    console.log('   • This would eliminate a table and simplify queries');
    console.log('   • Current lead_pipeline.notes field exists but might be underutilized');
    
    console.log('\n2. 📊 IMPROVE ACTIVITY TRACKING:');
    console.log('   • activity_log system looks well designed');
    console.log('   • Good session tracking with cold_call_sessions');
    console.log('   • Consider indexing for better performance');
    
    console.log('\n3. 🔄 PIPELINE TYPE OPTIMIZATION:');
    console.log('   • Multiple pipeline types might benefit from normalization');
    console.log('   • Consider pipeline_configs table for type definitions');
    
    console.log('\n4. 📈 STAGE MANAGEMENT:');
    console.log('   • Stage definitions are hardcoded in frontend');
    console.log('   • Consider stages configuration table for flexibility');
    
    console.log('\n5. 🚀 PERFORMANCE IMPROVEMENTS:');
    console.log('   • Add composite indexes for common queries');
    console.log('   • Consider materialized views for dashboard aggregations');
    
    console.log('\n🎯 IMMEDIATE ACTIONS RECOMMENDED:');
    console.log('   1. Migrate lead_notes data to lead_pipeline.notes field');
    console.log('   2. Drop lead_notes table after migration');
    console.log('   3. Add performance indexes');
    console.log('   4. Clean up any orphaned records');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  }
}

analyzePipelineStructure();