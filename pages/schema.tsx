import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchemaTable {
  table_name: string;
  columns: string[];
  exists?: boolean;
  empty?: boolean;
  message?: string;
}

interface SchemaResponse {
  success: boolean;
  tables: SchemaTable[];
  error?: string;
  env?: {
    url_exists: boolean;
    anon_key_exists: boolean;
    service_key_exists: boolean;
  };
}

export default function SchemaPage() {
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchema() {
      try {
        const response = await fetch('/api/schema-info');
        const data = await response.json();
        setSchema(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch schema information');
      } finally {
        setLoading(false);
      }
    }

    fetchSchema();
  }, []);

  function parseColumnInfo(columnStr: string) {
    const [name, type] = columnStr.split('::');
    return { name, type };
  }

  return (
    <>
      <Head>
        <title>Database Schema | HVAC Portal</title>
        <meta name="description" content="View database schema for HVAC Portal" />
      </Head>

      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Database Schema</h1>
        <p className="mb-4 text-gray-600">Displaying the current database structure from Supabase.</p>

        {loading && <p className="text-gray-600">Loading schema information...</p>}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {schema && !schema.success && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{schema.error}</p>
            <div className="mt-4">
              <h3 className="font-semibold">Environment Check:</h3>
              <ul className="list-disc ml-5 mt-2">
                <li>Supabase URL: {schema.env?.url_exists ? '✅' : '❌'}</li>
                <li>Anon Key: {schema.env?.anon_key_exists ? '✅' : '❌'}</li>
                <li>Service Key: {schema.env?.service_key_exists ? '✅' : '❌'}</li>
              </ul>
            </div>
          </div>
        )}

        {schema && schema.success && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schema.tables.map((table) => {
                // Only show tables that actually exist (with data or empty)
                if (table.exists === false) return null;
                
                return (
                  <Card key={table.table_name} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="text-blue-700">
                        {table.table_name}
                      </CardTitle>
                      {table.empty && (
                        <p className="text-sm mt-1 text-gray-600">This table exists but has no data yet.</p>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      {table.columns.length > 0 ? (
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {table.columns.map((column, i) => {
                              const { name, type } = parseColumnInfo(column);
                              return (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm font-medium">{name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-500">{type}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          This table exists but is empty. Data structure will be shown when rows are added.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }).filter(Boolean)}
            </div>

            {schema.tables.filter(t => t.exists !== false).length === 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-700">No tables found in the database.</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}