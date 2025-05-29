import { Pool, PoolClient, QueryResult } from 'pg';

// Configure retry mechanism
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;



// Create database pool with error handling
function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Neon PostgreSQL
    },
    connectionTimeoutMillis: 5000,
    max: 20,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: true
  });
}

// Initialize the pool
const pool = createPool();

// Set up error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Helper function to retry failed queries
async function retryQuery<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Query failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    return retryQuery(fn, retries - 1);
  }
}

// The result type of our query functions
type QueryResponse = QueryResult;

// Helper function to run SQL queries with parameters and retries
export async function query(text: string, params?: any[]): Promise<QueryResponse> {
  try {
    return await retryQuery(() => pool.query(text, params));
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Function to query a single row with retries
export async function queryOne(text: string, params?: any[]): Promise<any | null> {
  try {
    const result = await query(text, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

// Function to query multiple rows with retries
export async function queryMany(text: string, params?: any[]): Promise<any[]> {
  try {
    const result = await query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

// Function to get a client from the pool for transactions
export async function getClient(): Promise<PoolClient> {
  try {
    return await pool.connect();
  } catch (error) {
    console.error('Error getting client from pool:', error);
    throw error;
  }
}

// Export the pool for direct access if needed
export const db = pool;