import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-analytics-indexes.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('DO'));

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (const statement of statements) {
      if (statement.includes('CREATE INDEX')) {
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error('Index creation error:', error);
            results.push({ statement: statement.substring(0, 100) + '...', status: 'error', error: error.message });
            errorCount++;
          } else {
            results.push({ statement: statement.substring(0, 100) + '...', status: 'success' });
            successCount++;
          }
        } catch (err) {
          console.error('Statement execution error:', err);
          results.push({ statement: statement.substring(0, 100) + '...', status: 'error', error: (err as Error).message });
          errorCount++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Executed ${successCount} indexes successfully, ${errorCount} errors`,
      successCount,
      errorCount,
      results
    });

  } catch (error) {
    console.error('Run indexes error:', error);
    return res.status(500).json({ 
      error: 'Failed to run indexes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}