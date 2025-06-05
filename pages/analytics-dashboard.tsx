import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import Link from 'next/link';

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

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const [selectedState, setSelectedState] = useState(data.state);
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
    <>
      <Head>
        <title>Analytics Dashboard - Atlas Websites</title>
        <meta name="description" content="Website analytics and performance tracking" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600">Website performance tracking for {data.timeframe}</p>
              </div>
              <div className="flex gap-4">
                <Link
                  href="/admin/pipeline"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  → Pipeline
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <span className="text-2xl">👀</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <span className="text-2xl">🔄</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalSessions.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(data.summary.avgTime)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <span className="text-2xl">🏢</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Sites</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.activeCompanies}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
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
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value={0}>All</option>
                  <option value={1}>1+</option>
                  <option value={5}>5+</option>
                  <option value={10}>10+</option>
                  <option value={25}>25+</option>
                </select>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredAndSortedCompanies.length} of {data.companies.length} companies
              </div>
            </div>
          </div>

          {/* Companies Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const state = (query.state as string) || 'Alabama';
  
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/analytics/dashboard?state=${encodeURIComponent(state)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      props: {
        data
      }
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