import { useState, useEffect } from 'react';
import AdminV2Layout from '@/components/AdminV2Layout';
import Head from 'next/head';

interface Campaign {
  id: number;
  name: string;
  business_type: string;
  region: string;
  status: string;
}

interface PipelineStage {
  id: number;
  name: string;
  slug: string;
  order_index: number;
  color: string;
  lead_count: number;
}

interface Lead {
  id: number;
  business_name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  current_stage_name: string;
  priority: string;
  status: string;
  created_at: string;
  sms_sent_count: number;
  link_clicks: number;
  video_completed: boolean;
}

export default function PipelineV2() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadPipelineData();
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/admin-v2/campaigns');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
        if (data.campaigns.length > 0) {
          setSelectedCampaign(data.campaigns[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadPipelineData = async () => {
    if (!selectedCampaign) return;
    
    try {
      setLoading(true);
      const [stagesRes, leadsRes] = await Promise.all([
        fetch(`/api/admin-v2/pipeline/stages?campaign_id=${selectedCampaign}`),
        fetch(`/api/admin-v2/pipeline/leads?campaign_id=${selectedCampaign}`)
      ]);
      
      const [stagesData, leadsData] = await Promise.all([
        stagesRes.json(),
        leadsRes.json()
      ]);
      
      if (stagesData.success) setStages(stagesData.stages);
      if (leadsData.success) setLeads(leadsData.leads);
    } catch (error) {
      console.error('Error loading pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign);

  return (
    <>
      <Head>
        <title>Pipeline v2 - Admin</title>
      </Head>
      
      <AdminV2Layout currentPage="pipeline">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pipeline v2</h1>
                <p className="text-gray-600 mt-1">
                  Clean, scalable outreach pipeline management
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Campaign Selector */}
                <select
                  value={selectedCampaign || ''}
                  onChange={(e) => setSelectedCampaign(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
                
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Add Lead
                </button>
              </div>
            </div>
            
            {selectedCampaignData && (
              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
                <span>📍 {selectedCampaignData.region}</span>
                <span>🏢 {selectedCampaignData.business_type}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedCampaignData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedCampaignData.status}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Pipeline Stats */}
              <div className="grid grid-cols-4 gap-4">
                {stages.map(stage => (
                  <div key={stage.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: stage.color }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">{stage.name}</h3>
                      <span className="text-2xl font-bold" style={{ color: stage.color }}>
                        {stage.lead_count || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pipeline Stages */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200">
                  {stages.map(stage => (
                    <div key={stage.id} className="flex-1 p-4 border-r border-gray-200 last:border-r-0">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{stage.name}</h3>
                        <span 
                          className="text-xs px-2 py-1 rounded-full text-white font-medium"
                          style={{ backgroundColor: stage.color }}
                        >
                          {leads.filter(lead => lead.current_stage_name === stage.name).length}
                        </span>
                      </div>
                      
                      {/* Leads in this stage */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {leads
                          .filter(lead => lead.current_stage_name === stage.name)
                          .map(lead => (
                            <LeadCard 
                              key={lead.id} 
                              lead={lead} 
                              stage={stage}
                              onClick={() => setSelectedLead(lead)}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Lead Detail Modal */}
        {selectedLead && (
          <LeadDetailModal 
            lead={selectedLead} 
            onClose={() => setSelectedLead(null)}
            onUpdate={loadPipelineData}
          />
        )}
      </AdminV2Layout>
    </>
  );
}

function LeadCard({ lead, stage, onClick }: { lead: Lead; stage: PipelineStage; onClick: () => void }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'normal': return 'text-gray-600';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-gray-50 p-3 rounded border hover:bg-gray-100 cursor-pointer transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-medium text-sm text-gray-900 truncate">
          {lead.business_name}
        </h4>
        <span className={`text-xs ${getPriorityColor(lead.priority)}`}>
          {lead.priority}
        </span>
      </div>
      
      <p className="text-xs text-gray-600 mb-2">
        {lead.city}, {lead.state}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>📱 {lead.sms_sent_count}</span>
        <span>👆 {lead.link_clicks}</span>
        <span>{lead.video_completed ? '✅' : '⏳'}</span>
      </div>
    </div>
  );
}

function LeadDetailModal({ lead, onClose, onUpdate }: { lead: Lead; onClose: () => void; onUpdate: () => void }) {
  const [smsMessage, setSmsMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    // Get current user for SMS tracking
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
        }
      });

    // Set default SMS message
    setSmsMessage(`Hi ${lead.business_name}! I'm John and I created a website for you. I recorded a quick walkthrough - check it out:`);
    
    // Generate preview URL - use the same URL as backend
    const baseUrl = 'https://ecff9f9a-4730-4865-9bc1-4171f6a31017-00-27datk18aao4y.picard.replit.dev';
    const { createBusinessSlug } = require('@/lib/slug-utils');
    const businessSlug = createBusinessSlug(lead.business_name);
    const landingUrl = `${baseUrl}/pipeline-v2/${businessSlug}?ref=preview`;
    setPreviewUrl(landingUrl);
  }, [lead.business_name]);

  const handleSendSMS = async () => {
    if (!smsMessage.trim() || !user) return;

    setSending(true);
    try {
      const response = await fetch('/api/admin-v2/pipeline/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: lead.id,
          message_text: smsMessage.trim(),
          sent_by: user.email
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ SMS sent successfully! Lead moved to "SMS Sent" stage.');
        onUpdate(); // Refresh the pipeline
        onClose(); // Close modal
      } else {
        alert('❌ Failed to send SMS: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('❌ Error sending SMS. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{lead.business_name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Lead Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="text-sm text-gray-900">{lead.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-sm text-gray-900">{lead.email || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <p className="text-sm text-gray-900">{lead.city}, {lead.state}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stage</label>
              <p className="text-sm text-gray-900">{lead.current_stage_name}</p>
            </div>
          </div>
          
          {/* Engagement Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{lead.sms_sent_count}</div>
              <div className="text-xs text-blue-600">SMS Sent</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{lead.link_clicks}</div>
              <div className="text-xs text-purple-600">Link Clicks</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{lead.video_completed ? 'Yes' : 'No'}</div>
              <div className="text-xs text-green-600">Video Completed</div>
            </div>
          </div>
          
          {/* SMS Composer */}
          {lead.current_stage_name === 'New Lead' && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Send SMS</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Message to {lead.phone}:
                  </label>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Customize your message..."
                    disabled={sending}
                  />
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    <div>{smsMessage.length}/160 characters</div>
                    <div className="bg-gray-100 p-2 rounded text-xs">
                      <strong>Full message preview:</strong><br/>
                      {smsMessage.trim()} {previewUrl}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleSendSMS}
                  disabled={sending || !smsMessage.trim()}
                  className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    sending || !smsMessage.trim()
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {sending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending SMS...
                    </div>
                  ) : (
                    'Send SMS & Move to "SMS Sent"'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Other Stage Actions */}
          {lead.current_stage_name === 'SMS Sent' && (
            <div className="border-t pt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">⏳ Waiting for Response</h3>
                <p className="text-xs text-yellow-700">
                  SMS has been sent. Lead will automatically move to "Link Clicked" when they visit the landing page.
                </p>
              </div>
            </div>
          )}

          {lead.current_stage_name !== 'New Lead' && lead.current_stage_name !== 'SMS Sent' && (
            <div className="border-t pt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800 mb-2">✅ {lead.current_stage_name}</h3>
                <p className="text-xs text-green-700">
                  Lead is progressing through the pipeline. Check activities for detailed tracking.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}