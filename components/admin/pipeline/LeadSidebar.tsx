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

const QUICK_NOTE_TEMPLATES = [
  "Left voicemail - will follow up tomorrow",
  "No answer - trying again later today", 
  "Spoke with owner - interested in demo",
  "Not interested at this time",
  "Requested more information via email",
  "Scheduled follow-up call for next week"
];

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
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'template' | 'tracking'>('overview');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lead && isOpen) {
      fetchNotes();
      fetchCustomizations();
      // Try to extract owner name from existing notes
      extractOwnerName();
    }
  }, [lead, isOpen]);

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
        const customizationMap: Record<string, string> = {};
        data.forEach((custom: any) => {
          customizationMap[custom.customization_type] = custom.custom_value;
        });
        setCustomizations(customizationMap);
      }
    } catch (error) {
      console.error('Error fetching customizations:', error);
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
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new auto-save timeout
    const timeout = setTimeout(() => {
      if (value.trim()) {
        saveNote(value);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    setAutoSaveTimeout(timeout);
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
          is_private: false
        })
      });

      if (response.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleQuickNote = (template: string) => {
    setNewNote(template);
    saveNote(template);
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
    if (lead?.company.email_1) {
      window.open(`mailto:${lead.company.email_1}`);
      const emailNote = `✉️ Sent email to ${lead.company.name} at ${new Date().toLocaleTimeString()}`;
      saveNote(emailNote);
    }
  };

  const handleSMS = () => {
    if (!lead?.company.phone) return;
    
    const ownerNameToUse = ownerName || 'there';
    const websiteUrl = `https://yourwebsitedomain.com/t/moderntrust/${lead.company.slug}`;
    const message = `Hey ${ownerNameToUse},

Thank you for giving me a few minutes of your valuable time. Here is the website we talked about: ${websiteUrl}

This is my personal cell phone. Please call or text me anytime if you have any questions.

Thank you,
Jared Thompson`;

    const phoneNumber = lead.company.phone.replace(/[^\d]/g, '');
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_self');
    
    // Auto-add SMS activity note
    const smsNote = `💬 Sent SMS to ${ownerNameToUse} at ${new Date().toLocaleTimeString()}`;
    saveNote(smsNote);
  };

  const saveCustomizations = async () => {
    if (!lead) return;
    
    setIsSaving(true);
    try {
      // Process each image URL - download and save to storage
      const processedCustomizations: Record<string, string> = {};
      
      for (const [frameKey, imageUrl] of Object.entries(customizations)) {
        if (imageUrl && imageUrl.trim() !== '') {
          const uploadResponse = await fetch('/api/upload-image-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: imageUrl.trim(),
              companyId: lead.company_id,
              frameType: frameKey
            })
          });

          const uploadData = await uploadResponse.json();
          if (uploadResponse.ok) {
            processedCustomizations[frameKey] = uploadData.storageUrl;
          } else {
            processedCustomizations[frameKey] = imageUrl.trim();
          }
        }
      }

      setCustomizations(processedCustomizations);
    } catch (error) {
      console.error('Error saving customizations:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !lead) return null;

  const stageActions = STAGE_ACTIONS[lead.stage as keyof typeof STAGE_ACTIONS] || [];

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-40 transform transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg truncate">{lead.company.name}</h3>
            <p className="text-blue-100 text-sm">{lead.company.city}, {lead.company.state}</p>
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

        {/* Primary Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCall}
            disabled={!lead.company.phone}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-1"
          >
            📞 Call
          </button>
          <button
            onClick={handleEmail}
            disabled={!lead.company.email_1}
            className="flex-1 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-400 text-white py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-1"
          >
            ✉️ Email
          </button>
          <button
            onClick={handleSMS}
            disabled={!lead.company.phone}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-1"
          >
            💬 SMS
          </button>
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
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'notes', label: 'Notes', icon: '📝' },
          { key: 'template', label: 'Template', icon: '🎨' },
          { key: 'tracking', label: 'Analytics', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="block">{tab.icon}</span>
            <span className="block mt-1">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
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
                  {lead.company.rating ? `⭐ ${Number(lead.company.rating).toFixed(1)}` : 'N/A'}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Reviews</div>
                <div className="text-sm font-medium">{lead.company.reviews || 'N/A'}</div>
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

            {/* Owner Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter owner name for SMS"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <a
                href={`/t/moderntrust/${lead.company.slug}?preview=true`}
                target="_blank"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-center py-2 rounded text-sm font-medium"
              >
                🔗 Preview Website
              </a>
              <a
                href={`/t/moderntrust/${lead.company.slug}?admin=true`}
                target="_blank"
                className="block w-full bg-blue-100 hover:bg-blue-200 text-blue-700 text-center py-2 rounded text-sm font-medium"
              >
                👤 Admin View
              </a>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-4 space-y-4">
            {/* Quick Note Templates */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Quick Notes</h4>
              <div className="grid grid-cols-1 gap-1">
                {QUICK_NOTE_TEMPLATES.map(template => (
                  <button
                    key={template}
                    onClick={() => handleQuickNote(template)}
                    className="text-left text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* New Note Input */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Add Note</h4>
              <textarea
                value={newNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Type your note... (auto-saves)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
              <button
                onClick={() => saveNote()}
                disabled={!newNote.trim()}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 rounded text-sm"
              >
                Save Note
              </button>
            </div>

            {/* Notes History */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recent Notes</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notes.map(note => (
                  <div key={note.id} className="bg-gray-50 p-2 rounded text-sm">
                    <div className="text-gray-900">{note.content}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(note.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="text-gray-500 text-sm italic">No notes yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Template Tab */}
        {activeTab === 'template' && (
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-gray-900 mb-2">Template Customization</h4>
            
            <div className="space-y-3">
              {/* Hero Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image</label>
                <input
                  type="url"
                  placeholder="Enter image URL"
                  value={customizations.hero_img || ''}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, hero_img: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* About Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Image</label>
                <input
                  type="url"
                  placeholder="Enter image URL"
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

              <button
                onClick={saveCustomizations}
                disabled={isSaving}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 rounded text-sm font-medium"
              >
                {isSaving ? 'Saving...' : '💾 Save Template'}
              </button>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'tracking' && (
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-gray-900 mb-2">Website Analytics</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-800 font-medium text-sm">Tracking Active</span>
              </div>
              <p className="text-green-700 text-xs mt-1">
                Analytics are automatically collected for all visits
              </p>
            </div>
            
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Detailed analytics coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}