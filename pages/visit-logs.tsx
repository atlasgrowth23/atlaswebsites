import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getAllCompanies } from '@/lib/supabase-db';

interface VisitLog {
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
  last_viewed_at: string;
}

interface VisitLogsProps {
  visits: VisitLog[];
  totalVisits: number;
}

export default function VisitLogs({ visits, totalVisits }: VisitLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'duration' | 'company'>('recent');

  const filteredVisits = visits.filter(visit =>
    visit.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.template_key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedVisits = [...filteredVisits].sort((a, b) => {
    switch (sortBy) {
      case 'duration':
        return b.total_time_seconds - a.total_time_seconds;
      case 'company':
        return a.company_name.localeCompare(b.company_name);
      case 'recent':
      default:
        return new Date(b.visit_start_time).getTime() - new Date(a.visit_start_time).getTime();
    }
  });

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getBrowserFromUserAgent = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return '🌐 Chrome';
    if (userAgent.includes('Firefox')) return '🦊 Firefox';
    if (userAgent.includes('Safari')) return '🧭 Safari';
    if (userAgent.includes('Edge')) return '🔷 Edge';
    return '📱 Other';
  };

  return (
    <>
      <Head>
        <title>Website Visit Logs - Analytics Dashboard</title>
        <meta name="description" content="Detailed logs of all website visits with timing data" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Website Visit Logs</h1>
                <p className="text-gray-600 mt-2">
                  {totalVisits} total visits tracked • {filteredVisits.length} shown
                </p>
              </div>
              <Link 
                href="/business-dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>

            {/* Controls */}
            <div className="flex gap-4 mt-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by company name or template..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="duration">Longest Duration</option>
                <option value="company">Company Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visit Logs */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {sortedVisits.map((visit) => (
              <div key={visit.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Company Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900">{visit.company_name}</h3>
                    <p className="text-sm text-gray-600">Template: {visit.template_key}</p>
                    <p className="text-xs text-gray-500 mt-1">Session: {visit.session_id.slice(-8)}</p>
                  </div>

                  {/* Timing */}
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatDuration(visit.total_time_seconds)}
                    </div>
                    <p className="text-xs text-gray-500">Time on site</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(visit.visit_start_time)}
                    </p>
                  </div>

                  {/* Browser & Source */}
                  <div>
                    <p className="text-sm font-medium">
                      {getBrowserFromUserAgent(visit.user_agent)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {visit.referrer_url ? (
                        <>Referred from: {new URL(visit.referrer_url).hostname}</>
                      ) : (
                        'Direct visit'
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end">
                    <Link
                      href={`/t/${visit.template_key}/${visit.company_name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      target="_blank"
                    >
                      View Site →
                    </Link>
                  </div>
                </div>

                {/* Additional Details */}
                {visit.total_time_seconds > 60 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>🎯 High engagement visit</span>
                      <span>Duration: {formatDuration(visit.total_time_seconds)}</span>
                      <span>
                        Session length: {Math.round((new Date(visit.visit_end_time).getTime() - new Date(visit.visit_start_time).getTime()) / 1000 / 60)}m
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {sortedVisits.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No visits found matching your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Temporarily disabled for Supabase migration
    return {
      props: {
        visits: [],
        totalVisits: 0,
      },
    };
    
    /* const result = await query(`
      SELECT 
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
        et.last_viewed_at
      FROM enhanced_tracking et
      JOIN companies c ON et.company_id = c.id
      WHERE et.session_id IS NOT NULL 
        AND et.total_time_seconds > 0
        AND (c.state = 'Alabama' OR c.state = 'Arkansas')
      ORDER BY et.visit_start_time DESC
      LIMIT 200
    `);

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM enhanced_tracking et
      JOIN companies c ON et.company_id = c.id
      WHERE et.session_id IS NOT NULL 
        AND et.total_time_seconds > 0
        AND (c.state = 'Alabama' OR c.state = 'Arkansas')
    `);

    // Convert dates to strings for serialization
    const visits = result.rows.map((visit: any) => ({
      ...visit,
      visit_start_time: visit.visit_start_time ? visit.visit_start_time.toISOString() : null,
      visit_end_time: visit.visit_end_time ? visit.visit_end_time.toISOString() : null,
      last_viewed_at: visit.last_viewed_at ? visit.last_viewed_at.toISOString() : null,
    }));

    return {
      props: {
        visits,
        totalVisits: parseInt(countResult.rows[0].total) || 0,
      },
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      props: {
        visits: [],
        totalVisits: 0,
      },
    };
  }
};