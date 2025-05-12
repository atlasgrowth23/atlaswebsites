import { createClient } from '@/lib/supabase/client';

export default function DebugPage({ data, error }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Database Connection Test</h1>

      {error && (
        <div style={{ 
          backgroundColor: '#ffeaea', 
          padding: '15px', 
          borderRadius: '5px', 
          marginBottom: '20px',
          color: '#d32f2f'
        }}>
          <h2>Error:</h2>
          <p>{error}</p>
        </div>
      )}

      <div>
        <h2>Data from companies table ({data?.length || 0} records):</h2>
        {data && data.length > 0 ? (
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto',
            maxHeight: '500px'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p>No data available or empty result set</p>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(3);

    return {
      props: {
        data: data || [],
        error: error ? error.message : null,
      },
    };
  } catch (e) {
    return {
      props: {
        data: [],
        error: e.message,
      },
    };
  }
}