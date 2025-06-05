import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import LeadSidebar from '@/components/admin/pipeline/LeadSidebar';
import { getAllCompanies } from '@/lib/supabase-db';

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
  { key: 'voicemail_left', title: 'Voicemail Left', color: 'bg-indigo-500', textColor: 'text-white', description: 'Left voicemail' },
  { key: 'contacted', title: 'Contacted', color: 'bg-green-500', textColor: 'text-white', description: 'Initial contact made' },
  { key: 'website_viewed', title: 'Website Viewed', color: 'bg-purple-500', textColor: 'text-white', description: 'Engaged with site' },
  { key: 'appointment_scheduled', title: 'Appointment Scheduled', color: 'bg-orange-500', textColor: 'text-white', description: 'Meeting set' },
  { key: 'follow_up', title: 'Follow-up', color: 'bg-yellow-500', textColor: 'text-white', description: 'Needs follow-up' },
  { key: 'sale_closed', title: 'Sale Closed', color: 'bg-emerald-600', textColor: 'text-white', description: 'Deal won' },
  { key: 'not_interested', title: 'Not Interested', color: 'bg-gray-500', textColor: 'text-white', description: 'Not a fit' }
];

export default function Pipeline({ companies }: PipelineProps) {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<'Alabama' | 'Arkansas'>('Alabama');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPipelineData();
    
    // Auto-refresh pipeline data every 30 seconds to catch auto-stage updates
    const refreshInterval = setInterval(fetchPipelineData, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchPipelineData = async () => {
    try {
      const response = await fetch('/api/pipeline/leads');
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
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
    const matchesState = lead.company.state === selectedState;
    
    if (!searchTerm) return matchesState;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      lead.company.name.toLowerCase().includes(searchLower) ||
      lead.company.city.toLowerCase().includes(searchLower) ||
      lead.company.phone?.toLowerCase().includes(searchLower) ||
      lead.notes.toLowerCase().includes(searchLower);
    
    return matchesState && matchesSearch;
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
      <AdminLayout currentPage="pipeline">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
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
        lead.company.phone?.toLowerCase().includes(searchLower) ||
        lead.notes.toLowerCase().includes(searchLower)
      );
    });
    
    return (
      <AdminLayout currentPage="pipeline">
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
            <p className="text-gray-600 mb-4">{stageInfo?.description} • {selectedState}</p>
            
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
                  {/* Simplified Lead Card */}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 cursor-pointer" onClick={() => openLeadSidebar(lead)}>
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                          {lead.company.name}
                        </h3>
                        <p className="text-gray-600 text-sm">{lead.company.city}, {lead.company.state}</p>
                        {lead.company.phone && (
                          <p className="text-gray-500 text-sm">{lead.company.phone}</p>
                        )}
                        {lead.notes && (
                          <p className="text-gray-600 text-sm mt-2 italic">"{lead.notes}"</p>
                        )}
                        
                        {/* Quick Status Indicators */}
                        <div className="flex gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            lead.company.site ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {lead.company.site ? '🌐 Has Website' : '❌ No Website'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            lead.company.predicted_label === 'logo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {lead.company.predicted_label === 'logo' ? '🎨 Has Logo' : '❌ No Logo'}
                          </span>
                          {lead.company.rating && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              ⭐ {Number(lead.company.rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-xs text-gray-400">
                          {new Date(lead.updated_at).toLocaleDateString()}
                        </div>
                        
                        {/* Professional Actions */}
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLeadSidebar(lead);
                            }}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            📋 Manage Lead
                          </button>
                          
                          <a
                            href={`/t/moderntrust/${lead.company.slug}?admin=true`}
                            target="_blank"
                            className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                          >
                            🔧 Edit Site
                          </a>
                          
                          <a
                            href={`/t/moderntrust/${lead.company.slug}`}
                            target="_blank"
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            🌐 Live Site
                          </a>
                          
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                moveLeadToStage(lead.id, e.target.value);
                              }
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            defaultValue=""
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Move to...</option>
                            {STAGES.filter(s => s.key !== selectedStage).map(stage => (
                              <option key={stage.key} value={stage.key}>{stage.title}</option>
                            ))}
                          </select>
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
      </AdminLayout>
    );
  }

  // Main pipeline overview
  return (
    <AdminLayout currentPage="pipeline">
      <Head>
        <title>Lead Pipeline - HVAC Lead Management</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Lead Pipeline</h2>
          <p className="text-gray-600">HVAC contractors without existing websites</p>
          
          {/* Search Bar for Overview */}
          <div className="mt-4 flex gap-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search all leads..."
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

        {/* State Toggle */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setSelectedState('Alabama')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedState === 'Alabama'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Alabama
            </button>
            <button
              onClick={() => setSelectedState('Arkansas')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedState === 'Arkansas'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Arkansas
            </button>
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{totalLeads}</div>
              <div className="text-gray-600">Total Leads</div>
              <div className="text-sm text-gray-500">{selectedState}</div>
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
      
    </AdminLayout>
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