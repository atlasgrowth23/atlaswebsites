import fetch from 'node-fetch'

const SUPABASE_URL = 'https://zjxvacezqbhyomrngynq.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqeHZhY2V6cWJoeW9tcm5neW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODYzOTg2NCwiZXhwIjoyMDY0MjE1ODY0fQ.1dbOL9c54yChzqziz7BNTh-JLs4jQRomw18XhQJP_bs'

async function createExecFunction() {
  console.log('Creating exec function...')
  
  const sql = `
    CREATE OR REPLACE FUNCTION exec(sql text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'executed';
    END;
    $$;
  `
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  })
  
  console.log('Exec function response:', response.status)
  if (!response.ok) {
    const error = await response.text()
    console.log('Error:', error)
  }
}

createExecFunction()