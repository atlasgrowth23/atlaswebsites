import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import UnifiedAdminLayout from '@/components/UnifiedAdminLayout';
import LeadSidebar from '@/components/admin/pipeline/LeadSidebar';
import { getAllCompanies } from '@/lib/supabase-db';
import { getActiveSession } from '@/lib/activityTracker';

interface Company {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone?: string;
  email_1?: string;
  site?: string;
  tracking_enabled?: boolean;
  custom_domain?: string;
  domain_verified?: boolean;
  rating?: number;
  reviews?: number;
  reviews_link?: string;
  first_review_date?: string;
  r_30?: number;
  r_60?: number;
  r_90?: number;
  r_365?: number;
  predicted_label?: string;
}

interface PipelineLead {
  id: string;
  company_id: string;
  stage: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  notes: string;
  created_at: string;
  updated_at: string;
  company: Company;
}

interface PipelineProps {
  companies: Company[];
}

const STAGES = [
  { key: 'new_lead', title: 'New Lead', color: 'bg-blue-500', textColor: 'text-white', description: 'Ready to contact' },
  { key: 'live_call', title: 'Live Call', color: 'bg-green-500', textColor: 'text-white', description: 'Talked to them' },
  { key: 'voicemail', title: 'Voicemail', color: 'bg-indigo-500', textColor: 'text-white', description: 'Left voicemail' },
  { key: 'site_viewed', title: 'Site Viewed', color: 'bg-purple-500', textColor: 'text-white', description: 'Visited website' },
  { key: 'appointment', title: 'Appointment', color: 'bg-orange-500', textColor: 'text-white', description: 'Meeting set' },
  { key: 'sale_made', title: 'Sale Made', color: 'bg-emerald-600', textColor: 'text-white', description: 'Deal won' },
  { key: 'unsuccessful', title: 'Unsuccessful', color: 'bg-gray-500', textColor: 'text-white', description: 'Not interested' }
];

export default function Pipeline({ companies }: PipelineProps) {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPipelineType, setSelectedPipelineType] = useState('no_website_alabama');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pipelineStats, setPipelineStats] = useState<Record<string, number>>({});
  
  // Session management state
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const currentUser = 'Nick'; // TODO: Get from auth context

  useEffect(() => {
    fetchPipelineData();
    checkActiveSession();
    
    // Auto-refresh pipeline data every 30 seconds to catch auto-stage updates
    const refreshInterval = setInterval(() => {
      fetchPipelineData();
      checkActiveSession();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [selectedPipelineType]);

  // Real-time session duration updates
  useEffect(() => {
    if (!activeSession) return;
    
    const updateInterval = setInterval(() => {
      // Force re-render to update duration display
      setActiveSession(prev => ({ ...prev }));
    }, 1000);
    
    return () => clearInterval(updateInterval);
  }, [activeSession]);

  // Check for active session
  const checkActiveSession = async () => {
    try {
      const response = await fetch('/api/sessions?user=' + currentUser);
      if (response.ok) {
        const data = await response.json();
        const active = data.sessions.find((s: any) => !s.end_time);
        setActiveSession(active || null);
      }
    } catch (error) {
      console.error('Failed to check active session:', error);
    }
  };

  // Start new session
  const startSession = async () => {
    setSessionLoading(true);
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: currentUser })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);
      } else {
        const error = await response.json();
        alert(`Failed to start session: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Please try again.');
    } finally {
      setSessionLoading(false);
    }
  };

  // End active session
  const endSession = async () => {
    if (!activeSession) return;
    
    setSessionLoading(true);
    try {
      const response = await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: currentUser })
      });

      if (response.ok) {
        setActiveSession(null);
      } else {
        const error = await response.json();
        alert(`Failed to end session: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      alert('Failed to end session. Please try again.');
    } finally {
      setSessionLoading(false);
    }
  };

  // Format session duration
  const formatSessionDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const durationMs = now.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Reset test pipeline
  const resetTestPipeline = async () => {
    if (!confirm('🔄 Reset Test Pipeline?\n\nThis will:\n• Move all test leads back to "New Lead" stage\n• Clear all activity logs\n• Remove all tags\n• Clear appointments\n• Remove website visits\n\nThis cannot be undone. Continue?')) {
      return;
    }

    setSessionLoading(true);
    try {
      const response = await fetch('/api/pipeline/reset-test-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Success!\n\nReset ${data.leadsReset} test leads back to "New Lead" stage.\n\nAll activity logs, tags, and appointments have been cleared.\n\nReady for fresh testing!`);
        await fetchPipelineData(); // Refresh the pipeline data
      } else {
        const error = await response.json();
        alert(`❌ Reset failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to reset test pipeline:', error);
      alert('❌ Failed to reset test pipeline. Please try again.');
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchPipelineData = async () => {
    try {
      const response = await fetch(`/api/pipeline/leads?pipeline_type=${selectedPipelineType}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
        setPipelineStats(data.pipeline_stats || {});
      }
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };


  const moveLeadToStage = async (leadId: string, newStage: string, notes?: string) => {
    try {
      const response = await fetch('/api/pipeline/move-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId, 
          stage: newStage, 
          notes: notes || '' 
        })
      });

      if (response.ok) {
        await fetchPipelineData();
      }
    } catch (error) {
      console.error('Error moving lead:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      lead.company.name.toLowerCase().includes(searchLower) ||
      lead.company.city.toLowerCase().includes(searchLower) ||
      lead.company.phone?.toLowerCase().includes(searchLower);
    
    return matchesSearch;
  });

  const getLeadsByStage = (stage: string) => 
    filteredLeads.filter(lead => lead.stage === stage);

  const getPipelineStats = () => {
    const stats = STAGES.map(stage => ({
      ...stage,
      count: getLeadsByStage(stage.key).length
    }));
    
    const totalLeads = filteredLeads.length;
    const activeLeads = filteredLeads.filter(lead => 
      !['sale_closed', 'not_interested'].includes(lead.stage)
    ).length;
    
    return { stages: stats, totalLeads, activeLeads };
  };

  const openLeadSidebar = (lead: PipelineLead) => {
    setSelectedLead(lead);
    setIsSidebarOpen(true);
  };

  const closeLeadSidebar = () => {
    setSelectedLead(null);
    setIsSidebarOpen(false);
  };

  const handleLeadUpdate = (updatedLead: PipelineLead) => {
    // Update lead in the local state
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      )
    );
  };

  if (loading) {
    return (
      <UnifiedAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedAdminLayout>
    );
  }

  const { stages, totalLeads, activeLeads } = getPipelineStats();

  // Show stage detail view
  if (selectedStage) {
    const stageInfo = STAGES.find(s => s.key === selectedStage);
    const allStageLeads = getLeadsByStage(selectedStage);
    
    // Filter by search term
    const currentStageLeads = allStageLeads.filter(lead => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        lead.company.name.toLowerCase().includes(searchLower) ||
        lead.company.city.toLowerCase().includes(searchLower) ||
        lead.company.phone?.toLowerCase().includes(searchLower)
      );
    });
    
    return (
      <SimpleAdminLayout>
        <Head>
          <title>{stageInfo?.title} - Lead Pipeline</title>
        </Head>

        <div className="max-w-7xl mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedStage(null)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Pipeline Overview
            </button>
          </div>

          {/* Stage Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-4 h-4 rounded-full ${stageInfo?.color}`}></div>
              <h2 className="text-2xl font-bold text-gray-900">{stageInfo?.title}</h2>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                {currentStageLeads.length} leads
                {searchTerm && allStageLeads.length !== currentStageLeads.length && (
                  <span className="text-gray-500"> of {allStageLeads.length}</span>
                )}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{stageInfo?.description} • {selectedPipelineType.replace('_', ' ').replace('website', 'Website')}</p>
            
            {/* Stage Navigation Filter */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {STAGES.map(stage => {
                  const stageLeadCount = getLeadsByStage(stage.key).length;
                  return (
                    <button
                      key={stage.key}
                      onClick={() => setSelectedStage(stage.key)}
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                        selectedStage === stage.key
                          ? `${stage.color} ${stage.textColor}`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {stage.title} ({stageLeadCount})
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search businesses, cities, phone numbers..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Lead List */}
          <div className="bg-white rounded-lg shadow">
            <div className="grid grid-cols-1 divide-y">
              {currentStageLeads.map(lead => (
                <div key={lead.id} className="hover:bg-gray-50">
                  {/* Clean Lead Card */}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 cursor-pointer" onClick={() => openLeadSidebar(lead)}>
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                          {lead.company.name}
                        </h3>
                        <p className="text-gray-600 text-sm">{lead.company.city}, {lead.company.state}</p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-xs text-gray-400">
                          {new Date(lead.updated_at).toLocaleDateString()}
                        </div>
                        
                        {/* Stage Move Actions */}
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {/* Preview Their Site Button */}
                          {lead.company.site && (
                            <a
                              href={lead.company.site.startsWith('http') ? lead.company.site : `https://${lead.company.site}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
                              onClick={(e) => e.stopPropagation()}
                            >
                              🏠 Preview Their Site
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {currentStageLeads.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <p>No leads in this stage yet</p>
              </div>
            )}
          </div>

          {/* Lead Sidebar */}
          <LeadSidebar
            lead={selectedLead}
            isOpen={isSidebarOpen}
            onClose={closeLeadSidebar}
            onUpdateLead={handleLeadUpdate}
            onMoveStage={moveLeadToStage}
            stages={STAGES}
          />
        </div>
      </SimpleAdminLayout>
    );
  }

  // Main pipeline overview
  return (
    <UnifiedAdminLayout currentPage="pipeline">
      <Head>
        <title>Lead Pipeline - HVAC Lead Management</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Lead Pipeline</h2>
              <p className="text-gray-600">
                {selectedPipelineType === 'atlas_test_pipeline' 
                  ? '🧪 Test environment with realistic HVAC businesses' 
                  : 'HVAC contractors without existing websites'
                }
              </p>
            </div>
            
            {/* Reset Button for Test Pipeline */}
            {selectedPipelineType === 'atlas_test_pipeline' && (
              <button
                onClick={resetTestPipeline}
                disabled={sessionLoading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
              >
                {sessionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Resetting...
                  </>
                ) : (
                  <>
                    🔄 Reset Test Pipeline
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Search Bar and Controls for Overview */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search all leads..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Session Start Button (moved here) */}
            {!activeSession && (
              <button
                onClick={startSession}
                disabled={sessionLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
              >
                {sessionLoading ? 'Starting...' : '🎯 Start Session'}
              </button>
            )}
            
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Compact Session Status (only when active) */}
        {activeSession && (
          <div className="mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">
                    Session Active • {formatSessionDuration(activeSession.start_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a href="/admin/calendar" className="text-blue-600 hover:text-blue-800 text-xs">📅</a>
                  <button
                    onClick={endSession}
                    disabled={sessionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                  >
                    {sessionLoading ? 'Ending...' : 'End'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Selector */}
        <div className="mb-6">
          {/* Mobile Dropdown */}
          <div className="md:hidden mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Pipeline</label>
            <select
              value={selectedPipelineType}
              onChange={(e) => setSelectedPipelineType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="atlas_test_pipeline">🧪 Test Pipeline ({pipelineStats['atlas_test_pipeline'] || 0} leads)</option>
              <option value="no_website_alabama">Alabama - No Website ({pipelineStats['no_website_alabama'] || 0} leads)</option>
              <option value="no_website_arkansas">Arkansas - No Website ({pipelineStats['no_website_arkansas'] || 0} leads)</option>
              <option value="has_website_alabama">Alabama - Has Website ({pipelineStats['has_website_alabama'] || 0} leads)</option>
              <option value="has_website_arkansas">Arkansas - Has Website ({pipelineStats['has_website_arkansas'] || 0} leads)</option>
              <option value="broken_websites">Broken Websites ({pipelineStats['broken_websites'] || 0} leads)</option>
            </select>
          </div>
          
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-2 bg-gray-100 p-2 rounded-lg">
            {[
              { key: 'atlas_test_pipeline', label: '🧪 Test Pipeline', count: pipelineStats['atlas_test_pipeline'] || 0, color: 'bg-green-50 border-green-200 text-green-700' },
              { key: 'no_website_alabama', label: 'Alabama - No Website', count: pipelineStats['no_website_alabama'] || 0 },
              { key: 'no_website_arkansas', label: 'Arkansas - No Website', count: pipelineStats['no_website_arkansas'] || 0 },
              { key: 'has_website_alabama', label: 'Alabama - Has Website', count: pipelineStats['has_website_alabama'] || 0 },
              { key: 'has_website_arkansas', label: 'Arkansas - Has Website', count: pipelineStats['has_website_arkansas'] || 0 },
              { key: 'broken_websites', label: 'Broken Websites', count: pipelineStats['broken_websites'] || 0, color: 'bg-red-50 border-red-200 text-red-700' }
            ].map(pipeline => (
              <button
                key={pipeline.key}
                onClick={() => setSelectedPipelineType(pipeline.key)}
                className={`p-3 rounded-md font-medium transition-colors text-sm ${
                  selectedPipelineType === pipeline.key
                    ? pipeline.key === 'broken_websites'
                      ? 'bg-white text-red-600 shadow-lg border-2 border-red-500'
                      : pipeline.key === 'atlas_test_pipeline'
                        ? 'bg-white text-green-600 shadow-lg border-2 border-green-500'
                        : 'bg-white text-blue-600 shadow-lg border-2 border-blue-500'
                    : pipeline.key === 'broken_websites'
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 hover:shadow-md border border-red-200'
                      : pipeline.key === 'atlas_test_pipeline'
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 hover:shadow-md border border-green-200'
                        : 'bg-white/50 text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="font-semibold">{pipeline.label}</div>
                <div className="text-xs opacity-75">{pipeline.count} leads</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{totalLeads}</div>
              <div className="text-gray-600">Total Leads</div>
              <div className="text-sm text-gray-500">{selectedPipelineType.replace('_', ' ').replace('website', 'Website')}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{activeLeads}</div>
              <div className="text-gray-600">Active Leads</div>
              <div className="text-sm text-gray-500">In progress</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">
                {getLeadsByStage('sale_closed').length}
              </div>
              <div className="text-gray-600">Sales Closed</div>
              <div className="text-sm text-gray-500">Won deals</div>
            </div>
          </div>
        </div>

        {/* Stage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stages.map(stage => (
            <div
              key={stage.key}
              onClick={() => setSelectedStage(stage.key)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className={`${stage.color} ${stage.textColor} p-4 rounded-t-lg`}>
                <h3 className="font-semibold">{stage.title}</h3>
                <p className="text-sm opacity-90">{stage.description}</p>
              </div>
              <div className="p-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stage.count}
                </div>
                <div className="text-gray-600 text-sm">
                  {stage.count === 1 ? 'lead' : 'leads'}
                </div>
                {stage.count > 0 && (
                  <div className="mt-3">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View leads →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </UnifiedAdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const companies = await getAllCompanies(1000);
    
    // Filter for Alabama and Arkansas
    const filteredCompanies = companies
      .filter(company => company.state === 'Alabama' || company.state === 'Arkansas')
      .map((company: any) => ({
          id: company.id,
          name: company.name,
          slug: company.slug,
          city: company.city || null,
          state: company.state || null,
          phone: company.phone || null,
          email_1: company.email_1 || null,
          site: company.site || null,
          tracking_enabled: company.tracking_enabled || false,
          rating: company.rating || null,
          reviews: company.reviews || null,
          reviews_link: company.reviews_link || null,
          first_review_date: company.first_review_date || null,
          r_30: company.r_30 || null,
          r_60: company.r_60 || null,
          r_90: company.r_90 || null,
          r_365: company.r_365 || null,
          predicted_label: company.predicted_label || null,
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