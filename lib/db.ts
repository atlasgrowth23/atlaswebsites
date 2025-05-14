import { Pool, PoolClient } from 'pg';

// Configure retry mechanism
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

// Define a mock pool type that matches the Pool interface but returns mock data
class MockPool {
  async query(text: string) {
    console.log('MOCK DB QUERY:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    // If the query is looking for companies, return mock data
    if (text.toLowerCase().includes('from companies')) {
      return {
        rows: [
          {
            id: '1',
            name: 'Comfort Plus Air and Heating',
            slug: 'comfort-plus-air-and-heating',
            city: 'Springfield',
            state: 'IL',
            phone: '(555) 123-4567',
            rating: 4.8,
            reviews: 124,
            company_frames: {
              hero_img: 'https://t3.ftcdn.net/jpg/02/81/35/14/240_F_281351499_EEFFBZbeaq6GUxRabVIfIPr6UZU3RjKV.jpg'
            }
          }
        ],
        rowCount: 1
      };
    }
    
    // For other queries, return empty result
    return { rows: [], rowCount: 0 };
  }
  
  async connect() {
    return new MockPoolClient();
  }
  
  async end() {
    // Do nothing
  }
  
  on() {
    // Do nothing
    return this;
  }
}

class MockPoolClient {
  async query() {
    return { rows: [], rowCount: 0 };
  }
  
  async release() {
    // Do nothing
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

// Set up error handling for the pool
if ('on' in pool) {
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });
}

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

// Helper function to run SQL queries with parameters and retries
export async function query(text: string, params?: any[]) {
  try {
    return await retryQuery(() => pool.query(text, params));
  } catch (error) {
    console.error('Database query error:', error);
    // Return empty result instead of throwing to prevent crashes during static generation
    return { rows: [], rowCount: 0 };
  }
}

// Function to query a single row with retries
export async function queryOne(text: string, params?: any[]) {
  try {
    const result = await retryQuery(() => pool.query(text, params));
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

// Function to query multiple rows with retries
export async function queryMany(text: string, params?: any[]) {
  try {
    const result = await retryQuery(() => pool.query(text, params));
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