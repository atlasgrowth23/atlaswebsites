import { useState, useEffect, useRef } from 'react';
import DomainManagement from '@/components/DomainManagement';

// 🆕 MODERNIZED LEAD SIDEBAR COMPONENT (Phase 3 Step 4)
// Now uses embedded JSON notes and tags data from modernized APIs
// Provides enhanced UI with note/tag counts and recent note previews

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
  notes: string; // Legacy field for backward compatibility
  notes_json?: Note[]; // 🆕 New JSON notes array
  notes_count?: number; // 🆕 Quick count for UI
  recent_note?: string; // 🆕 Preview of most recent note
  tags?: Tag[]; // 🆕 Tags array
  tags_count?: number; // 🆕 Quick count for UI
  created_at: string;
  updated_at: string;
  company: Company;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_private?: boolean;
  created_by?: string;
  type?: string;
}

interface Tag {
  id: string;
  tag_type: string;
  display_name: string;
  color: string;
  created_at: string;
}

interface LeadSidebarProps {
  lead: PipelineLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (lead: PipelineLead) => void;
  onMoveStage: (leadId: string, newStage: string, notes?: string) => void;
  stages: Array<{ key: string; title: string; color: string }>;
}



export default function LeadSidebar({ lead, isOpen, onClose, onUpdateLead, onMoveStage, stages }: LeadSidebarProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'template' | 'analytics'>('overview');
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const hasActiveSession = false; // Sessions functionality removed
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    notes: ''
  });
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
      ip_address?: string;
      browser_name?: string;
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
  
  
  // Voicemail tracking states
  const [voicemailPart1Sent, setVoicemailPart1Sent] = useState(false);
  const [voicemailPart2Sent, setVoicemailPart2Sent] = useState(false);
  
  // Checklist states
  const [meetingSet, setMeetingSet] = useState(false);
  const [websitePermission, setWebsitePermission] = useState(''); // '', 'yes', 'no', 'hard_no'
  const [schedulingSoftware, setSchedulingSoftware] = useState('');
  const [hasInitialContact, setHasInitialContact] = useState(false);
  
  // Enhanced notes states  
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [showFullRecentNote, setShowFullRecentNote] = useState(false);


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
      setIsPrivateNote(false);
      // Reset voicemail states
      setVoicemailPart1Sent(false);
      setVoicemailPart2Sent(false);
      
      // Fetch notes from companies table
      fetchNotes();
      
      
      // Then fetch remaining data
      fetchCustomizations();
      fetchAnalyticsData();
      fetchOwnerName();
      // Activities functionality removed
      // Check if lead has progressed past new_lead stage (has initial contact)
      setHasInitialContact(lead.stage !== 'new_lead');
    }
  }, [lead, isOpen]);

  useEffect(() => {
    if (activeTab === 'analytics' && lead && isOpen) {
      fetchAnalyticsData();
    }
  }, [activeTab, lead, isOpen]);

  // Auto-switch away from hidden mobile tabs
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (activeTab === 'template') {
        setActiveTab('overview');
      }
    }
  }, [activeTab]);

  // Detect current user (you'll need to pass this from auth context)
  const currentUser = 'Jared'; // TODO: Get from auth context - 'Nick' or 'Jared'
  const isNick = currentUser === 'Nick';

  // Activity tracking removed




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
      // Analytics API removed - return empty data
      setAnalyticsData({
        visits: [],
        summary: { total_visits: 0, unique_visitors: 0, return_visitors: 0, bounce_rate: 0, avg_time_on_site: 0 }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData({
        visits: [],
        summary: { total_visits: 0, unique_visitors: 0, return_visitors: 0, bounce_rate: 0, avg_time_on_site: 0 }
      });
    } finally {
      setLoadingAnalytics(false);
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



  // Consolidated save function for all fields
  const saveAllData = async () => {
    if (!lead) return;
    
    setIsSaving(true);
    
    try {
      // Save owner name and email
      if (ownerName.trim() || ownerEmail.trim()) {
        const ownerResponse = await fetch('/api/pipeline/owner-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: lead.id,
            owner_name: ownerName.trim() || undefined,
            owner_email: ownerEmail.trim() || undefined
          })
        });
        
        if (ownerResponse.ok) {
          console.log(`✅ Saved owner info: ${ownerName} / ${ownerEmail} for lead: ${lead.id}`);
          
          // If we have both name and email, create contacts
          if (ownerName.trim() && ownerEmail.trim()) {
            console.log('📞 Creating contacts since both name and email are provided...');
            
            try {
              // Create contact in our CRM
              const contactResponse = await fetch('/api/admin/add-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  company_id: lead.company_id,
                  owner_name: ownerName.trim(),
                  owner_email: ownerEmail.trim()
                })
              });
              
              if (contactResponse.ok) {
                console.log(`✅ Created contact in CRM: ${ownerEmail} for company: ${lead.company_id}`);
                
                // Also try to create Google contact
                try {
                  const googleResponse = await fetch('/api/google/create-contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ownerName: ownerName.trim(),
                      ownerEmail: ownerEmail.trim(),
                      companyName: lead.company.name,
                      phone: lead.company.phone,
                      notes: `Pipeline lead from ${lead.company.city}, ${lead.company.state}`
                    })
                  });
                  
                  if (googleResponse.ok) {
                    console.log('✅ Created Google contact successfully');
                  } else {
                    console.log('⚠️ Google contact creation failed');
                  }
                } catch (googleError) {
                  console.error('Google contact creation error:', googleError);
                }
              }
            } catch (contactError) {
              console.error('Contact creation error:', contactError);
            }
          }
        }
      }
      
      // Save note if provided
      if (newNote.trim()) {
        const noteResponse = await fetch('/api/pipeline/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: lead.id,
            content: newNote.trim(),
            is_private: false,
            created_by: ownerName || 'admin'
          })
        });

        if (noteResponse.ok) {
          setNewNote('');
          fetchNotes();
          console.log('✅ Note saved successfully');
        } else {
          console.error('❌ Failed to save note');
        }
      }
      
      // Show success message
      const savedItems = [];
      if (ownerName.trim()) savedItems.push('Owner Name');
      if (ownerEmail.trim()) savedItems.push('Owner Email');
      if (newNote.trim()) savedItems.push('Note');
      
      if (savedItems.length > 0) {
        alert(`✅ Saved: ${savedItems.join(', ')}`);
      }
      
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  const handleCall = async () => {
    if (!lead?.company.phone) return;
    
    try {
      // Get TextGrid number based on lead location
      const textGridNumber = getAssignedTextGridNumber(lead.company.state);
      
      console.log(`📞 Initiating call to ${lead.company.name} (${lead.company.phone}) from ${textGridNumber}`);
      
      // Make call through TextGrid API
      const response = await fetch('/api/textgrid/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadPhone: lead.company.phone,
          fromNumber: textGridNumber,
          leadName: lead.company.name,
          leadId: lead.id
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        const displayName = lead.owner_name 
          ? `${lead.company.name} (${lead.owner_name})`
          : lead.company.name;
        alert(`📞 Calling ${displayName} at ${lead.company.phone}...`);
        console.log('Call initiated:', result);
      } else {
        alert(`❌ Call failed: ${result.error}`);
        console.error('Call error:', result);
      }
      
    } catch (error) {
      console.error('Call error:', error);
      alert('❌ Failed to make call. Please try again.');
    }
  };

  // Helper function to get assigned TextGrid number
  const getAssignedTextGridNumber = (state: string) => {
    return '+15012040257'; // Updated TextGrid number
  };

  const handleUnsuccessfulCall = () => {
    if (!lead) return;
    
    // Activity tracking removed
    
    // Note: Removed auto-save to prevent unwanted "Added Note" activities
  };

  const handleManualAction = async (action: typeof MANUAL_ACTIONS[0]) => {
    if (!lead) return;

    // Special handling for appointment - show calendar popup
    if (action.action === 'appointment') {
      setShowAppointmentForm(true);
      return;
    }

    // Track the action first
    const actionMap = {
      'sale_made': 'sale_made',
      'callback_received': 'callback_received'
    };

    // Activity tracking removed

    // Move to new stage if specified
    if (action.stage) {
      await onMoveStage(lead.id, action.stage);
    }

    // Auto-add note
    const noteMap = {
      'sale_made': `🎉 Sale made with ${lead.company.name} at ${new Date().toLocaleTimeString()}`,
      'callback_received': `📞 Callback received from ${lead.company.name} at ${new Date().toLocaleTimeString()}`
    };

    // Note: Removed auto-save to prevent unwanted "Added Note" activities
  };

  const handleAppointmentSubmit = async () => {
    if (!lead) return;

    try {
      // Format date and time for display
      const appointmentDate = new Date(appointmentForm.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const appointmentTime = new Date(`1970-01-01T${appointmentForm.time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Activity tracking removed

      // Move to appointment stage
      await onMoveStage(lead.id, 'appointment');

      // Create Google Calendar event
      const startDateTime = `${appointmentForm.date}T${appointmentForm.time}:00`;
      const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString().slice(0, 19); // 1 hour later

      try {
        await fetch('/api/admin/calendar/pipeline-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadData: {
              companyName: lead.company.name,
              contactEmail: ownerEmail || lead.company.email_1,
              contactPhone: lead.company.phone,
              address: `${lead.company.city}, ${lead.company.state}`,
              notes: appointmentForm.notes
            },
            appointmentData: {
              title: 'Sales Appointment',
              startTime: startDateTime,
              endTime: endDateTime,
              timeZone: 'America/Chicago'
            }
          })
        });
        console.log('✅ Google Calendar event created');
      } catch (calendarError) {
        console.warn('⚠️ Google Calendar event creation failed:', calendarError);
        // Continue with appointment creation even if calendar fails
      }

      // Save appointment in database
      await fetch('/api/calendar/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: lead.company.name,
          ownerName: ownerName || 'Business Owner',
          ownerEmail: ownerEmail || lead.company.email_1 || '',
          phoneNumber: lead.company.phone,
          appointmentDate: appointmentForm.date,
          appointmentTime: appointmentForm.time,
          createdBy: currentUser,
          notes: appointmentForm.notes
        })
      });

      // Send confirmation email if we have email
      if (ownerEmail || lead.company.email_1) {
        await fetch('/api/send-appointment-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerEmail: ownerEmail || lead.company.email_1,
            ownerName: ownerName || 'Business Owner',
            companyName: lead.company.name,
            appointmentDate,
            appointmentTime,
            phoneNumber: lead.company.phone,
            setBy: currentUser
          })
        });
      }

      // Note: Removed auto-save to prevent unwanted "Added Note" activities

      // Reset form and close
      setAppointmentForm({
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        notes: ''
      });
      setShowAppointmentForm(false);

      alert('✅ Appointment set, Google Calendar event created, and confirmation email sent!');

    } catch (error) {
      console.error('Error setting appointment:', error);
      alert('❌ Failed to set appointment. Please try again.');
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
    
    // Note: Removed auto-save to prevent unwanted "Added Note" activities
  };

  const handleSendSMS = () => {
    if (!lead?.company.phone || !smsMessage.trim()) return;
    
    const phoneNumber = lead.company.phone.replace(/[^\d]/g, '');
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(smsMessage)}`;
    window.open(smsUrl, '_self');
    
    // Note: Removed auto-save to prevent unwanted "Added Note" activities
  };

  const saveCustomizations = async () => {
    if (!lead) return;
    
    setIsSaving(true);
    try {
      console.log('🚀 Saving customizations:', { companyId: lead.company_id, customizations });
      
      // Activity tracking removed
      
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
              className="text-blue-100 hover:text-white ml-2 p-2 rounded-lg hover:bg-blue-600 transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* Quick Actions Bar - Always visible */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex flex-col gap-3">
          {/* Top Row: Core Actions */}
          <div className="flex items-center gap-2">
            {/* Call Icon - Always there */}
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
            
            {/* Unsuccessful Call Button - Only during active session */}
            {hasActiveSession && (
              <button
                onClick={handleUnsuccessfulCall}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                title="Mark as unsuccessful call"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 17M5.636 5.636L7 7m0 0a9 9 0 1012.728 12.728M7 7l5 5-5-5z" />
                </svg>
              </button>
            )}

            {/* Preview Website Button - Always there */}
            {lead.company.slug && (
              <button
                onClick={() => {
                  window.open(`/t/moderntrust/${lead.company.slug}?preview=true`, '_blank');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                title="Preview website"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            )}

            {/* Contact Button - Always there */}
            <button
              onClick={() => setShowContactModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
              title="Manage Contact"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* View Google Reviews Button - Always there */}
            {lead.company.reviews_link && (
              <button
                onClick={() => {
                  window.open(lead.company.reviews_link, '_blank');
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-lg transition-colors"
                title="View Google Reviews"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
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
            { key: 'template', label: 'Template', icon: '🎨', hideOnMobile: true },
            { key: 'analytics', label: 'Site Analytics', icon: '📈' },
          ].filter(tab => {
            // Hide template and activity tabs on mobile (screens < 768px)
            if (tab.hideOnMobile && typeof window !== 'undefined' && window.innerWidth < 768) {
              return false;
            }
            return true;
          }).map(tab => (
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
          className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-b-2 border-transparent text-lg font-bold"
          title="Close"
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



            {/* Compact Review Analytics */}
            <div className="border rounded-lg p-3 bg-blue-50">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">📊 Reviews ({lead.company.reviews || 0} total • {lead.company.rating ? `${Number(lead.company.rating).toFixed(1)}★` : 'No rating'})</h4>
              
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-600">30d</div>
                  <div className="text-sm font-medium">{lead.company.r_30 || 0}</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-600">60d</div>
                  <div className="text-sm font-medium">{lead.company.r_60 || 0}</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-600">90d</div>
                  <div className="text-sm font-medium">{lead.company.r_90 || 0}</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-600">1yr</div>
                  <div className="text-sm font-medium">{lead.company.r_365 || 0}</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-4 space-y-4">

            {/* New Note Input */}
            <div>
              <div className="mb-2">
                <h4 className="font-medium text-gray-900">📝 Add Note</h4>
              </div>
              <div className="relative">
                <textarea
                  value={newNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Type your note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>



            {/* Consolidated Save Button */}
            <button
              onClick={saveAllData}
              disabled={isSaving || (!ownerName.trim() && !ownerEmail.trim() && !newNote.trim())}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-md text-sm font-medium"
            >
              {isSaving ? '💾 Saving...' : '💾 Save All'}
            </button>


            {/* Notes History - Enhanced with counts */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                📚 Team Notes & Activity
                {(lead.notes_count || notes.length) > 0 && (
                  <span className="ml-2 bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                    {lead.notes_count || notes.length}
                  </span>
                )}
              </h4>
              {lead.recent_note && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-blue-600 font-medium">Most Recent:</div>
                    {lead.notes && lead.notes.length > 300 && (
                      <button
                        onClick={() => setShowFullRecentNote(!showFullRecentNote)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {showFullRecentNote ? 'Show Less' : 'Show Full Note'}
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    "{showFullRecentNote ? lead.notes : lead.recent_note}"
                  </div>
                </div>
              )}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {(lead.notes_json || notes).map(note => {
                  const noteTypeColors = {
                    general: 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100',
                    call: 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100',
                    email: 'border-green-200 bg-gradient-to-r from-green-50 to-green-100',
                    meeting: 'border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100',
                    follow_up: 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100',
                    urgent: 'border-red-200 bg-gradient-to-r from-red-50 to-red-100'
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
                    <div key={note.id} className={`p-4 rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow ${colorClass}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0 bg-white rounded-full p-1 shadow-sm">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed font-medium">{note.content}</div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/60">
                            <div className="text-xs text-gray-600 font-medium">
                              {new Date(note.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              {note.created_by && (
                                <span className="text-xs bg-white/80 text-gray-700 px-2 py-1 rounded-full font-medium">
                                  {note.created_by}
                                </span>
                              )}
                              {note.content.includes('@Jared') && (
                                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full font-medium">
                                  🔔 Mention
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(lead.notes_json || notes).length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <div className="text-gray-500 text-sm font-medium">No notes yet</div>
                    <div className="text-gray-400 text-xs mt-1">Add your first note above</div>
                  </div>
                )}
              </div>
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
                                {visit.browser_name && (
                                  <div>
                                    <span className="font-medium text-gray-600">Browser:</span>
                                    <div className="text-gray-900">{visit.browser_name}</div>
                                  </div>
                                )}
                                {visit.ip_address && (
                                  <div>
                                    <span className="font-medium text-gray-600">IP Address:</span>
                                    <div className="text-gray-900 font-mono text-xs">{visit.ip_address}</div>
                                  </div>
                                )}
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

      {/* Appointment Form Popup */}
      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">📅 Set Appointment</h2>
                <button
                  onClick={() => setShowAppointmentForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{lead.company.name}</h3>
                  <p className="text-sm text-gray-600">
                    {ownerName || 'Business Owner'} • {ownerEmail || lead.company.email_1 || 'No email'} • {lead.company.phone || 'No phone'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <select
                    required
                    value={appointmentForm.time}
                    onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 17 }, (_, i) => {
                      const hour = 9 + Math.floor(i / 2);
                      const minute = i % 2 === 0 ? '00' : '30';
                      const timeValue = `${hour.toString().padStart(2, '0')}:${minute}`;
                      const timeLabel = new Date(`1970-01-01T${timeValue}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      });
                      return (
                        <option key={timeValue} value={timeValue}>
                          {timeLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                    placeholder="Any special notes for this appointment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAppointmentForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAppointmentSubmit}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    📅 Set Appointment & Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Contact Management
                </h2>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{lead.company.name}</h3>
                  <p className="text-sm text-gray-600">
                    {lead.company.city}, {lead.company.state} • {lead.company.phone || 'No phone'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Business owner name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Email
                  </label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={saveAllData}
                    disabled={isSaving || (!ownerName.trim() && !ownerEmail.trim())}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300"
                  >
                    {isSaving ? 'Saving...' : 'Save to Pipeline'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!ownerName.trim() || !ownerEmail.trim()) {
                        alert('Please enter both owner name and email to create a contact.');
                        return;
                      }
                      
                      setIsCreatingContact(true);
                      
                      try {
                        // First save the data
                        await saveAllData();
                        
                        // Then create Google contact
                        const response = await fetch('/api/google/create-contact', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            ownerName: ownerName.trim(),
                            ownerEmail: ownerEmail.trim(),
                            companyName: lead.company.name,
                            phone: lead.company.phone,
                            notes: `Pipeline lead from ${lead.company.city}, ${lead.company.state}`
                          })
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                          alert('✅ Contact created successfully in Google Contacts!');
                          setShowContactModal(false);
                        } else {
                          alert(`❌ Failed to create contact: ${data.error}`);
                        }
                      } catch (error) {
                        console.error('Error creating contact:', error);
                        alert('❌ Error creating contact. Please try again.');
                      } finally {
                        setIsCreatingContact(false);
                      }
                    }}
                    disabled={isCreatingContact || !ownerName.trim() || !ownerEmail.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
                  >
                    {isCreatingContact ? 'Creating...' : '📱 Create Google Contact'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}