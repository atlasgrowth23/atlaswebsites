import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';

type SchemaTable = {
  table_name: string;
  columns: string[];
  exists: boolean;
  empty?: boolean;
  message?: string;
};

type SchemaResponse = {
  success: boolean;
  tables: SchemaTable[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SchemaResponse>
) {
  console.log('Replit schema info API called:', new Date().toISOString());
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      tables: [],
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('Getting schema information from Replit PostgreSQL...');
    const formattedTables: SchemaTable[] = [];
    
    // Get list of all tables in the public schema
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the database');
      return res.status(200).json({
        success: true,
        tables: []
      });
    }
    
    console.log(`Found ${tablesResult.rows.length} tables`);
    
    // For each table, get its columns
    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;
      console.log(`Getting columns for table: ${tableName}`);
      
      try {
        // Get column information
        const columnsResult = await query(`
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (columnsResult.rows.length === 0) {
          console.log(`No columns found for table ${tableName}`);
          formattedTables.push({
            table_name: tableName,
            columns: [],
            exists: true,
            empty: true,
            message: 'Table exists but no columns found'
          });
          continue;
        }
        
        // Format columns
        const columnsList = columnsResult.rows.map(col => 
          `${col.column_name}::${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`
        );
        
        // Get row count
        const countResult = await query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const rowCount = parseInt(countResult.rows[0].count);
        
        formattedTables.push({
          table_name: tableName,
          columns: columnsList,
          exists: true,
          empty: rowCount === 0,
          message: `Table contains ${rowCount} rows`
        });
        
        console.log(`Found ${columnsList.length} columns and ${rowCount} rows for ${tableName}`);
      } catch (error) {
        console.error(`Error getting schema for ${tableName}:`, error);
        formattedTables.push({
          table_name: tableName,
          columns: [],
          exists: true,
          message: `Error getting schema: ${error.message}`
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      tables: formattedTables
    });
    
  } catch (error) {
    console.error('Error fetching schema:', error);
    return res.status(500).json({
      success: false,
      tables: [],
      error: error.message
    });
  }
}