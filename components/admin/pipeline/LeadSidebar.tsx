import { useState, useEffect } from 'react';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'template' | 'sms'>('overview');
  const [smsMessage, setSmsMessage] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{
    total_views: number;
    total_sessions: number;
    avg_time_seconds: number;
    mobile_percentage: number;
  } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showCustomizationForm, setShowCustomizationForm] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(384); // 96 * 4 = 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);
  
  // Checklist states
  const [meetingSet, setMeetingSet] = useState(false);
  const [websitePermission, setWebsitePermission] = useState(''); // '', 'yes', 'no', 'hard_no'
  const [schedulingSoftware, setSchedulingSoftware] = useState('');
  const [hasInitialContact, setHasInitialContact] = useState(false);

  useEffect(() => {
    if (lead && isOpen) {
      fetchNotes();
      fetchCustomizations();
      fetchAnalytics();
      // Try to extract owner name from existing notes
      extractOwnerName();
      // Check if lead has progressed past new_lead stage (has initial contact)
      setHasInitialContact(lead.stage !== 'new_lead');
    }
  }, [lead, isOpen]);

  // Update SMS message when owner name changes
  useEffect(() => {
    if (lead) {
      const defaultMessage = `Hey ${ownerName || 'there'},\n\nHere's the website preview we talked about: https://atlasgrowth.ai/t/moderntrust/${lead.company.slug}\n\nThis is my personal cell phone. Please call or text me anytime if you have any questions.\n\nThank you,\nJared Thompson`;
      setSmsMessage(defaultMessage);
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

  const fetchAnalytics = async () => {
    if (!lead) return;
    setLoadingAnalytics(true);
    try {
      const response = await fetch(`/api/analytics-summary?companyId=${lead.company_id}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData({
          total_views: data.total_views || 0,
          total_sessions: data.total_sessions || 0,
          avg_time_seconds: data.avg_time_seconds || 0,
          mobile_percentage: data.mobile_percentage || 0
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData({
        total_views: 0,
        total_sessions: 0,
        avg_time_seconds: 0,
        mobile_percentage: 0
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const extractOwnerName = () => {
    if (!lead?.notes) return;
    // Simple regex to find names in notes (you can enhance this)
    const nameMatch = lead.notes.match(/owner[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (nameMatch) {
      setOwnerName(nameMatch[1]);
    }
  };

  const handleNoteChange = (value: string) => {
    setNewNote(value);
  };

  const saveNote = async (noteContent: string = newNote) => {
    if (!lead || (!noteContent.trim() && !meetingSet && !websitePermission && !schedulingSoftware)) return;

    try {
      // Build comprehensive note with checklist data
      let fullNote = noteContent.trim();
      
      // Add checklist items to note
      const checklistItems = [];
      if (meetingSet) checklistItems.push('✅ Meeting Set');
      if (websitePermission) {
        const permissionText = websitePermission === 'yes' ? '✅ Allowed to Send Website: YES' : 
                             websitePermission === 'no' ? '❌ Allowed to Send Website: NO' :
                             websitePermission === 'hard_no' ? '🚫 Allowed to Send Website: HARD NO' : '';
        if (permissionText) checklistItems.push(permissionText);
      }
      if (schedulingSoftware) checklistItems.push(`📊 Software: ${schedulingSoftware}`);
      
      if (checklistItems.length > 0) {
        fullNote += (fullNote ? '\n\n' : '') + 'Actions:\n' + checklistItems.join('\n');
      }

      console.log('💾 Saving note:', { 
        lead_id: lead.id, 
        content: fullNote,
        leadObject: lead 
      });

      const response = await fetch('/api/pipeline/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          content: fullNote,
          is_private: false
        })
      });

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Note saved successfully:', responseData);
        setNewNote('');
        
        // Auto-stage movement logic
        if (meetingSet && lead.stage !== 'appointment_scheduled') {
          console.log('🔄 Auto-moving to appointment_scheduled stage');
          onMoveStage(lead.id, 'appointment_scheduled', 'Auto-moved: Meeting scheduled via checklist');
        } else if (websitePermission === 'hard_no' && lead.stage !== 'not_interested') {
          console.log('🔄 Auto-moving to not_interested stage');
          onMoveStage(lead.id, 'not_interested', 'Auto-moved: Hard no on website');
        } else if ((websitePermission === 'yes' || websitePermission === 'no') && lead.stage === 'new_lead') {
          console.log('🔄 Auto-moving to contacted stage');
          onMoveStage(lead.id, 'contacted', 'Auto-moved: Initial contact made');
        }
        
        // Mark as having initial contact and clear form
        setHasInitialContact(true);
        setMeetingSet(false);
        setWebsitePermission('');
        // Keep schedulingSoftware for future reference
        fetchNotes();
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to save note:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          leadId: lead.id
        });
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
      
      if (saveResponse.ok) {
        console.log('✅ Customizations saved successfully:', saveData);
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
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 320; // Minimum width
      const maxWidth = window.innerWidth * 0.8; // Max 80% of screen
      
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
    <div 
      className="fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 z-40 transform transition-transform duration-300 ease-in-out"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-ew-resize transition-colors ${
          isResizing ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
      
      <div className="h-full ml-1">
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
                onClick={() => setSidebarWidth(384)}
                className={`w-6 h-4 rounded-sm border border-blue-300 ${sidebarWidth === 384 ? 'bg-blue-300' : 'bg-blue-100'}`}
                title="Small (384px)"
              />
              <button
                onClick={() => setSidebarWidth(600)}
                className={`w-6 h-4 rounded-sm border border-blue-300 ${sidebarWidth === 600 ? 'bg-blue-300' : 'bg-blue-100'}`}
                title="Medium (600px)"
              />
              <button
                onClick={() => setSidebarWidth(800)}
                className={`w-6 h-4 rounded-sm border border-blue-300 ${sidebarWidth === 800 ? 'bg-blue-300' : 'bg-blue-100'}`}
                title="Large (800px)"
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

      {/* Stage Actions */}
      {stageActions.length > 0 && (
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-xs text-gray-600 mb-2">Quick Stage Actions:</p>
          <div className="flex gap-2">
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
      )}

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <div className="flex flex-1">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'notes', label: 'Notes', icon: '📝' },
            { key: 'sms', label: 'SMS', icon: '💬' },
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
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Website</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`w-2 h-2 rounded-full ${lead.company.site ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm font-medium">{lead.company.site ? 'Has Site' : 'No Site'}</span>
                </div>
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
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Rating</div>
                <div className="text-sm font-medium">
                  {lead.company.rating ? `${Number(lead.company.rating).toFixed(1)} stars` : 'N/A'}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Website Views</div>
                <div className="text-sm font-medium">
                  {loadingAnalytics ? '...' : (analyticsData?.total_sessions || 0)} unique visitors
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="border rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-2 text-sm">
                {lead.company.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{lead.company.phone}</span>
                  </div>
                )}
                {lead.company.email_1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-xs">{lead.company.email_1}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{lead.company.city}, {lead.company.state}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Quick Actions</h4>
              <div className="flex flex-col gap-2">
                {lead.company.reviews_link && (
                  <a
                    href={lead.company.reviews_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    📍 View Google Reviews (Find Owner Name)
                  </a>
                )}
                {lead.company.slug && (
                  <a
                    href={`/t/moderntrust/${lead.company.slug}?preview=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    🌐 Preview Website
                  </a>
                )}
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
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter owner name for SMS/email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* New Note Input */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📝 Add Note</h4>
              <textarea
                value={newNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Type your note..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Show action checklist only if no initial contact made */}
            {!hasInitialContact && (
              <div className="border border-gray-200 rounded-lg p-3 bg-blue-50">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">✅ Initial Contact Checklist</h4>
                <div className="space-y-3">
                  {/* Meeting Set Checkbox */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="meetingSet"
                      checked={meetingSet}
                      onChange={(e) => setMeetingSet(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="meetingSet" className="text-sm font-medium text-gray-700">
                      📅 Meeting Set / Appointment Set
                    </label>
                  </div>

                  {/* Website Permission Radio Buttons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🌐 Allowed to Send Website</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="website_yes"
                          name="websitePermission"
                          value="yes"
                          checked={websitePermission === 'yes'}
                          onChange={(e) => setWebsitePermission(e.target.value)}
                          className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <label htmlFor="website_yes" className="text-sm text-gray-700">✅ Yes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="website_no"
                          name="websitePermission"
                          value="no"
                          checked={websitePermission === 'no'}
                          onChange={(e) => setWebsitePermission(e.target.value)}
                          className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                        />
                        <label htmlFor="website_no" className="text-sm text-gray-700">❌ No</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="website_hard_no"
                          name="websitePermission"
                          value="hard_no"
                          checked={websitePermission === 'hard_no'}
                          onChange={(e) => setWebsitePermission(e.target.value)}
                          className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <label htmlFor="website_hard_no" className="text-sm text-gray-700">🚫 Hard No</label>
                      </div>
                    </div>
                  </div>

                  {/* Scheduling Software Text Input */}
                  <div>
                    <label htmlFor="software" className="block text-sm font-medium text-gray-700 mb-1">
                      📊 Scheduling/Invoice Software
                    </label>
                    <input
                      type="text"
                      id="software"
                      value={schedulingSoftware}
                      onChange={(e) => setSchedulingSoftware(e.target.value)}
                      placeholder="e.g., ServiceTitan, Housecall Pro, JobNimbus..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}


            {/* Save Button */}
            <button
              onClick={() => saveNote()}
              disabled={!newNote.trim() && !meetingSet && !websitePermission && !schedulingSoftware}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-md text-sm font-medium"
            >
              💾 Save Note
              {!hasInitialContact && meetingSet && <span className="text-sm block">→ Will auto-move to Appointment Scheduled</span>}
              {!hasInitialContact && websitePermission === 'hard_no' && <span className="text-sm block">→ Will auto-move to Not Interested</span>}
              {!hasInitialContact && (websitePermission === 'yes' || websitePermission === 'no') && <span className="text-sm block">→ Will auto-move to Contacted</span>}
            </button>

            {/* Calendar embed when meeting is set */}
            {meetingSet && (
              <div className="border border-blue-200 rounded-lg bg-blue-50 p-3">
                <h4 className="font-medium text-blue-900 mb-2">📅 Schedule Appointment</h4>
                <div className="bg-white rounded p-2">
                  <iframe 
                    src="https://api.leadconnectorhq.com/widget/booking/2py8ezkg4g4PPHGO6XUZ" 
                    style={{width: '100%', height: '300px', border: 'none'}} 
                    id="calendar_embed"
                    title="Appointment Booking Calendar"
                  />
                </div>
                <script src="https://api.leadconnectorhq.com/js/form_embed.js" type="text/javascript"></script>
              </div>
            )}

            {/* Notes History */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📚 Recent Notes</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notes.map(note => (
                  <div key={note.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <div className="text-gray-900 whitespace-pre-wrap text-sm">{note.content}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(note.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
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
              <h4 className="font-medium text-purple-900 mb-2 text-sm sm:text-base">💬 Send Website SMS</h4>
              <div className="text-sm text-purple-700 mb-3 break-all">
                To: {lead?.company?.phone || 'No phone number found'}
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (you can edit this):
                </label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white resize-none"
                  rows={6}
                  style={{minHeight: '120px'}}
                  placeholder="Your SMS message will appear here..."
                />
              </div>
              
              <button
                onClick={handleSendSMS}
                disabled={!lead?.company?.phone || !smsMessage.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-md text-sm font-medium cursor-pointer touch-manipulation active:bg-purple-800"
                type="button"
              >
                💬 Open SMS App to Send
              </button>
              
              <div className="text-xs text-gray-500 mt-2 text-center">
                This will open your Messages app with the text pre-filled
              </div>
            </div>
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
                {/* Hero Image 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image 1</label>
                  <input
                    type="url"
                    placeholder="Enter first hero image URL"
                    value={customizations.hero_img || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, hero_img: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Hero Image 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image 2</label>
                  <input
                    type="url"
                    placeholder="Enter second hero image URL"
                    value={customizations.hero_img_2 || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, hero_img_2: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* About Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About Image</label>
                  <input
                    type="url"
                    placeholder="Enter about section image URL"
                    value={customizations.about_img || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, about_img: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
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
  );
}