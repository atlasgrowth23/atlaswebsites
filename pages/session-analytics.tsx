import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

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
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

interface SessionAnalyticsProps {
  sessions: SessionAnalytic[];
  companyId?: string;
  companyName?: string;
  totalViews: number;
}

export default function SessionAnalytics({ sessions, companyId, companyName, totalViews }: SessionAnalyticsProps) {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Use a consistent format that works on both server and client
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      return '';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Use a consistent format for date and time
      return date.toISOString().replace('T', ' ').substring(0, 19); // YYYY-MM-DD HH:MM:SS
    } catch (error) {
      return '';
    }
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
                {totalViews} total views • {sessions.length} detailed sessions
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
                          {formatDate(session.visit_start_time)}
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
                      {formatDateTime(selectedSessionData.visit_start_time)}
                    </p>
                    {selectedSessionData.visit_end_time && (
                      <p className="text-sm text-gray-500">
                        to {formatDateTime(selectedSessionData.visit_end_time)}
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
                  
                  {(selectedSessionData.latitude && selectedSessionData.longitude) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Location</h3>
                      <p className="text-sm text-gray-900">
                        {selectedSessionData.city && selectedSessionData.country 
                          ? `${selectedSessionData.city}, ${selectedSessionData.country}`
                          : 'Location available'
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedSessionData.latitude.toFixed(4)}, {selectedSessionData.longitude.toFixed(4)}
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
    
    // Build query for template views with company info
    let query = supabase
      .from('template_views')
      .select(`
        id,
        company_id,
        companies!inner(name),
        session_id,
        template_key,
        total_time_seconds,
        user_agent,
        referrer_url,
        visit_start_time,
        visit_end_time,
        device_type,
        browser_name,
        country,
        city,
        longitude,
        latitude,
        page_interactions
      `)
      .not('session_id', 'is', null)
      .order('visit_start_time', { ascending: false })
      .limit(1000);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data: templateViews, error } = await query;
    
    if (error) {
      console.error('Error fetching template views:', error);
      throw error;
    }
    
    // Get company name and total views if filtering by company
    let companyName = null;
    let totalViews = 0;
    
    if (companyId) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      
      companyName = companyData?.name || null;
      
      // Get total views count for this company
      const { count } = await supabase
        .from('template_views')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
      
      totalViews = count || 0;
    } else {
      // If no company filter, count all sessions as total views
      totalViews = templateViews?.length || 0;
    }
    
    // Format sessions data
    const sessions = (templateViews || []).map((view: any) => ({
      id: view.id,
      company_id: view.company_id,
      company_name: view.companies?.name || 'Unknown Company',
      session_id: view.session_id,
      template_key: view.template_key,
      total_time_seconds: view.total_time_seconds || 0,
      user_agent: view.user_agent || '',
      referrer_url: view.referrer_url || '',
      visit_start_time: view.visit_start_time,
      visit_end_time: view.visit_end_time,
      device_type: view.device_type,
      browser_name: view.browser_name,
      country: view.country,
      city: view.city,
      longitude: view.longitude,
      latitude: view.latitude,
      page_interactions: view.page_interactions || 0
    }));

    return {
      props: {
        sessions,
        companyId: companyId || null,
        companyName,
        totalViews,
      },
    };
  } catch (error) {
    console.error('Error fetching session analytics:', error);
    return {
      props: {
        sessions: [],
        companyId: null,
        companyName: null,
        totalViews: 0,
      },
    };
  }
};