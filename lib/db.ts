import { Pool } from 'pg';

// Define a mock pool type that matches the Pool interface but returns empty results
class MockPool {
  async query() {
    return { rows: [], rowCount: 0 };
  }
  
  async connect() {
    throw new Error('Mock pool cannot connect');
  }
  
  async end() {
    // Do nothing
  }
  
  on() {
    // Do nothing
    return this;
  }
}

// Create a PostgreSQL connection pool with better error handling
const createPool = (): Pool | MockPool => {
  try {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Neon PostgreSQL
      },
      // Add connection timeout to prevent hanging
      connectionTimeoutMillis: 5000,
      // Retry strategy for failed connections
      max: 20, // Max number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
      allowExitOnIdle: true // Close idle clients after idleTimeoutMillis
    });
  } catch (error) {
    console.error('Failed to create database pool:', error);
    // Return a mock pool that will return empty results
    return new MockPool();
  }
};

// Initialize the pool
const pool = createPool();

// Helper function to run SQL queries with parameters
export async function query(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    // Return empty result instead of throwing to prevent crashes during static generation
    return { rows: [], rowCount: 0 };
  }
}

// Function to query a single row
export async function queryOne(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

// Function to query multiple rows
export async function queryMany(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

// Export the pool for direct access if needed
export const db = pool;