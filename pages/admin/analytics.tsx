import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { getAllCompanies } from '@/lib/supabase-db';

interface Company {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  tracking_enabled?: boolean;
  tracking_paused?: boolean;
}

interface TrackingData {
  total_views: number;
  total_sessions: number;
  avg_time_seconds: number;
  last_viewed_at: string | null;
  device_breakdown: { desktop: number; mobile: number; tablet: number };
  recent_sessions: any[];
}

interface AnalyticsProps {
  companies: Company[];
}

export default function Analytics({ companies }: AnalyticsProps) {
  const [selectedState, setSelectedState] = useState<'Alabama' | 'Arkansas'>('Alabama');
  const [trackingData, setTrackingData] = useState<Record<string, TrackingData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const filteredCompanies = companies.filter(company => 
    company.state === selectedState && company.tracking_enabled
  );

  const fetchTrackingData = async (companyId: string) => {
    if (loading[companyId]) return;
    
    setLoading(prev => ({ ...prev, [companyId]: true }));
    
    try {
      const [viewsRes, analyticsRes] = await Promise.all([
        fetch(`/api/template-views?companyId=${companyId}`),
        fetch(`/api/analytics-summary?companyId=${companyId}`)
      ]);
      
      let data: TrackingData = {
        total_views: 0,
        total_sessions: 0,
        avg_time_seconds: 0,
        last_viewed_at: null,
        device_breakdown: { desktop: 0, mobile: 0, tablet: 0 },
        recent_sessions: []
      };

      if (viewsRes.ok) {
        const viewsData = await viewsRes.json();
        data.total_views = viewsData.total_views || 0;
        data.total_sessions = viewsData.unique_sessions || 0;
        data.last_viewed_at = viewsData.last_viewed_at;
        data.recent_sessions = viewsData.views || [];
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        data.avg_time_seconds = analyticsData.avg_time_seconds || 0;
        data.device_breakdown = analyticsData.device_breakdown || data.device_breakdown;
      }
      
      setTrackingData(prev => ({ ...prev, [companyId]: data }));
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setLoading(prev => ({ ...prev, [companyId]: false }));
    }
  };

  useEffect(() => {
    // Load data for all visible companies
    filteredCompanies.forEach(company => {
      if (!trackingData[company.id]) {
        fetchTrackingData(company.id);
      }
    });
  }, [selectedState]);

  const getTotalStats = () => {
    let totalViews = 0;
    let totalSessions = 0;
    let totalTimeSeconds = 0;
    let companiesWithData = 0;

    Object.values(trackingData).forEach(data => {
      totalViews += data.total_views;
      totalSessions += data.total_sessions;
      if (data.avg_time_seconds > 0) {
        totalTimeSeconds += data.avg_time_seconds;
        companiesWithData++;
      }
    });

    return {
      totalViews,
      totalSessions,
      avgTime: companiesWithData > 0 ? Math.round(totalTimeSeconds / companiesWithData) : 0,
      activeCompanies: filteredCompanies.length
    };
  };

  const stats = getTotalStats();

  return (
    <AdminLayout currentPage="analytics">
      <Head>
        <title>Analytics - Lead Management</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Website performance and engagement metrics</p>
        </div>

        {/* State Toggle */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setSelectedState('Alabama')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedState === 'Alabama'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Alabama
          </button>
          <button
            onClick={() => setSelectedState('Arkansas')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedState === 'Arkansas'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Arkansas
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-semibold text-gray-900">{stats.totalViews}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-semibold text-blue-600">{stats.totalSessions}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-semibold text-green-600">{stats.avgTime}s</div>
            <div className="text-sm text-gray-600">Avg Session Time</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-semibold text-purple-600">{stats.activeCompanies}</div>
            <div className="text-sm text-gray-600">Active Sites</div>
          </div>
        </div>

        {/* Company Analytics Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Company Performance</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map(company => {
                  const data = trackingData[company.id];
                  const isLoading = loading[company.id];
                  
                  return (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.city}, {company.state}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isLoading ? (
                          <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          data?.total_views || 0
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isLoading ? (
                          <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          data?.total_sessions || 0
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isLoading ? (
                          <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          `${Math.round(data?.avg_time_seconds || 0)}s`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data?.last_viewed_at ? 
                          new Date(data.last_viewed_at).toLocaleDateString() : 
                          'No activity'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`/t/moderntrust/${company.slug}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Site
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredCompanies.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p>No companies with tracking enabled in {selectedState}</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const companies = await getAllCompanies(1000);
    
    const filteredCompanies = companies
      .filter(company => company.state === 'Alabama' || company.state === 'Arkansas')
      .map((company: any) => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        city: company.city || null,
        state: company.state || null,
        tracking_enabled: company.tracking_enabled || false,
        tracking_paused: company.tracking_paused || false,
      }));

    return {
      props: {
        companies: filteredCompanies,
      },
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      props: {
        companies: [],
      },
    };
  }
};