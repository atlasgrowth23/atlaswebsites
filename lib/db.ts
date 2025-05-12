import { neon } from '@neondatabase/serverless';

// Create database client
export const sql = neon(process.env.DATABASE_URL!);

// Helper function to execute SQL queries
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const result = await sql.query(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}