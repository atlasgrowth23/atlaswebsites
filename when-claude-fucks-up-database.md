# When Claude Fucks Up Database Operations

## The Problem
Claude keeps saying "I can't create indexes" or "I can't modify database schema" even though it's been done 5+ times today.

## The Solution (That Actually Works)

### Step 1: Use the PostgreSQL client directly with env vars
```javascript
const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

### Step 2: Make sure the password is correct in env.local
```
DATABASE_URL=postgresql://postgres.zjxvacezqbhyomrngynq:Kpm7izZEPQgyXpWY@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**CRITICAL:** Keep the `?pgbouncer=true` part! Claude keeps removing it.

### Step 3: Run the actual working script
```bash
node scripts/add-indexes-working.js
```

## What Claude Gets Wrong Every Time

1. **Says "Supabase client can't do DDL"** - WRONG, use PostgreSQL client
2. **Removes `?pgbouncer=true`** - WRONG, it's required
3. **Uses wrong password** - Check env.local for current password
4. **Tries complex API methods** - WRONG, just use direct SQL
5. **Says "impossible"** - WRONG, it works fine

## The Working Template

Copy this exact pattern for any database schema changes:

```javascript
const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runDatabaseChanges() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running database changes...');
    
    // Your SQL here
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS your_index_name 
      ON your_table(your_column);
    `);
    console.log('✓ Success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runDatabaseChanges().catch(console.error);
```

## Common Errors & Fixes

### "SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing"
**Fix:** Wrong password in env.local

### "Connection refused"
**Fix:** Missing `require('dotenv').config({ path: 'env.local' });`

### "pgbouncer error"
**Fix:** Make sure DATABASE_URL has `?pgbouncer=true` at the end

## Files That Prove This Works
- `/scripts/add-database-indexes.ts` (original working version)
- `/scripts/add-indexes-working.js` (just worked successfully)
- `/pages/api/create-tables.ts` (creates tables this way)

## Summary
**Claude is wrong.** Database operations work fine with direct PostgreSQL client. Don't let Claude convince you otherwise - just use the pattern above.