import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  last_interaction: string;
  created_at: string;
  company_name?: string;
}

interface Message {
  id: string;
  message: string;
  is_from_visitor: boolean;
  created_at: string;
  visitor_id: string;
  conversation_id: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface Conversation {
  id: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface ClientUser {
  id: string;
  company_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface Company {
  id: string;
  name: string;
  logo_url?: string;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'contacts' | 'messages'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check if user is authenticated (try session storage first for impersonated users)
      const storedUser = sessionStorage.getItem('atlas_user');
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.authenticated) {
          // Set client user data from session storage
          setClientUser({
            id: userData.company_id,
            company_id: userData.company_id,
            email: userData.email,
            name: userData.name
          });
          
          setCompany({
            id: userData.company_id,
            name: userData.company_name || 'Your Business'
          });

          // Load contacts, messages, and conversations
          await Promise.all([
            loadContacts(userData.company_id),
            loadMessages(userData.company_id),
            loadConversations(userData.company_id)
          ]);
        } else {
          throw new Error('Not authenticated');
        }
      } else {
        // Check Supabase session
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError || !session?.user?.email) {
          router.push('/login');
          return;
        }

        // Get client user and company data
        const response = await fetch('/api/dashboard/user-data', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load user data');
        }

        const userData = await response.json();
        setClientUser(userData.user);
        setCompany(userData.company);

        // Load contacts, messages, and conversations
        await Promise.all([
          loadContacts(userData.user.company_id),
          loadMessages(userData.user.company_id),
          loadConversations(userData.user.company_id)
        ]);
      }

    } catch (error) {
      console.error('Auth/data loading error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async (companyId: string) => {
    try {
      const response = await fetch(`/api/dashboard/contacts?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadMessages = async (companyId: string) => {
    try {
      const response = await fetch(`/api/dashboard/messages?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadConversations = async (companyId: string) => {
    try {
      const response = await fetch(`/api/dashboard/conversations?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/dashboard/conversation-messages?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setConversationMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };

  const handleSendSMS = (phoneNumber: string, prefilledMessage?: string) => {
    if (!phoneNumber) {
      alert('No phone number available for this contact');
      return;
    }
    
    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Create SMS URL for iOS devices
    const message = prefilledMessage || replyMessage || 'Hi! This is a message from ' + (company?.name || 'your HVAC company');
    const smsUrl = `sms:${cleanPhone}&body=${encodeURIComponent(message)}`;
    
    // Open SMS app
    window.open(smsUrl, '_self');
  };

  const handleSendEmail = (email: string, subject?: string, prefilledMessage?: string) => {
    if (!email) {
      alert('No email address available for this contact');
      return;
    }
    
    const emailSubject = subject || `Message from ${company?.name || 'Your HVAC Company'}`;
    const message = prefilledMessage || replyMessage || 'Hello! Thank you for your interest in our HVAC services.';
    
    // Create mailto URL
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;
    
    // Open email client
    window.open(mailtoUrl, '_self');
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedConversation) return;

    setIsSendingReply(true);
    try {
      const response = await fetch('/api/dashboard/send-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation,
          message: replyMessage.trim(),
          companyId: clientUser?.company_id
        })
      });

      if (response.ok) {
        setReplyMessage('');
        await loadConversationMessages(selectedConversation);
        await loadConversations(clientUser!.company_id);
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSignOut = async () => {
    // Clear session storage
    sessionStorage.removeItem('atlas_user');
    // Also clear Supabase session
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/dashboard/create-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newContact,
          companyId: clientUser?.company_id
        })
      });

      if (response.ok) {
        setNewContact({ name: '', email: '', phone: '', company: '', notes: '' });
        setShowCreateContact(false);
        await loadContacts(clientUser!.company_id);
      } else {
        throw new Error('Failed to create contact');
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{company?.name} - Dashboard</title>
        <meta name="description" content="Manage your website leads and messages" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Left Sidebar */}
          <div className="w-64 bg-white shadow-md">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {company?.logo_url && (
                  <img 
                    src={company.logo_url} 
                    alt={`${company.name} logo`}
                    className="h-10 w-10 object-contain rounded"
                  />
                )}
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{company?.name}</h1>
                  <p className="text-sm text-gray-500">Dashboard</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveSection('contacts')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === 'contacts'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">Contacts ({contacts.length})</span>
                </button>
                <button
                  onClick={() => setActiveSection('messages')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === 'messages'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">All Messages ({messages.length})</span>
                </button>
              </div>
            </nav>

            {/* User Info & Sign Out */}
            <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{clientUser?.name || 'Business Owner'}</p>
                  <p className="text-xs text-gray-500 truncate">{clientUser?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-3 inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  title="Sign out"
                >
                  <span className="text-xs">Exit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <main className="p-6">
              {activeSection === 'contacts' && (
                <div>
                  <div className="mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Website Contacts</h2>
                        <p className="text-gray-600">Visitors who provided their contact information</p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowCreateContact(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Contact</span>
                        </button>
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span>Import</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                      <div className="text-6xl mb-4">📞</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
                      <p className="text-gray-500">When visitors chat on your website and provide their contact info, they'll appear here.</p>
                    </div>
                  ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Company
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {contacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {contact.email ? (
                                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                      {contact.email}
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">No email</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {contact.phone ? (
                                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                      {contact.phone}
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">No phone</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{contact.company_name || company?.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(contact.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'messages' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Message Center</h2>
                    <p className="text-gray-600">Respond to customer inquiries and manage conversations</p>
                  </div>

                  {conversations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                      <p className="text-gray-500">When visitors start chatting on your website, their conversations will appear here.</p>
                    </div>
                  ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden h-[600px] flex">
                      {/* Conversations List */}
                      <div className="w-1/3 border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                          <h3 className="font-semibold text-gray-900">Conversations ({conversations.length})</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {conversations.map((conversation) => (
                            <div
                              key={conversation.id}
                              onClick={() => {
                                setSelectedConversation(conversation.id);
                                loadConversationMessages(conversation.id);
                              }}
                              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-gray-900 truncate">{conversation.contact_name}</h4>
                                    {conversation.unread_count > 0 && (
                                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                        {conversation.unread_count}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 truncate mt-1">{conversation.last_message}</p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    {conversation.contact_phone && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSendSMS(conversation.contact_phone!);
                                        }}
                                        className="text-green-600 hover:text-green-800 text-xs font-medium flex items-center space-x-1"
                                      >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.2c.27-.27.35-.67.24-1.02C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
                                        </svg>
                                        <span>SMS</span>
                                      </button>
                                    )}
                                    {conversation.contact_email && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSendEmail(conversation.contact_email!);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center space-x-1"
                                      >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                        </svg>
                                        <span>Email</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(conversation.last_message_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conversation Messages */}
                      <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                          <>
                            {/* Messages Header */}
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  {(() => {
                                    const conv = conversations.find(c => c.id === selectedConversation);
                                    return conv ? (
                                      <div>
                                        <h3 className="font-semibold text-gray-900">{conv.contact_name}</h3>
                                        <div className="flex items-center space-x-4 mt-1">
                                          {conv.contact_phone && (
                                            <span className="text-sm text-gray-600">📞 {conv.contact_phone}</span>
                                          )}
                                          {conv.contact_email && (
                                            <span className="text-sm text-gray-600">✉️ {conv.contact_email}</span>
                                          )}
                                        </div>
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                                <div className="flex space-x-2">
                                  {(() => {
                                    const conv = conversations.find(c => c.id === selectedConversation);
                                    return conv ? (
                                      <>
                                        {conv.contact_phone && (
                                          <button
                                            onClick={() => handleSendSMS(conv.contact_phone!, 'Hi! Thanks for reaching out. How can I help you today?')}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center space-x-1"
                                          >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                              <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.2c.27-.27.35-.67.24-1.02C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
                                            </svg>
                                            <span>Send SMS</span>
                                          </button>
                                        )}
                                        {conv.contact_email && (
                                          <button
                                            onClick={() => handleSendEmail(conv.contact_email!, 'Thank you for your inquiry', 'Hello! Thank you for reaching out about our HVAC services. How can we help you today?')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center space-x-1"
                                          >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                            </svg>
                                            <span>Send Email</span>
                                          </button>
                                        )}
                                      </>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                              {conversationMessages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${message.is_from_visitor ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div className={`max-w-[70%] px-4 py-3 rounded-lg shadow-sm ${
                                    message.is_from_visitor 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-white text-gray-900 border border-gray-200'
                                  }`}>
                                    <p className="text-sm">{message.message}</p>
                                    <p className={`text-xs mt-1 ${
                                      message.is_from_visitor ? 'text-blue-100' : 'text-gray-500'
                                    }`}>
                                      {message.is_from_visitor ? 'Customer' : 'You'} • {new Date(message.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Reply Input */}
                            <div className="border-t border-gray-200 p-4 bg-white">
                              <form onSubmit={handleReplySubmit} className="flex space-x-3">
                                <div className="flex-1">
                                  <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Type your response..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows={2}
                                    disabled={isSendingReply}
                                  />
                                </div>
                                <div className="flex flex-col space-y-2">
                                  <button
                                    type="submit"
                                    disabled={!replyMessage.trim() || isSendingReply}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                  >
                                    {isSendingReply ? 'Sending...' : 'Send'}
                                  </button>
                                  {(() => {
                                    const conv = conversations.find(c => c.id === selectedConversation);
                                    return conv?.contact_phone ? (
                                      <button
                                        type="button"
                                        onClick={() => handleSendSMS(conv.contact_phone!, replyMessage)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                      >
                                        Send SMS
                                      </button>
                                    ) : null;
                                  })()}
                                </div>
                              </form>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-4xl mb-4">💬</div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                              <p className="text-gray-500">Choose a conversation from the left to start responding</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Create Contact Modal */}
      {showCreateContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Add New Contact</h3>
                <button
                  onClick={() => setShowCreateContact(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateContact} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company/Business
                  </label>
                  <input
                    type="text"
                    value={newContact.company}
                    onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newContact.notes}
                    onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes about this contact"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateContact(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newContact.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}