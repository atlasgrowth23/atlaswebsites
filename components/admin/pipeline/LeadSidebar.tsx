import { useState, useEffect, useRef } from 'react';
import DomainManagement from '@/components/DomainManagement';

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

interface Note {
  id: string;
  content: string;
  created_at: string;
  is_private?: boolean;
}

interface LeadSidebarProps {
  lead: PipelineLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (lead: PipelineLead) => void;
  onMoveStage: (leadId: string, newStage: string, notes?: string) => void;
  stages: Array<{ key: string; title: string; color: string }>;
}


const STAGE_ACTIONS = {
  'new_lead': [
    { stage: 'voicemail_left', label: 'Left Voicemail', color: 'bg-indigo-600' },
    { stage: 'contacted', label: 'Mark Contacted', color: 'bg-green-600' }
  ],
  'voicemail_left': [
    { stage: 'contacted', label: 'Mark Contacted', color: 'bg-green-600' },
    { stage: 'not_interested', label: 'Not Interested', color: 'bg-gray-600' }
  ],
  'contacted': [
    { stage: 'appointment_scheduled', label: 'Schedule Meeting', color: 'bg-orange-600' },
    { stage: 'follow_up', label: 'Needs Follow-up', color: 'bg-yellow-600' }
  ],
  'appointment_scheduled': [
    { stage: 'sale_closed', label: 'Close Sale', color: 'bg-emerald-600' },
    { stage: 'follow_up', label: 'Reschedule', color: 'bg-yellow-600' }
  ]
};

export default function LeadSidebar({ lead, isOpen, onClose, onUpdateLead, onMoveStage, stages }: LeadSidebarProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'template' | 'sms' | 'analytics'>('overview');
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [smsMessage, setSmsMessage] = useState('');
  const [editingSnippet, setEditingSnippet] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{
    visits: Array<{
      id: string;
      time_on_site: number;
      device_type: string;
      device_model: string;
      visit_time: string;
      visit_end_time?: string;
      referrer: string;
      is_return_visitor: boolean;
    }>;
    summary: {
      total_visits: number;
      unique_visitors: number;
      return_visitors: number;
      bounce_rate: number;
      avg_time_on_site: number;
    };
  } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [showCustomizationForm, setShowCustomizationForm] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(800); // Default to 800px for better desktop experience
  const [isResizing, setIsResizing] = useState(false);
  
  // Checklist states
  const [meetingSet, setMeetingSet] = useState(false);
  const [websitePermission, setWebsitePermission] = useState(''); // '', 'yes', 'no', 'hard_no'
  const [schedulingSoftware, setSchedulingSoftware] = useState('');
  const [hasInitialContact, setHasInitialContact] = useState(false);
  
  // Enhanced notes states
  const [noteType, setNoteType] = useState('general');
  const [isPrivateNote, setIsPrivateNote] = useState(false);

  useEffect(() => {
    if (lead && isOpen) {
      // Clear all state when lead changes to prevent cross-contamination
      setNotes([]);
      setNewNote('');
      setOwnerName('');
      setOwnerEmail('');
      setCustomizations({});
      setAnalyticsData(null);
      setMeetingSet(false);
      setWebsitePermission('');
      setSchedulingSoftware('');
      setNoteType('general');
      setIsPrivateNote(false);
      
      // Then fetch new data
      fetchNotes();
      fetchCustomizations();
      fetchAnalyticsData();
      fetchOwnerName();
      // Check if lead has progressed past new_lead stage (has initial contact)
      setHasInitialContact(lead.stage !== 'new_lead');
    }
  }, [lead, isOpen]);

  useEffect(() => {
    if (activeTab === 'analytics' && lead && isOpen) {
      fetchAnalyticsData();
    }
  }, [activeTab, lead, isOpen]);

  // Detect current user (you'll need to pass this from auth context)
  const currentUser = 'Nick'; // TODO: Get from auth context - 'Nick' or 'Jared'
  const isNick = currentUser === 'Nick';

  // Generate SMS snippets
  const generateAnswerCallSnippet = () => {
    if (!lead) return '';
    const sender = isNick ? 'Nick' : 'Jared';
    return `https://atlasgrowth.ai/t/moderntrust/${lead.company.slug}\n\n${sender}\nAtlas Growth`;
  };

  const generateVoicemailSnippetPart1 = () => {
    if (!lead) return '';
    
    const ownerGreeting = ownerName.trim() ? `What's up ${ownerName}` : 'What\'s up man';
    const sender = isNick ? 'Nick' : 'Jared';
    const location = isNick ? 'from Birmingham' : 'from Little Rock';
    
    return `${ownerGreeting}, this is ${sender} with Atlas Growth ${location}. I just left you a voicemail with some details. Please feel free to text or call me at any time if you have any questions. Thank you.\n-${sender}\nAtlas Growth`;
  };

  const generateVoicemailSnippetPart2 = () => {
    if (!lead) return '';
    return `https://atlasgrowth.ai/t/moderntrust/${lead.company.slug}`;
  };

  // Auto-send SMS function
  const sendSMSSnippet = (message: string, snippetType?: string) => {
    if (!lead?.company.phone || !message.trim()) return;
    
    const phoneNumber = lead.company.phone.replace(/[^\d]/g, '');
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_self');
    
    // Auto-add SMS activity note with link tracking
    const ownerNameToUse = ownerName || 'there';
    const timestamp = new Date().toLocaleTimeString();
    const websiteUrl = `https://atlasgrowth.ai/t/moderntrust/${lead.company.slug}`;
    
    let smsNote = `💬 Sent SMS to ${ownerNameToUse} (${lead.company.name}) at ${timestamp}:\n\n${message}`;
    
    // Add link sent tracking if message contains website URL
    if (message.includes(websiteUrl)) {
      const linkType = snippetType || 'custom message';
      smsNote += `\n\n🔗 Website link sent via ${linkType} - tracking analytics for visitor activity`;
    }
    
    saveNote(smsNote);
  };

  // Don't auto-populate message anymore - just clear it
  useEffect(() => {
    if (lead) {
      setSmsMessage('');
      setEditingSnippet(false);
    }
  }, [lead, ownerName]);


  const fetchNotes = async () => {
    if (!lead) return;
    try {
      const response = await fetch(`/api/pipeline/notes?leadId=${lead.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchCustomizations = async () => {
    if (!lead) return;
    try {
      const response = await fetch(`/api/template-customizations?slug=${lead.company.slug}&template=moderntrust`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Fetched customizations data:', data);
        const customizationMap: Record<string, string> = {};
        data.forEach((custom: any) => {
          customizationMap[custom.customization_type] = custom.custom_value;
        });
        console.log('📊 Customization map:', customizationMap);
        setCustomizations(customizationMap);
      } else {
        console.error('❌ Failed to fetch customizations:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching customizations:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    if (!lead) return;
    setLoadingAnalytics(true);
    try {
      const response = await fetch(`/api/analytics/sessions?companyId=${lead.company_id}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Analytics API error:', response.status, response.statusText);
        setAnalyticsData({
          visits: [],
          summary: { total_visits: 0, unique_visitors: 0, avg_time_on_site: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData({
        visits: [],
        summary: { total_visits: 0, unique_visitors: 0, avg_time_on_site: 0 }
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchSessionData = async () => {
    if (!lead) return;
    try {
      const response = await fetch(`/api/analytics/sessions?companyId=${lead.company_id}`);
      if (response.ok) {
        const data = await response.json();
        setSessionData(data || []);
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
      setSessionData([]);
    }
  };

  const fetchOwnerName = async () => {
    if (!lead) return;
    
    try {
      const response = await fetch(`/api/pipeline/owner-name?leadId=${lead.id}`);
      if (response.ok) {
        const data = await response.json();
        setOwnerName(data.owner_name || '');
        setOwnerEmail(data.owner_email || '');
        console.log(`✅ Loaded owner info: ${data.owner_name} / ${data.owner_email} for lead: ${lead.id}`);
      }
    } catch (error) {
      console.error('Error fetching owner info:', error);
    }
  };

  const handleNoteChange = (value: string) => {
    setNewNote(value);
  };

  const saveOwnerName = async () => {
    if (!lead) return;
    
    try {
      await fetch('/api/pipeline/owner-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          owner_name: ownerName.trim()
        })
      });
      console.log(`✅ Saved owner name: ${ownerName} for lead: ${lead.id}`);
    } catch (error) {
      console.error('Error saving owner name:', error);
    }
  };

  const saveOwnerEmail = async () => {
    if (!lead || !ownerEmail.trim()) return;
    
    try {
      // Save to lead_pipeline first
      const pipelineResponse = await fetch('/api/pipeline/owner-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          owner_email: ownerEmail.trim()
        })
      });
      
      if (pipelineResponse.ok) {
        console.log(`✅ Saved owner email to pipeline: ${ownerEmail} for lead: ${lead.id}`);
        
        // Also save to tk_contacts for master record
        const contactResponse = await fetch('/api/admin/add-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: lead.company_id,
            owner_name: ownerName.trim() || null,
            owner_email: ownerEmail.trim()
          })
        });
        
        if (contactResponse.ok) {
          console.log(`✅ Saved owner email to tk_contacts: ${ownerEmail} for company: ${lead.company_id}`);
        } else {
          console.log('⚠️ Failed to save to tk_contacts, but pipeline save succeeded');
        }
      } else {
        const errorData = await pipelineResponse.json();
        console.error('❌ Failed to save owner email to pipeline:', errorData.error);
        alert(`Failed to save owner email: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving owner email:', error);
      alert('Error saving owner email. Please try again.');
    }
  };

  const saveNote = async (noteContent: string = newNote) => {
    if (!lead || !noteContent.trim()) return;

    try {
      const response = await fetch('/api/pipeline/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          content: noteContent.trim(),
          is_private: false,
          created_by: ownerName || 'Unknown'
        })
      });

      if (response.ok) {
        setNewNote('');
        fetchNotes();
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to save note:', errorData);
        alert(`Failed to save note: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error saving note:', error);
    }
  };


  const handleCall = () => {
    if (lead?.company.phone) {
      window.open(`tel:${lead.company.phone}`);
      // Auto-add call activity note
      const callNote = `📞 Called ${lead.company.name} at ${new Date().toLocaleTimeString()}`;
      saveNote(callNote);
    }
  };

  const handleEmail = () => {
    if (!lead?.company.email_1) return;
    
    const ownerNameToUse = ownerName || 'there';
    const websiteUrl = `https://yourwebsitedomain.com/t/moderntrust/${lead.company.slug}`;
    
    const subject = `Website for ${lead.company.name}`;
    const body = `Hello ${ownerNameToUse},

Thank you for taking the time to speak with me today. As discussed, I've prepared a custom website for ${lead.company.name}.

You can view it here: ${websiteUrl}

This website is fully functional and ready to help you attract more customers in ${lead.company.city}, ${lead.company.state}. 

Please take a look and let me know what you think. I'm happy to make any adjustments you'd like.

Best regards,
Jared Thompson
${lead.company.phone ? `\nCall/Text: ${lead.company.phone}` : ''}`;

    const emailUrl = `mailto:${lead.company.email_1}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
    
    const emailNote = `✉️ Sent email to ${ownerNameToUse} (${lead.company.name}) at ${new Date().toLocaleTimeString()}`;
    saveNote(emailNote);
  };

  const handleSendSMS = () => {
    if (!lead?.company.phone || !smsMessage.trim()) return;
    
    const phoneNumber = lead.company.phone.replace(/[^\d]/g, '');
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(smsMessage)}`;
    window.open(smsUrl, '_self');
    
    // Auto-add SMS activity note
    const ownerNameToUse = ownerName || 'there';
    const smsNote = `💬 Sent website SMS to ${ownerNameToUse} (${lead.company.name}) at ${new Date().toLocaleTimeString()}:\n\n${smsMessage}`;
    saveNote(smsNote);
  };

  const saveCustomizations = async () => {
    if (!lead) return;
    
    setIsSaving(true);
    try {
      console.log('🚀 Saving customizations:', { companyId: lead.company_id, customizations });
      
      // Save all customizations directly - let the API handle image processing
      const saveResponse = await fetch('/api/template-customizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: lead.company_id,
          templateKey: 'moderntrust',
          customizations: customizations
        })
      });

      const saveData = await saveResponse.json();
      console.log('📡 Save response:', { status: saveResponse.status, data: saveData });
      
      if (saveResponse.ok) {
        console.log('✅ Customizations saved successfully:', saveData);
        if (saveData.updatedFrames?.length > 0) {
          console.log('📸 Updated frames:', saveData.updatedFrames);
        }
        // Refresh customizations from server
        await fetchCustomizations();
      } else {
        console.error('❌ Failed to save customizations:', saveData.error);
      }

    } catch (error) {
      console.error('❌ Error saving customizations:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || typeof window === 'undefined') return;
      
      // Calculate width based on distance from center
      const centerX = window.innerWidth / 2;
      const distanceFromCenter = Math.abs(e.clientX - centerX);
      const newWidth = distanceFromCenter * 2; // Width = 2 * distance from center
      
      const minWidth = 320; // Minimum width
      const maxWidth = window.innerWidth * 0.9; // Max 90% of screen
      
      setSidebarWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  if (!isOpen || !lead) return null;

  const stageActions = STAGE_ACTIONS[lead.stage as keyof typeof STAGE_ACTIONS] || [];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-30"
        onClick={onClose}
      />
      
      {/* Centered Modal */}
      <div 
        className="fixed inset-0 flex items-center justify-center z-40 p-4"
      >
        <div 
          className="bg-white shadow-2xl border border-gray-200 rounded-lg h-full max-h-[90vh] transform transition-transform duration-300 ease-in-out overflow-hidden"
          style={{ 
            width: `${typeof window !== 'undefined' ? Math.min(sidebarWidth, window.innerWidth - 32) : sidebarWidth}px`, 
            maxWidth: 'calc(100vw - 2rem)' 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Resize Handle */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-ew-resize transition-colors rounded-l-lg ${
              isResizing ? 'bg-blue-500' : ''
            }`}
            onMouseDown={handleMouseDown}
            title="Drag to resize"
          />
          
          <div className="h-full ml-1 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg truncate">{lead.company.name}</h3>
            <p className="text-blue-100 text-sm">{lead.company.city}, {lead.company.state}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Width presets */}
            <div className="flex gap-1">
              <button
                onClick={() => setSidebarWidth(600)}
                className={`w-6 h-4 rounded-sm border border-blue-300 ${sidebarWidth === 600 ? 'bg-blue-300' : 'bg-blue-100'}`}
                title="Small (600px)"
              />
              <button
                onClick={() => setSidebarWidth(800)}
                className={`w-6 h-4 rounded-sm border border-blue-300 ${sidebarWidth === 800 ? 'bg-blue-300' : 'bg-blue-100'}`}
                title="Medium (800px)"
              />
              <button
                onClick={() => setSidebarWidth(1000)}
                className={`w-6 h-4 rounded-sm border border-blue-300 ${sidebarWidth === 1000 ? 'bg-blue-300' : 'bg-blue-100'}`}
                title="Large (1000px)"
              />
            </div>
            <button 
              onClick={onClose}
              className="text-blue-100 hover:text-white ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* Quick Actions Bar - Always visible */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex flex-col gap-3">
          {/* Top Row: Phone + Stage Actions */}
          <div className="flex items-center gap-2">
            {/* Phone Icon */}
            {lead.company.phone && (
              <button
                onClick={handleCall}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                title={`Call ${lead.company.phone}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            )}
            
            {/* Stage Actions */}
            {stageActions.length > 0 && (
              <>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Quick Stage Actions:</p>
                  <div className="flex gap-2 flex-wrap">
                    {stageActions.map(action => (
                      <button
                        key={action.stage}
                        onClick={() => onMoveStage(lead.id, action.stage)}
                        className={`${action.color} text-white px-3 py-1 rounded text-xs font-medium hover:opacity-90`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Bottom Row: Preview Website + View Google Reviews */}
          <div className="flex gap-2">
            {lead.company.slug && (
              <a
                href={`/t/moderntrust/${lead.company.slug}?preview=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Preview Website
              </a>
            )}
            
            {lead.company.reviews_link && (
              <a
                href={lead.company.reviews_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                View Google Reviews
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <div className="flex flex-1">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'notes', label: 'Notes', icon: '📝' },
            { key: 'sms', label: 'SMS', icon: '💬' },
            { key: 'analytics', label: 'Analytics', icon: '📈' },
            { key: 'template', label: 'Template', icon: '🎨' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 sm:py-3 px-1 sm:px-2 text-xs font-medium border-b-2 touch-manipulation ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 active:bg-gray-100'
              }`}
            >
              <span className="block text-sm">{tab.icon}</span>
              <span className="block mt-1 text-xs sm:text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="px-3 py-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 border-b-2 border-transparent"
          title="Close sidebar"
        >
          ✕
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* Business Info Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">City</div>
                <div className="text-sm font-medium">{lead.company.city}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Logo</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    lead.company.predicted_label === 'logo' ? 'bg-green-500' : 
                    lead.company.predicted_label === 'not_logo' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></span>
                  <span className="text-sm font-medium">
                    {lead.company.predicted_label === 'logo' ? 'Has Logo' : 
                     lead.company.predicted_label === 'not_logo' ? 'No Logo' : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Analytics for Phone Calls */}
            <div className="border rounded-lg p-3 bg-blue-50">
              <h4 className="font-medium text-gray-900 mb-3 text-sm">Review Analytics (For Phone Conversations)</h4>
              
              {/* Total Reviews and Rating */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-600">Total Reviews</div>
                  <div className="text-sm font-medium">{lead.company.reviews || 0}</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-600">Rating</div>
                  <div className="text-sm font-medium">
                    {lead.company.rating ? `${Number(lead.company.rating).toFixed(1)} stars` : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-600">Last 30 Days</div>
                  <div className="text-sm font-medium">{lead.company.r_30 || 0} reviews</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-600">Last 60 Days</div>
                  <div className="text-sm font-medium">{lead.company.r_60 || 0} reviews</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-600">Last 90 Days</div>
                  <div className="text-sm font-medium">{lead.company.r_90 || 0} reviews</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-600">Last Year</div>
                  <div className="text-sm font-medium">{lead.company.r_365 || 0} reviews</div>
                </div>
              </div>
              <div className="mt-3 bg-white p-2 rounded">
                <div className="text-xs text-gray-600">First Review Date</div>
                <div className="text-sm font-medium">
                  {lead.company.first_review_date 
                    ? new Date(lead.company.first_review_date).toLocaleDateString()
                    : 'No reviews yet'
                  }
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-4 space-y-4">
            {/* Owner Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  onBlur={saveOwnerName}
                  placeholder="Enter owner name for SMS/email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={saveOwnerName}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Owner Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="Enter owner email (e.g., john@icoalheating.com)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={saveOwnerEmail}
                  className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </div>

            {/* New Note Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">📝 Add Note</h4>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="general">General Note</option>
                  <option value="call">Phone Call</option>
                  <option value="email">Email Sent</option>
                  <option value="meeting">Meeting/Demo</option>
                  <option value="follow_up">Follow-up Required</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="relative">
                <textarea
                  value={newNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Type your note... (@ to mention team members)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex items-center justify-end mt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleNoteChange(newNote + '\n\n@Jared - ')}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    >
                      @Jared
                    </button>
                    <button
                      onClick={() => handleNoteChange(newNote + '\n\nFOLLOW UP: ')}
                      className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded"
                    >
                      + Follow-up
                    </button>
                  </div>
                </div>
              </div>
            </div>



            {/* Save Button */}
            <button
              onClick={() => saveNote()}
              disabled={!newNote.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-md text-sm font-medium"
            >
              💾 Save Note
            </button>


            {/* Notes History */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📚 Team Notes & Activity</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notes.map(note => {
                  const noteTypeColors = {
                    general: 'border-gray-200 bg-gray-50',
                    call: 'border-blue-200 bg-blue-50',
                    email: 'border-green-200 bg-green-50',
                    meeting: 'border-purple-200 bg-purple-50',
                    follow_up: 'border-yellow-200 bg-yellow-50',
                    urgent: 'border-red-200 bg-red-50'
                  };
                  
                  const noteTypeIcons = {
                    general: '📝',
                    call: '📞',
                    email: '✉️',
                    meeting: '🤝',
                    follow_up: '⏰',
                    urgent: '🚨'
                  };
                  
                  // Try to detect note type from content
                  let detectedType = 'general';
                  if (note.content.includes('📞') || note.content.toLowerCase().includes('called')) detectedType = 'call';
                  else if (note.content.includes('✉️') || note.content.toLowerCase().includes('email')) detectedType = 'email';
                  else if (note.content.toLowerCase().includes('follow up')) detectedType = 'follow_up';
                  else if (note.content.includes('@Jared')) detectedType = 'urgent';
                  
                  const colorClass = noteTypeColors[detectedType as keyof typeof noteTypeColors] || noteTypeColors.general;
                  const icon = noteTypeIcons[detectedType as keyof typeof noteTypeIcons] || noteTypeIcons.general;
                  
                  return (
                    <div key={note.id} className={`p-3 rounded-md border ${colorClass}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{icon}</span>
                        <div className="flex-1">
                          <div className="text-gray-900 whitespace-pre-wrap text-sm">{note.content}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleString()}
                            </div>
                            {note.content.includes('@Jared') && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                Mention
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {notes.length === 0 && (
                  <div className="text-gray-500 text-sm italic text-center py-4">No notes yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SMS Tab */}
        {activeTab === 'sms' && (
          <div className="p-3 sm:p-4 space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <h4 className="font-medium text-purple-900 mb-2 text-sm sm:text-base">💬 SMS Snippets</h4>
              <div className="text-sm text-purple-700 mb-3 break-all">
                To: {lead?.company?.phone || 'No phone number found'}
              </div>
              
              {/* Snippet Buttons */}
              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => sendSMSSnippet(generateAnswerCallSnippet(), 'Answer Call Snippet')}
                    disabled={!lead?.company?.phone}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-3 rounded-md text-sm font-medium"
                  >
                    📞 Answer Call Snippet
                  </button>
                  {isNick && (
                    <button
                      onClick={() => setEditingSnippet(true)}
                      className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-md text-sm font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => sendSMSSnippet(generateVoicemailSnippetPart1(), 'Voicemail Part 1')}
                    disabled={!lead?.company?.phone}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 px-3 rounded-md text-sm font-medium"
                  >
                    📝 Voicemail Part 1
                  </button>
                  <button
                    onClick={() => sendSMSSnippet(generateVoicemailSnippetPart2(), 'Voicemail Part 2')}
                    disabled={!lead?.company?.phone}
                    className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white py-2 px-3 rounded-md text-sm font-medium"
                  >
                    🌐 Voicemail Part 2
                  </button>
                </div>
              </div>
              
              {/* Only show message editor when in edit mode */}
              {editingSnippet && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Edit Custom Message:
                    </label>
                    <textarea
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white resize-none"
                      rows={4}
                      style={{minHeight: '100px'}}
                      placeholder="Type your custom SMS message..."
                    />
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => sendSMSSnippet(smsMessage, 'Custom Message')}
                      disabled={!lead?.company?.phone || !smsMessage.trim()}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-2 px-3 rounded-md text-sm font-medium"
                    >
                      💬 Send Custom SMS
                    </button>
                    <button
                      onClick={() => {
                        setEditingSnippet(false);
                        setSmsMessage('');
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-md text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
              
              {!editingSnippet && (
                <div className="text-xs text-gray-500 text-center mt-2">
                  Click any snippet button above to automatically open SMS with the message pre-filled
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-900">Website Activity</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/t/moderntrust/${lead.company.slug}`, '_blank')}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                >
                  🌐 View Site
                </button>
                <button
                  onClick={fetchAnalyticsData}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>
            
            {loadingAnalytics ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <div className="text-sm text-gray-500 mt-2">Loading activity...</div>
              </div>
            ) : analyticsData ? (
              <>
                {/* Clean Summary Stats */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{analyticsData.summary.total_visits || 0}</div>
                      <div className="text-xs text-gray-600">Total Visits</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{analyticsData.summary.unique_visitors || 0}</div>
                      <div className="text-xs text-gray-600">Unique Visitors</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {analyticsData.summary.avg_time_on_site ? 
                          `${Math.floor(analyticsData.summary.avg_time_on_site / 60)}:${String(analyticsData.summary.avg_time_on_site % 60).padStart(2, '0')}` : 
                          '0:00'
                        }
                      </div>
                      <div className="text-xs text-gray-600">Average Time</div>
                    </div>
                  </div>
                </div>

                {/* Visits List */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-900 text-sm">Recent Activity</h5>
                  {analyticsData.visits.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                      <div className="text-lg mb-2">📊</div>
                      <div className="text-sm">No visits yet</div>
                      <div className="text-xs text-gray-400 mt-1">Send them the website link to track activity</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {analyticsData.visits.map((visit, index) => (
                        <div key={visit.id}>
                          <div 
                            onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                            className={`border-l-4 p-3 rounded-r-lg bg-white border-gray-200 hover:shadow-sm transition-all cursor-pointer ${
                              visit.is_return_visitor ? 'border-l-blue-500 bg-blue-50' : 
                              visit.time_on_site <= 3 ? 'border-l-red-500' : 
                              visit.time_on_site > 60 ? 'border-l-green-500' : 'border-l-gray-300'
                            }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {visit.device_type === 'mobile' ? '📱' : 
                                     visit.device_type === 'tablet' ? '📊' : '💻'}
                                  </span>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{visit.device_model}</div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className={visit.time_on_site <= 3 ? 'text-red-600 font-medium' : 
                                                     visit.time_on_site > 60 ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                        {visit.time_on_site >= 60 ? 
                                          `${Math.floor(visit.time_on_site / 60)}:${String(visit.time_on_site % 60).padStart(2, '0')}` : 
                                          `0:${String(visit.time_on_site).padStart(2, '0')}`
                                        }
                                        {visit.time_on_site <= 3 && ' (Bounce)'}
                                      </span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-600">
                                        {visit.referrer === 'Direct SMS Link' ? '📱 SMS' :
                                         visit.referrer === 'Google Search' ? '🔍 Google' :
                                         visit.referrer === 'Facebook' ? '📘 Facebook' :
                                         visit.referrer === 'Internal Navigation' ? '🔗 Internal' :
                                         `📧 ${visit.referrer.slice(0, 10)}`}
                                      </span>
                                      {visit.is_return_visitor && (
                                        <>
                                          <span className="text-gray-400">•</span>
                                          <span className="text-blue-600 font-medium">↩️ Return</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right text-xs text-gray-500">
                                  <div>{new Date(visit.visit_time).toLocaleDateString('en-US', { 
                                    month: 'short', day: 'numeric' 
                                  })}</div>
                                  <div>{new Date(visit.visit_time).toLocaleTimeString([], {
                                    hour: '2-digit', minute:'2-digit'
                                  })}</div>
                                </div>
                                <span className={`text-xs transition-transform ${expandedVisit === visit.id ? 'rotate-180' : ''}`}>
                                  ▼
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded Details */}
                          {expandedVisit === visit.id && (
                            <div className="ml-4 mt-2 p-3 bg-gray-50 rounded-lg border-l-2 border-gray-300">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="font-medium text-gray-600">Session Start:</span>
                                  <div className="text-gray-900">
                                    {new Date(visit.visit_time).toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Session End:</span>
                                  <div className="text-gray-900">
                                    {visit.visit_end_time ? new Date(visit.visit_end_time).toLocaleString() : 'In progress'}
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <span className="font-medium text-gray-600">Total Time:</span>
                                  <div className="text-gray-900">
                                    {visit.time_on_site >= 60 ? 
                                      `${Math.floor(visit.time_on_site / 60)} min ${visit.time_on_site % 60} sec` : 
                                      `${visit.time_on_site} seconds`
                                    }
                                    {visit.time_on_site <= 3 && ' (Bounced - 3 seconds or less)'}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Referrer:</span>
                                  <div className="text-gray-900">{visit.referrer}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Visitor Type:</span>
                                  <div className="text-gray-900">
                                    {visit.is_return_visitor ? 'Return Visitor' : 'New Visitor'}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Device:</span>
                                  <div className="text-gray-900">{visit.device_model}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-lg mb-2">📊</div>
                <div className="text-sm">No analytics data</div>
                <div className="text-xs text-gray-400 mt-1">
                  Data will appear when leads visit their website
                </div>
              </div>
            )}
          </div>
        )}

        {/* Template Tab */}
        {activeTab === 'template' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Template Customization</h4>
              <button
                onClick={() => setShowCustomizationForm(!showCustomizationForm)}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
              >
                {showCustomizationForm ? '▼ Hide Form' : '▲ Show Form'}
              </button>
            </div>
            
            {showCustomizationForm && (
              <div className="space-y-3">
                {/* Hero Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Background Image</label>
                  <input
                    type="url"
                    placeholder="Enter hero background image URL"
                    value={customizations.hero_img || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, hero_img: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {customizations.hero_img && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 break-all">
                      <strong>Current URL:</strong> {customizations.hero_img}
                    </div>
                  )}
                </div>

                {/* About Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About Section Image</label>
                  <input
                    type="url"
                    placeholder="Enter about section image URL"
                    value={customizations.about_img || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, about_img: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {customizations.about_img && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 break-all">
                      <strong>Current URL:</strong> {customizations.about_img}
                    </div>
                  )}
                </div>

                {/* Logo URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    placeholder="Enter logo URL"
                    value={customizations.logo_url || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, logo_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    onClick={saveCustomizations}
                    disabled={isSaving}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 rounded text-sm font-medium"
                  >
                    {isSaving ? 'Saving...' : 'Save Template'}
                  </button>
                  
                  <button
                    onClick={() => window.open(`/t/moderntrust/${lead.company.slug}`, '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium"
                  >
                    🔍 Preview Website
                  </button>
                  
                  {/* Domain Management Component */}
                  <div className="w-full">
                    <DomainManagement 
                      company={lead.company}
                      onUpdate={(updatedCompany) => {
                        // Update the lead's company data
                        const updatedLead = {
                          ...lead,
                          company: updatedCompany
                        };
                        onUpdateLead(updatedLead);
                      }}
                    />
                  </div>
                  
                  {lead.company.reviews_link && (
                    <a
                      href={lead.company.reviews_link}
                      target="_blank"
                      className="block w-full bg-orange-100 hover:bg-orange-200 text-orange-700 text-center py-2 rounded text-sm font-medium"
                    >
                      View Business Photos
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Live Preview */}
            <div className={showCustomizationForm ? "border-t pt-4 mt-4" : ""}>
              <h5 className="font-medium text-gray-900 mb-2">Live Preview</h5>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={`/t/moderntrust/${lead.company.slug}?preview=true`}
                  className={`w-full border-0 ${showCustomizationForm ? 'h-64' : 'h-96'}`}
                  title="Website Preview"
                />
              </div>
              <div className="text-xs text-gray-500 text-center mt-1">
                Preview updates automatically when you save template changes
              </div>
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