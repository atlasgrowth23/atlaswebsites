import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import AdminLayout from '@/components/AdminLayout';

interface AnalyticsData {
  summary: {
    totalViews: number;
    totalSessions: number;
    avgTime: number;
    activeCompanies: number;
  };
  companies: Array<{
    company: {
      id: string;
      name: string;
      slug: string;
      city: string;
      state: string;
    };
    metrics: {
      views: number;
      sessions: number;
      avgTime: number;
      lastActivity: string | null;
      deviceBreakdown: {
        desktop: number;
        mobile: number;
        tablet: number;
      };
    };
  }>;
  timeframe: string;
  state: string;
}

interface AdminAnalyticsProps {
  data: AnalyticsData;
}

export default function AdminAnalytics({ data }: AdminAnalyticsProps) {
  const [sortBy, setSortBy] = useState<'views' | 'sessions' | 'avgTime' | 'lastActivity'>('views');
  const [filterMinViews, setFilterMinViews] = useState(0);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (device: string): string => {
    switch (device) {
      case 'mobile': return '📱';
      case 'tablet': return '📟';
      case 'desktop': return '💻';
      default: return '📊';
    }
  };

  const getPrimaryDevice = (breakdown: { desktop: number; mobile: number; tablet: number }): string => {
    const total = breakdown.desktop + breakdown.mobile + breakdown.tablet;
    if (total === 0) return 'desktop';
    
    if (breakdown.mobile > breakdown.desktop && breakdown.mobile > breakdown.tablet) return 'mobile';
    if (breakdown.tablet > breakdown.desktop && breakdown.tablet > breakdown.mobile) return 'tablet';
    return 'desktop';
  };

  const filteredAndSortedCompanies = data.companies
    .filter(company => company.metrics.views >= filterMinViews)
    .sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.metrics.views - a.metrics.views;
        case 'sessions':
          return b.metrics.sessions - a.metrics.sessions;
        case 'avgTime':
          return b.metrics.avgTime - a.metrics.avgTime;
        case 'lastActivity':
          if (!a.metrics.lastActivity && !b.metrics.lastActivity) return 0;
          if (!a.metrics.lastActivity) return 1;
          if (!b.metrics.lastActivity) return -1;
          return new Date(b.metrics.lastActivity).getTime() - new Date(a.metrics.lastActivity).getTime();
        default:
          return 0;
      }
    });

  return (
    <AdminLayout currentPage="analytics">
      <Head>
        <title>Analytics - Admin Dashboard</title>
        <meta name="description" content="Website analytics and performance tracking" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Analytics</h1>
          <p className="text-gray-600">Performance tracking for {data.timeframe}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <span className="text-xl">👀</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <span className="text-xl">🔄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalSessions.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <span className="text-xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-gray-900">{formatTime(data.summary.avgTime)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <span className="text-xl">🏢</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Sites</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.activeCompanies}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="views">Views</option>
                <option value="sessions">Sessions</option>
                <option value="avgTime">Avg Time</option>
                <option value="lastActivity">Last Activity</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Views</label>
              <select
                value={filterMinViews}
                onChange={(e) => setFilterMinViews(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>All</option>
                <option value={1}>1+</option>
                <option value={5}>5+</option>
                <option value={10}>10+</option>
                <option value={25}>25+</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 ml-auto">
              Showing {filteredAndSortedCompanies.length} of {data.companies.length} companies
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Company Performance</h3>
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
                    Primary Device
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
                {filteredAndSortedCompanies.map((item) => {
                  const primaryDevice = getPrimaryDevice(item.metrics.deviceBreakdown);
                  const totalDeviceViews = item.metrics.deviceBreakdown.desktop + 
                                         item.metrics.deviceBreakdown.mobile + 
                                         item.metrics.deviceBreakdown.tablet;
                  
                  return (
                    <tr key={item.company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.company.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.company.city}, {item.company.state}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.metrics.views}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.metrics.sessions}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatTime(item.metrics.avgTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <span className="mr-1">{getDeviceIcon(primaryDevice)}</span>
                          {primaryDevice}
                          {totalDeviceViews > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({Math.round((item.metrics.deviceBreakdown[primaryDevice as keyof typeof item.metrics.deviceBreakdown] / totalDeviceViews) * 100)}%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(item.metrics.lastActivity)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <a
                            href={`/t/moderntrust/${item.company.slug}?preview=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Site
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredAndSortedCompanies.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <span className="text-4xl block mb-4">📊</span>
                  No companies match your filters
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const state = (query.state as string) || 'Alabama';
  
  try {
    // Import the dashboard logic directly instead of self-fetch
    const { supabaseAdmin } = await import('@/lib/supabase');

    // Get companies for the state
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name, slug, city, state')
      .eq('state', state)
      .order('name');

    if (companiesError) {
      throw companiesError;
    }

    // Also get all companies that have tracking data regardless of state
    const { data: allTrackingCompanies, error: trackingError } = await supabaseAdmin
      .from('template_views')
      .select('company_id')
      .not('company_id', 'is', null);

    // Get unique company IDs from tracking data
    const trackingCompanyIds = [...new Set(allTrackingCompanies?.map(t => t.company_id) || [])];
    
    // Get company details for tracking companies not in the state filter
    const { data: additionalCompanies, error: additionalError } = await supabaseAdmin
      .from('companies')
      .select('id, name, slug, city, state')
      .in('id', trackingCompanyIds)
      .not('state', 'eq', state);

    // Combine all companies
    const allCompanies = [...(companies || []), ...(additionalCompanies || [])];
    
    if (allCompanies.length === 0) {
      return {
        props: {
          data: {
            summary: { totalViews: 0, totalSessions: 0, avgTime: 0, activeCompanies: 0 },
            companies: [],
            timeframe: '30 days',
            state
          }
        }
      };
    }

    const companyIds = allCompanies.map(c => c.id);

    // Get analytics data for the last 30 days
    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from('template_views')
      .select('company_id, session_id, total_time_seconds, device_type, created_at')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (analyticsError) {
      throw analyticsError;
    }

    // Process analytics data
    const companyStats = allCompanies.map(company => {
      const companyViews = analytics?.filter(v => v.company_id === company.id) || [];
      const sessions = new Set(companyViews.map(v => v.session_id));
      const totalViews = companyViews.length;
      const totalSessions = sessions.size;
      
      // Calculate average time (only for sessions with meaningful time)
      const validTimes = companyViews
        .map(v => v.total_time_seconds || 0)
        .filter(time => time > 0);
      const avgTime = validTimes.length > 0 
        ? Math.round(validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length)
        : 0;

      // Get last activity
      const lastView = companyViews.length > 0 
        ? Math.max(...companyViews.map(v => new Date(v.created_at).getTime()))
        : null;

      // Device breakdown
      const deviceBreakdown = {
        desktop: companyViews.filter(v => v.device_type === 'desktop').length,
        mobile: companyViews.filter(v => v.device_type === 'mobile').length,
        tablet: companyViews.filter(v => v.device_type === 'tablet').length
      };

      return {
        company,
        metrics: {
          views: totalViews,
          sessions: totalSessions,
          avgTime,
          lastActivity: lastView ? new Date(lastView).toISOString() : null,
          deviceBreakdown
        }
      };
    });

    // Calculate summary statistics
    const summary = {
      totalViews: companyStats.reduce((sum, stat) => sum + stat.metrics.views, 0),
      totalSessions: companyStats.reduce((sum, stat) => sum + stat.metrics.sessions, 0),
      avgTime: companyStats.length > 0 
        ? Math.round(companyStats.reduce((sum, stat) => sum + stat.metrics.avgTime, 0) / companyStats.length)
        : 0,
      activeCompanies: companyStats.filter(stat => stat.metrics.views > 0).length
    };

    const data = {
      summary,
      companies: companyStats,
      timeframe: '30 days',
      state
    };
    
    return {
      props: { data }
    };
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    
    // Return empty data structure on error
    return {
      props: {
        data: {
          summary: { totalViews: 0, totalSessions: 0, avgTime: 0, activeCompanies: 0 },
          companies: [],
          timeframe: '30 days',
          state
        }
      }
    };
  }
};