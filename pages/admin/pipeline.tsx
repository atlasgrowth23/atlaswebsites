import { useState, useEffect, useCallback, useRef } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import DomainManagement from '@/components/DomainManagement';
import SimpleBusinessModal from '@/components/admin/pipeline/SimpleBusinessModal';
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
  const [stageLeads, setStageLeads] = useState<PipelineLead[]>([]);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'template' | 'tracking' | 'notes' | 'business-details' | 'business-info' | 'call-notes' | 'template-editor' | null>(null);
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});
  const [trackingData, setTrackingData] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const fetchStageLeads = async (stage: string) => {
    const filtered = leads.filter(lead => 
      lead.stage === stage && lead.company.state === selectedState
    );
    setStageLeads(filtered);
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
        if (selectedStage) {
          await fetchStageLeads(selectedStage);
        }
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

  const handleCustomizationChange = (companyId: string, field: string, value: string) => {
    setCustomizations(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [field]: value
      }
    }));
  };

  const saveCustomizations = async (lead: PipelineLead) => {
    setSaving(prev => ({ ...prev, [lead.company_id]: true }));
    setSaveStatus(prev => ({ ...prev, [lead.company_id]: 'Saving...' }));
    
    try {
      const companyCustomizations = customizations[lead.company_id] || {};
      const fieldsToSave: any = {};
      
      if (companyCustomizations.hero_img?.trim()) {
        fieldsToSave.hero_img = companyCustomizations.hero_img.trim();
      }
      if (companyCustomizations.hero_img_2?.trim()) {
        fieldsToSave.hero_img_2 = companyCustomizations.hero_img_2.trim();
      }
      if (companyCustomizations.about_img?.trim()) {
        fieldsToSave.about_img = companyCustomizations.about_img.trim();
      }
      if (companyCustomizations.logo_url?.trim()) {
        fieldsToSave.logo_url = companyCustomizations.logo_url.trim();
      }

      if (Object.keys(fieldsToSave).length > 0) {
        const response = await fetch('/api/template-customizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: lead.company_id,
            customizations: fieldsToSave
          })
        });

        if (response.ok) {
          setSaveStatus(prev => ({ ...prev, [lead.company_id]: '✅ Saved!' }));
          setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, [lead.company_id]: '' }));
            setCustomizations(prev => ({ ...prev, [lead.company_id]: {} }));
          }, 2000);
        } else {
          setSaveStatus(prev => ({ ...prev, [lead.company_id]: '❌ Error saving' }));
        }
      } else {
        setSaveStatus(prev => ({ ...prev, [lead.company_id]: '⚠️ No changes to save' }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [lead.company_id]: '' }));
        }, 2000);
      }
    } catch (error) {
      setSaveStatus(prev => ({ ...prev, [lead.company_id]: '❌ Save failed' }));
    } finally {
      setSaving(prev => ({ ...prev, [lead.company_id]: false }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [lead.company_id]: '' }));
      }, 3000);
    }
  };

  const toggleTracking = async (lead: PipelineLead, currentStatus: boolean, isPaused: boolean = false) => {
    try {
      let newStatus;
      let pausedStatus;
      
      if (currentStatus && !isPaused) {
        newStatus = true;
        pausedStatus = true;
      } else if (currentStatus && isPaused) {
        newStatus = true;
        pausedStatus = false;
      } else {
        newStatus = true;
        pausedStatus = false;
      }

      const response = await fetch('/api/toggle-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessId: lead.company_id, 
          enabled: newStatus,
          paused: pausedStatus
        })
      });
      
      if (response.ok) {
        if (newStatus && !pausedStatus) {
          await fetchTrackingData(lead.company_id);
        }
        await fetchPipelineData();
        if (selectedStage) {
          await fetchStageLeads(selectedStage);
        }
      }
    } catch (error) {
      console.error('Error updating tracking status:', error);
    }
  };

  const fetchTrackingData = async (companyId: string) => {
    try {
      const [viewsRes, analyticsRes] = await Promise.all([
        fetch(`/api/template-views?companyId=${companyId}`),
        fetch(`/api/analytics-summary?companyId=${companyId}`)
      ]);
      
      let trackingData = {
        total_views: 0,
        total_sessions: 0,
        avg_time_seconds: 0,
        last_viewed_at: null,
        device_breakdown: { desktop: 0, mobile: 0, tablet: 0 },
        recent_sessions: []
      };

      if (viewsRes.ok) {
        const viewsData = await viewsRes.json();
        trackingData.total_views = viewsData.total_views || 0;
        trackingData.total_sessions = viewsData.unique_sessions || 0;
        trackingData.last_viewed_at = viewsData.last_viewed_at;
        trackingData.recent_sessions = viewsData.views || [];
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        trackingData.avg_time_seconds = analyticsData.avg_time_seconds || 0;
        trackingData.device_breakdown = analyticsData.device_breakdown || trackingData.device_breakdown;
      }
      
      setTrackingData(prev => ({
        ...prev,
        [companyId]: trackingData
      }));
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setTrackingData(prev => ({
        ...prev,
        [companyId]: {
          total_views: 0,
          total_sessions: 0,
          avg_time_seconds: 0,
          last_viewed_at: null,
          device_breakdown: { desktop: 0, mobile: 0, tablet: 0 },
          recent_sessions: []
        }
      }));
    }
  };

  const getCurrentImageUrl = (lead: PipelineLead, field: string): string => {
    // This would need to be enhanced to get actual company_frames data
    return '';
  };

  const openBusinessModal = (lead: PipelineLead) => {
    console.log('Opening modal for lead:', lead.company.name);
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const closeBusinessModal = () => {
    setSelectedLead(null);
    setIsModalOpen(false);
  };

  const handleLeadUpdate = (updatedLead: PipelineLead) => {
    // Update lead in the local state
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      )
    );
    
    // Update stage leads if we're viewing a specific stage
    if (selectedStage) {
      setStageLeads(prevStageLeads =>
        prevStageLeads.map(lead =>
          lead.id === updatedLead.id ? updatedLead : lead
        )
      );
    }
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
                  {/* Main Lead Card */}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 
                          className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => {
                            if (expandedLead === lead.id) {
                              setExpandedLead(null);
                              setActiveSection(null);
                            } else {
                              setExpandedLead(lead.id);
                              setActiveSection('business-info');
                            }
                          }}
                        >
                          {lead.company.name}
                        </h3>
                        <p className="text-gray-600 text-sm">{lead.company.city}, {lead.company.state}</p>
                        {lead.company.phone && (
                          <p className="text-gray-500 text-sm">{lead.company.phone}</p>
                        )}
                        {lead.notes && (
                          <p className="text-gray-600 text-sm mt-2 italic">"{lead.notes}"</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-xs text-gray-400">
                          {new Date(lead.updated_at).toLocaleDateString()}
                        </div>
                        
                        {/* Stage Actions */}
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {selectedStage === 'new_lead' && (
                            <>
                              <button
                                onClick={() => moveLeadToStage(lead.id, 'voicemail_left')}
                                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                              >
                                Voicemail Left
                              </button>
                              <button
                                onClick={() => moveLeadToStage(lead.id, 'contacted')}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                              >
                                Mark Contacted
                              </button>
                            </>
                          )}
                          
                          {selectedStage === 'voicemail_left' && (
                            <button
                              onClick={() => moveLeadToStage(lead.id, 'contacted')}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Mark Contacted
                            </button>
                          )}
                          
                          <a
                            href={`/t/moderntrust/${lead.company.slug}?admin=true`}
                            target="_blank"
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            View Site
                          </a>
                          
                          <a
                            href={`/t/moderntrust/${lead.company.slug}?preview=true`}
                            target="_blank"
                            className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                          >
                            Preview Site
                          </a>
                          
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                moveLeadToStage(lead.id, e.target.value);
                              }
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            defaultValue=""
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

                  {/* Expandable Sections */}
                  {expandedLead === lead.id && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {/* Section Tabs */}
                      <div className="flex border-b border-gray-200 bg-white">
                        <button
                          onClick={() => setActiveSection('business-info')}
                          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeSection === 'business-info'
                              ? 'border-blue-500 text-blue-600 bg-blue-50'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          📋 Business Details
                        </button>
                        <button
                          onClick={() => setActiveSection('call-notes')}
                          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeSection === 'call-notes'
                              ? 'border-green-500 text-green-600 bg-green-50'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          📞 Call Notes
                        </button>
                        <button
                          onClick={() => setActiveSection('template-editor')}
                          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeSection === 'template-editor'
                              ? 'border-purple-500 text-purple-600 bg-purple-50'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          🎨 Template Editor
                        </button>
                      </div>
                      
                      {/* Business Info Section */}
                      {activeSection === 'business-info' && (
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900 mb-4">📊 Business Overview</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Website Status */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h5 className="font-medium text-gray-800 mb-2">🌐 Website</h5>
                              <div className="flex items-center gap-2">
                                {lead.company.site ? (
                                  <>
                                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                    <span className="text-sm text-green-700">Has Website</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                    <span className="text-sm text-red-700">No Website</span>
                                  </>
                                )}
                              </div>
                              {lead.company.site && (
                                <a 
                                  href={lead.company.site} 
                                  target="_blank" 
                                  className="text-xs text-blue-600 hover:underline block mt-1 truncate"
                                >
                                  {lead.company.site}
                                </a>
                              )}
                            </div>

                            {/* Logo Status */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h5 className="font-medium text-gray-800 mb-2">🎨 Logo</h5>
                              <div className="flex items-center gap-2">
                                {lead.company.predicted_label === 'logo' ? (
                                  <>
                                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                    <span className="text-sm text-green-700">Has Logo</span>
                                  </>
                                ) : lead.company.predicted_label === 'not_logo' ? (
                                  <>
                                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                    <span className="text-sm text-red-700">No Logo</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                                    <span className="text-sm text-yellow-700">Unknown ({lead.company.predicted_label || 'null'})</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Reviews Rating */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h5 className="font-medium text-gray-800 mb-2">⭐ Reviews</h5>
                              <div className="text-sm text-gray-600">
                                <div>Rating: <span className="font-medium">{lead.company.rating ? Number(lead.company.rating).toFixed(1) : 'N/A'}</span></div>
                                <div>Count: <span className="font-medium">{lead.company.reviews || 'N/A'}</span></div>
                              </div>
                            </div>

                            {/* Reviews Link */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h5 className="font-medium text-gray-800 mb-2">🔗 Reviews Link</h5>
                              <div className="text-sm text-gray-600">
                                {lead.company.reviews_link ? (
                                  <a 
                                    href={lead.company.reviews_link} 
                                    target="_blank" 
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    View Reviews
                                  </a>
                                ) : (
                                  <span>Not Available</span>
                                )}
                              </div>
                            </div>

                            {/* City */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h5 className="font-medium text-gray-800 mb-2">📍 Location</h5>
                              <div className="text-sm text-gray-900 font-medium">
                                {lead.company.city}, {lead.company.state}
                              </div>
                            </div>

                            {/* Review Timeline Data */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h5 className="font-medium text-gray-800 mb-2">📈 Review Timeline</h5>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div>30-day: <span className="font-medium">{lead.company.r_30 || 0}</span></div>
                                <div>60-day: <span className="font-medium">{lead.company.r_60 || 0}</span></div>
                                <div>90-day: <span className="font-medium">{lead.company.r_90 || 0}</span></div>
                                <div>365-day: <span className="font-medium">{lead.company.r_365 || 0}</span></div>
                              </div>
                            </div>

                            {/* First Review Date */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h5 className="font-medium text-gray-800 mb-2">📅 First Review</h5>
                              <div className="text-sm text-gray-600">
                                <span>{lead.company.first_review_date ? new Date(lead.company.first_review_date).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h5 className="font-medium text-gray-800 mb-2">📞 Contact</h5>
                              <div className="text-xs text-gray-600 space-y-1">
                                {lead.company.phone && (
                                  <div>Phone: <span className="font-medium">{lead.company.phone}</span></div>
                                )}
                                {lead.company.email_1 && (
                                  <div>Email: <span className="font-medium">{lead.company.email_1}</span></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Template Section (Legacy) */}
                      {activeSection === 'template' && (
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900 mb-4">Template Customization</h4>
                          
                          <div className="space-y-4">
                            {/* Hero Image 1 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hero Background Image 1
                              </label>
                              <input
                                type="url"
                                placeholder={getCurrentImageUrl(lead, 'hero_img') || "https://images.unsplash.com/photo-..."}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                value={customizations[lead.company_id]?.hero_img || ''}
                                onChange={(e) => handleCustomizationChange(lead.company_id, 'hero_img', e.target.value)}
                              />
                            </div>

                            {/* Hero Image 2 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hero Background Image 2 (Slideshow)
                              </label>
                              <input
                                type="url"
                                placeholder={getCurrentImageUrl(lead, 'hero_img_2') || "https://images.unsplash.com/photo-..."}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                value={customizations[lead.company_id]?.hero_img_2 || ''}
                                onChange={(e) => handleCustomizationChange(lead.company_id, 'hero_img_2', e.target.value)}
                              />
                            </div>

                            {/* About Image */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                About Section Image
                              </label>
                              <input
                                type="url"
                                placeholder={getCurrentImageUrl(lead, 'about_img') || "https://images.unsplash.com/photo-..."}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                value={customizations[lead.company_id]?.about_img || ''}
                                onChange={(e) => handleCustomizationChange(lead.company_id, 'about_img', e.target.value)}
                              />
                            </div>

                            {/* Logo URL */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Logo URL
                              </label>
                              <input
                                type="url"
                                placeholder={getCurrentImageUrl(lead, 'logo_url') || "https://logo-url.com/logo.svg"}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                value={customizations[lead.company_id]?.logo_url || ''}
                                onChange={(e) => handleCustomizationChange(lead.company_id, 'logo_url', e.target.value)}
                              />
                            </div>

                            {/* Save Status */}
                            {saveStatus[lead.company_id] && (
                              <div className={`p-3 rounded-md text-sm ${
                                saveStatus[lead.company_id].includes('✅') ? 'bg-green-50 text-green-800' :
                                saveStatus[lead.company_id].includes('❌') ? 'bg-red-50 text-red-800' :
                                saveStatus[lead.company_id].includes('⚠️') ? 'bg-yellow-50 text-yellow-800' :
                                'bg-blue-50 text-blue-800'
                              }`}>
                                {saveStatus[lead.company_id]}
                              </div>
                            )}

                            {/* Save Button */}
                            <button
                              onClick={() => saveCustomizations(lead)}
                              disabled={saving[lead.company_id]}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                              {saving[lead.company_id] ? 'Saving...' : '💾 Save Template Changes'}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Template Editor Section */}
                      {activeSection === 'template-editor' && (
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-gray-900">🎨 Template Customization</h4>
                            <a
                              href={`/t/moderntrust/${lead.company.slug}?preview=true`}
                              target="_blank"
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                              Preview Site
                            </a>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Hero Image 1 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hero Background Image 1
                              </label>
                              <input
                                type="url"
                                placeholder={getCurrentImageUrl(lead, 'hero_img') || "https://images.unsplash.com/photo-..."}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                value={customizations[lead.company_id]?.hero_img || ''}
                                onChange={(e) => handleCustomizationChange(lead.company_id, 'hero_img', e.target.value)}
                              />
                            </div>

                            {/* Hero Image 2 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hero Background Image 2 (Slideshow)
                              </label>
                              <input
                                type="url"
                                placeholder={getCurrentImageUrl(lead, 'hero_img_2') || "https://images.unsplash.com/photo-..."}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                value={customizations[lead.company_id]?.hero_img_2 || ''}
                                onChange={(e) => handleCustomizationChange(lead.company_id, 'hero_img_2', e.target.value)}
                              />
                            </div>

                            {/* About Image */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                About Section Image
                              </label>
                              <input
                                type="url"
                                placeholder={getCurrentImageUrl(lead, 'about_img') || "https://images.unsplash.com/photo-..."}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                value={customizations[lead.company_id]?.about_img || ''}
                                onChange={(e) => handleCustomizationChange(lead.company_id, 'about_img', e.target.value)}
                              />
                            </div>

                            {/* Logo URL */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Logo URL
                              </label>
                              <input
                                type="url"
                                placeholder={getCurrentImageUrl(lead, 'logo_url') || "https://logo-url.com/logo.svg"}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                value={customizations[lead.company_id]?.logo_url || ''}
                                onChange={(e) => handleCustomizationChange(lead.company_id, 'logo_url', e.target.value)}
                              />
                            </div>

                            {/* Save Status */}
                            {saveStatus[lead.company_id] && (
                              <div className={`p-3 rounded-md text-sm ${
                                saveStatus[lead.company_id].includes('✅') ? 'bg-green-50 text-green-800' :
                                saveStatus[lead.company_id].includes('❌') ? 'bg-red-50 text-red-800' :
                                saveStatus[lead.company_id].includes('⚠️') ? 'bg-yellow-50 text-yellow-800' :
                                'bg-blue-50 text-blue-800'
                              }`}>
                                {saveStatus[lead.company_id]}
                              </div>
                            )}

                            {/* Save Button */}
                            <button
                              onClick={() => saveCustomizations(lead)}
                              disabled={saving[lead.company_id]}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                              {saving[lead.company_id] ? 'Saving...' : '💾 Save Template Changes'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tracking Section */}
                      {activeSection === 'tracking' && (
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900 mb-4">Website Tracking</h4>
                          
                          {/* Tracking Info */}
                          <div className="mb-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-green-800 font-medium">Tracking Always Active</span>
                              </div>
                              <p className="text-green-700 text-sm mt-1">
                                Website analytics are automatically collected for all visits
                              </p>
                            </div>
                          </div>

                          {/* Tracking Stats */}
                          {trackingData[lead.company_id] && (
                            <div className="space-y-4">
                              <div className="bg-blue-50 p-4 rounded-md">
                                <h5 className="font-medium text-gray-900 mb-3">Quick Stats</h5>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div className="bg-white p-3 rounded text-center">
                                    <div className="text-xl font-bold text-blue-600">
                                      {trackingData[lead.company_id].total_views}
                                    </div>
                                    <div className="text-gray-600">Views</div>
                                  </div>
                                  <div className="bg-white p-3 rounded text-center">
                                    <div className="text-xl font-bold text-green-600">
                                      {trackingData[lead.company_id].total_sessions}
                                    </div>
                                    <div className="text-gray-600">Sessions</div>
                                  </div>
                                  <div className="bg-white p-3 rounded text-center">
                                    <div className="text-xl font-bold text-purple-600">
                                      {Math.round(trackingData[lead.company_id].avg_time_seconds)}s
                                    </div>
                                    <div className="text-gray-600">Avg Time</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {!trackingData[lead.company_id] && (
                            <div className="text-center py-8 text-gray-500">
                              <p>No tracking data available yet</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes Section */}
                      {activeSection === 'notes' && (
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900 mb-4">Call Notes & Follow-up</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                              </label>
                              <textarea
                                id={`notes-${lead.id}`}
                                rows={4}
                                placeholder="Add call notes, follow-up reminders, or other details..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                defaultValue={lead.notes || ''}
                              />
                              <button
                                onClick={async () => {
                                  const textarea = document.getElementById(`notes-${lead.id}`) as HTMLTextAreaElement;
                                  const newNotes = textarea.value;
                                  await moveLeadToStage(lead.id, lead.stage, newNotes);
                                }}
                                className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                Save Notes
                              </button>
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              Last updated: {new Date(lead.updated_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Call Notes Section */}
                      {activeSection === 'call-notes' && (
                        <div className="p-4 bg-blue-50">
                          <h4 className="font-medium text-gray-900 mb-4">📞 Call Notes & Actions</h4>
                          
                          <div className="space-y-4">
                            {/* Quick Actions */}
                            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
                              <a
                                href={`tel:${lead.company.phone}`}
                                className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
                              >
                                📞 Call
                              </a>
                              <a
                                href={`mailto:${lead.company.email_1}`}
                                className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
                              >
                                ✉️ Email
                              </a>
                              <button 
                                onClick={() => {
                                  const ownerNameInput = document.getElementById(`owner-name-${lead.id}`) as HTMLInputElement;
                                  const ownerName = ownerNameInput?.value?.trim();
                                  
                                  if (!ownerName) {
                                    alert('Owner name required');
                                    ownerNameInput?.focus();
                                    return;
                                  }
                                  
                                  const websiteUrl = `https://yourwebsitedomain.com/t/moderntrust/${lead.company.slug}`;
                                  const message = `Hey ${ownerName},

Thank you for giving me a few minutes of your valuable time. Here is the website we talked about: ${websiteUrl}

This is my personal cell phone. Please call or text me anytime if you have any questions.

Thank you,
Jared Thompson`;
                                  
                                  // Open Messages app directly with phone number and message
                                  const phoneNumber = lead.company.phone?.replace(/[^\d]/g, '') || '';
                                  if (phoneNumber) {
                                    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
                                    window.open(smsUrl, '_self');
                                  } else {
                                    alert('No phone number available for this company');
                                  }
                                }}
                                className="bg-purple-600 text-white px-3 py-1 text-sm rounded hover:bg-purple-700"
                              >
                                💬 Text
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Owner Name
                                </label>
                                <input
                                  id={`owner-name-${lead.id}`}
                                  type="text"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Enter owner name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Interest Level
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                                  <option>Select...</option>
                                  <option>⭐ 1 - Very Low</option>
                                  <option>⭐⭐ 2 - Low</option>
                                  <option>⭐⭐⭐ 3 - Medium</option>
                                  <option>⭐⭐⭐⭐ 4 - High</option>
                                  <option>⭐⭐⭐⭐⭐ 5 - Very High</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Software Used
                              </label>
                              <div className="space-y-2">
                                <select 
                                  id={`software-${lead.id}`}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  onChange={(e) => {
                                    const otherInput = document.getElementById(`software-other-${lead.id}`) as HTMLInputElement;
                                    if (e.target.value === 'Other') {
                                      otherInput.style.display = 'block';
                                      otherInput.focus();
                                    } else {
                                      otherInput.style.display = 'none';
                                    }
                                  }}
                                >
                                  <option>Select...</option>
                                  <option>Service Titan</option>
                                  <option>Jobber</option>
                                  <option>FieldEdge</option>
                                  <option>Housecall Pro</option>
                                  <option>CallRail</option>
                                  <option>ServiceM8</option>
                                  <option>None</option>
                                  <option>Other</option>
                                </select>
                                <input
                                  id={`software-other-${lead.id}`}
                                  type="text"
                                  placeholder="Please specify..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  style={{ display: 'none' }}
                                />
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">📞 Call Notes</h5>
                              
                              {/* Add New Note */}
                              <div className="mb-3">
                                <textarea
                                  id={`new-note-${lead.id}`}
                                  rows={2}
                                  placeholder="Add a new note..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                                <button
                                  onClick={() => {
                                    const textarea = document.getElementById(`new-note-${lead.id}`) as HTMLTextAreaElement;
                                    if (textarea.value.trim()) {
                                      // Add note to the list
                                      const notesList = document.getElementById(`notes-list-${lead.id}`);
                                      const newNote = document.createElement('div');
                                      newNote.className = 'p-2 bg-gray-100 rounded text-sm mb-2';
                                      newNote.innerHTML = `
                                        <div class="flex justify-between items-start">
                                          <div class="flex-1">${textarea.value}</div>
                                          <button onclick="this.parentElement.parentElement.remove()" class="text-red-500 hover:text-red-700 ml-2">×</button>
                                        </div>
                                        <div class="text-xs text-gray-500 mt-1">${new Date().toLocaleString()}</div>
                                      `;
                                      notesList?.appendChild(newNote);
                                      textarea.value = '';
                                    }
                                  }}
                                  className="mt-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Add Note
                                </button>
                              </div>

                              {/* Notes List */}
                              <div id={`notes-list-${lead.id}`} className="space-y-2 max-h-32 overflow-y-auto">
                                {lead.notes && (
                                  <div className="p-2 bg-gray-100 rounded text-sm">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">{lead.notes}</div>
                                      <button 
                                        onClick={(e) => (e.target as HTMLElement).closest('.p-2')?.remove()}
                                        className="text-red-500 hover:text-red-700 ml-2"
                                      >×</button>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Existing note</div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm">
                              💾 Save Changes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {currentStageLeads.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <p>No leads in this stage yet</p>
              </div>
            )}
          </div>
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