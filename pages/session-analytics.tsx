import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { query } from '../lib/db';

interface SessionAnalytic {
  id: string;
  company_id: string;
  company_name: string;
  session_id: string;
  template_key: string;
  total_time_seconds: number;
  user_agent: string;
  referrer_url: string;
  visit_start_time: string;
  visit_end_time: string;
  ip_address?: string;
  device_type?: string;
  browser?: string;
  location?: string;
}

interface SessionAnalyticsProps {
  sessions: SessionAnalytic[];
  companyId?: string;
  companyName?: string;
}

export default function SessionAnalytics({ sessions, companyId, companyName }: SessionAnalyticsProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const getDeviceType = (userAgent: string) => {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'Mobile';
    if (/Tablet/.test(userAgent)) return 'Tablet';
    return 'Desktop';
  };

  const getBrowser = (userAgent: string) => {
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    return 'Other';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const selectedSessionData = selectedSession 
    ? sessions.find(s => s.session_id === selectedSession)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Session Analytics
                {companyName && (
                  <span className="text-xl font-normal text-gray-600 ml-2">
                    - {companyName}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">
                {sessions.length} visitor sessions tracked
              </p>
            </div>
            <Link 
              href="/business-dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Visitor Sessions</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessions.map((session) => (
                      <tr 
                        key={session.session_id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedSession === session.session_id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedSession(session.session_id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {session.session_id.substring(0, 8)}...
                          </div>
                          <div className="text-sm text-gray-500">
                            {getBrowser(session.user_agent)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{session.company_name}</div>
                          <div className="text-sm text-gray-500">{session.template_key}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatDuration(session.total_time_seconds)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {getDeviceType(session.user_agent)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(session.visit_start_time).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Session Details</h2>
              </div>
              
              {selectedSessionData ? (
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Session ID</h3>
                    <p className="text-sm text-gray-900 font-mono">{selectedSessionData.session_id}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Company</h3>
                    <p className="text-sm text-gray-900">{selectedSessionData.company_name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Template</h3>
                    <p className="text-sm text-gray-900">{selectedSessionData.template_key}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDuration(selectedSessionData.total_time_seconds)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Device & Browser</h3>
                    <p className="text-sm text-gray-900">
                      {getDeviceType(selectedSessionData.user_agent)} • {getBrowser(selectedSessionData.user_agent)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Visit Time</h3>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedSessionData.visit_start_time).toLocaleString()}
                    </p>
                    {selectedSessionData.visit_end_time && (
                      <p className="text-sm text-gray-500">
                        to {new Date(selectedSessionData.visit_end_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  {selectedSessionData.referrer_url && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Referrer</h3>
                      <p className="text-sm text-gray-900 break-all">
                        {selectedSessionData.referrer_url}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">User Agent</h3>
                    <p className="text-xs text-gray-600 break-all">
                      {selectedSessionData.user_agent}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>Click on a session to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query: urlQuery }) => {
  try {
    const companyId = urlQuery.company as string;
    
    let sqlQuery = `
      SELECT DISTINCT
        et.id,
        et.company_id,
        c.name as company_name,
        et.session_id,
        et.template_key,
        et.total_time_seconds,
        et.user_agent,
        et.referrer_url,
        et.visit_start_time,
        et.visit_end_time,
        et.device_type,
        et.browser_name,
        et.country,
        et.city,
        et.page_interactions
      FROM enhanced_tracking et
      JOIN companies c ON et.company_id = c.id
      WHERE et.session_id IS NOT NULL
    `;
    
    const params: any[] = [];
    
    if (companyId) {
      sqlQuery += ` AND et.company_id = $1`;
      params.push(companyId);
    }
    
    sqlQuery += ` ORDER BY et.visit_start_time DESC LIMIT 1000`;
    
    const result = await query(sqlQuery, params);
    
    // Get company name if filtering by company
    let companyName = null;
    if (companyId) {
      const companyResult = await query('SELECT name FROM companies WHERE id = $1', [companyId]);
      companyName = companyResult.rows[0]?.name || null;
    }
    
    // Convert dates to strings for serialization
    const sessions = result.rows.map((session: any) => ({
      ...session,
      visit_start_time: session.visit_start_time ? (session.visit_start_time instanceof Date ? session.visit_start_time.toISOString() : session.visit_start_time) : null,
      visit_end_time: session.visit_end_time ? (session.visit_end_time instanceof Date ? session.visit_end_time.toISOString() : session.visit_end_time) : null,
    }));

    return {
      props: {
        sessions,
        companyId: companyId || null,
        companyName,
      },
    };
  } catch (error) {
    console.error('Error fetching session analytics:', error);
    return {
      props: {
        sessions: [],
        companyId: null,
        companyName: null,
      },
    };
  }
};