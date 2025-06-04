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

interface LeadDetails {
  owner_name?: string;
  software_used?: string;
  interest_level?: number;
  estimated_value?: number;
  best_contact_time?: string;
  qualification_checklist?: Record<string, boolean>;
  next_followup_date?: string;
}

interface Note {
  id: string;
  lead_id: string;
  content: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
}

interface Activity {
  id: string;
  lead_id: string;
  activity_type: 'call' | 'email' | 'sms' | 'stage_move' | 'note';
  description: string;
  metadata?: any;
  created_at: string;
}

interface BusinessDetailModalProps {
  lead: PipelineLead;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedLead: PipelineLead) => void;
}

const SOFTWARE_OPTIONS = [
  'Service Titan',
  'Jobber',
  'FieldEdge',
  'ServiceM8',
  'Housecall Pro',
  'CallRail',
  'Local Service Ads',
  'Other',
  'None'
];

const QUALIFICATION_CHECKLIST = [
  { key: 'contact_verified', label: 'Owner contact info verified' },
  { key: 'software_identified', label: 'Current software identified' },
  { key: 'pain_points', label: 'Pain points discovered' },
  { key: 'budget_range', label: 'Budget range established' },
  { key: 'timeline_confirmed', label: 'Decision timeline confirmed' },
  { key: 'demo_scheduled', label: 'Demo scheduled' },
  { key: 'proposal_sent', label: 'Proposal sent' },
  { key: 'terms_agreed', label: 'Contract terms agreed' },
  { key: 'implementation_planned', label: 'Implementation planned' }
];

const SMS_TEMPLATES = [
  { name: 'Initial Contact', message: 'Hi {name}, this is [Your Name] from [Company]. We help HVAC contractors like yourself grow their business online. Do you have a few minutes to chat about your current marketing efforts?' },
  { name: 'Follow-up', message: 'Hi {name}, following up on our conversation about improving your online presence. When would be a good time to show you how we can help?' },
  { name: 'Demo Reminder', message: 'Hi {name}, just confirming our demo tomorrow at {time}. Looking forward to showing you the platform!' },
  { name: 'Check-in', message: 'Hi {name}, checking in to see if you had any questions about our proposal. Happy to jump on a quick call to discuss!' }
];

const EMAIL_TEMPLATES = [
  { name: 'Introduction', subject: 'Helping {company} grow online' },
  { name: 'Follow-up', subject: 'Following up on our conversation' },
  { name: 'Proposal', subject: 'Website proposal for {company}' },
  { name: 'Demo Follow-up', subject: 'Next steps for {company}' }
];

export default function BusinessDetailModal({ lead, isOpen, onClose, onUpdate }: BusinessDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'checklist' | 'communication'>('info');
  
  console.log('BusinessDetailModal render:', { isOpen, leadName: lead?.company?.name });
  const [leadDetails, setLeadDetails] = useState<LeadDetails>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && lead) {
      fetchLeadDetails();
      fetchNotes();
      fetchActivities();
    }
  }, [isOpen, lead]);

  const fetchLeadDetails = async () => {
    try {
      const response = await fetch(`/api/pipeline/lead-details/${lead.id}`);
      if (response.ok) {
        const data = await response.json();
        setLeadDetails(data);
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
    }
  };

  const fetchNotes = async () => {
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

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/pipeline/activity/${lead.id}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const updateLeadDetails = async (updates: Partial<LeadDetails>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/pipeline/lead-details/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updatedDetails = await response.json();
        setLeadDetails(updatedDetails);
      }
    } catch (error) {
      console.error('Error updating lead details:', error);
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const response = await fetch('/api/pipeline/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          content: newNote,
          is_private: isPrivateNote
        })
      });
      
      if (response.ok) {
        setNewNote('');
        setIsPrivateNote(false);
        fetchNotes();
        fetchActivities();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const updateChecklist = async (key: string, checked: boolean) => {
    const updatedChecklist = { ...leadDetails.qualification_checklist, [key]: checked };
    await updateLeadDetails({ qualification_checklist: updatedChecklist });
  };

  const sendSMS = async (template: string) => {
    try {
      const message = template
        .replace('{name}', leadDetails.owner_name || lead.company.name)
        .replace('{company}', lead.company.name);
        
      const response = await fetch('/api/pipeline/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          phone: lead.company.phone,
          message
        })
      });
      
      if (response.ok) {
        fetchActivities();
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  };

  const sendEmail = async (template: { subject: string }) => {
    try {
      const subject = template.subject
        .replace('{company}', lead.company.name);
        
      const response = await fetch('/api/pipeline/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          email: lead.company.email_1,
          subject,
          template: 'basic'
        })
      });
      
      if (response.ok) {
        fetchActivities();
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }

  console.log('Rendering modal for:', lead.company.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{lead.company.name}</h2>
            <p className="text-gray-600">{lead.company.city}, {lead.company.state}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            <button
              onClick={() => window.open(`tel:${lead.company.phone}`)}
              className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
              title="Call"
            >
              📞
            </button>
            <button
              onClick={() => window.open(`mailto:${lead.company.email_1}`)}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Email"
            >
              ✉️
            </button>
            <button
              onClick={() => setActiveTab('communication')}
              className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              title="SMS"
            >
              💬
            </button>
            
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'info', label: 'Business Info', icon: '🏢' },
              { key: 'notes', label: 'Notes & Activity', icon: '📝' },
              { key: 'checklist', label: 'Qualification', icon: '✅' },
              { key: 'communication', label: 'Communication', icon: '💬' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Business Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Owner Name
                  </label>
                  <input
                    type="text"
                    value={leadDetails.owner_name || ''}
                    onChange={(e) => setLeadDetails({ ...leadDetails, owner_name: e.target.value })}
                    onBlur={(e) => updateLeadDetails({ owner_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter owner name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={lead.company.phone || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Software
                  </label>
                  <select
                    value={leadDetails.software_used || ''}
                    onChange={(e) => updateLeadDetails({ software_used: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select software...</option>
                    {SOFTWARE_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⭐ Interest Level
                  </label>
                  <select
                    value={leadDetails.interest_level || ''}
                    onChange={(e) => updateLeadDetails({ interest_level: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select level...</option>
                    <option value="1">1 - Very Low</option>
                    <option value="2">2 - Low</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - High</option>
                    <option value="5">5 - Very High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 Estimated Value
                  </label>
                  <input
                    type="number"
                    value={leadDetails.estimated_value || ''}
                    onChange={(e) => updateLeadDetails({ estimated_value: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="$0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🕐 Best Contact Time
                  </label>
                  <input
                    type="text"
                    value={leadDetails.best_contact_time || ''}
                    onChange={(e) => updateLeadDetails({ best_contact_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Mornings, After 5pm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Follow-up Date
                </label>
                <input
                  type="datetime-local"
                  value={leadDetails.next_followup_date || ''}
                  onChange={(e) => updateLeadDetails({ next_followup_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Notes & Activity Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Add New Note */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Add Note</h4>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add notes about your conversation..."
                />
                <div className="flex justify-between items-center mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isPrivateNote}
                      onChange={(e) => setIsPrivateNote(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Private note</span>
                  </label>
                  <button
                    onClick={addNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Activity Timeline</h4>
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 min-w-[100px]">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{activity.description}</div>
                        <div className="text-sm text-gray-600 capitalize">{activity.activity_type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Qualification Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-4">Qualification Checklist</h4>
              <div className="space-y-3">
                {QUALIFICATION_CHECKLIST.map(item => (
                  <label key={item.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={leadDetails.qualification_checklist?.[item.key] || false}
                      onChange={(e) => updateChecklist(item.key, e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  Progress: {Object.values(leadDetails.qualification_checklist || {}).filter(Boolean).length} / {QUALIFICATION_CHECKLIST.length}
                </div>
              </div>
            </div>
          )}

          {/* Communication Tab */}
          {activeTab === 'communication' && (
            <div className="space-y-6">
              {/* SMS Templates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">SMS Templates</h4>
                <div className="space-y-3">
                  {SMS_TEMPLATES.map(template => (
                    <div key={template.name} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-gray-900">{template.name}</h5>
                        <button
                          onClick={() => sendSMS(template.message)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Send SMS
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{template.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Templates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Email Templates</h4>
                <div className="space-y-3">
                  {EMAIL_TEMPLATES.map(template => (
                    <div key={template.name} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium text-gray-900">{template.name}</h5>
                          <p className="text-sm text-gray-600">{template.subject}</p>
                        </div>
                        <button
                          onClick={() => sendEmail(template)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Send Email
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}