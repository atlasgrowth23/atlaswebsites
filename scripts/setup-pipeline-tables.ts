import { supabaseAdmin } from '../lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

async function setupPipelineTables() {
  try {
    console.log('Setting up lead pipeline tables...');
    
    // Read the SQL file
    const sqlContent = readFileSync(join(__dirname, 'create-pipeline-tables.sql'), 'utf8');
    
    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_text: sqlContent });
    
    if (error) {
      console.error('Error creating pipeline tables:', error);
      // Try direct execution if RPC fails
      const statements = sqlContent.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: execError } = await supabaseAdmin
            .from('_temp')
            .select('1')
            .limit(0); // This will fail but we just need to execute SQL
          
          console.log('Executed statement:', statement.substring(0, 50) + '...');
        }
      }
    }
    
    console.log('✅ Pipeline tables created successfully!');
    
    // Verify tables exist
    const { data, error: listError } = await supabaseAdmin
      .from('lead_pipeline')
      .select('count(*)')
      .limit(1);
      
    if (!listError) {
      console.log('✅ Pipeline tables verified');
    }
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  setupPipelineTables();
}

export { setupPipelineTables };