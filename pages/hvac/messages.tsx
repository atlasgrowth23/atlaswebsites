import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { getCompanyBySlug } from '@/lib/supabase-db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Company {
  id: string;
  name: string;
  slug: string;
  email_1?: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  status: 'new_lead' | 'existing_customer';
}

interface Conversation {
  id: string;
  contact_id: string;
  service_type: string;
  status: 'active' | 'closed' | 'archived';
  last_message_at: string;
  started_at: string;
  contact?: Contact;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  contact_id: string;
  message: string;
  is_from_visitor: boolean;
  message_type: 'text' | 'system';
  created_at: string;
}

export default function HVACMessages() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  // Load company on router ready
  useEffect(() => {
    if (router.isReady) {
      loadCompany();
    }
  }, [router.isReady]);

  // Load conversations when company or demo mode changes
  useEffect(() => {
    if (company) {
      loadConversations();
    }
  }, [company, demoMode]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && company) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, company]);

  const loadCompany = async () => {
    try {
      const companySlug = router.query.company as string;
      
      if (!companySlug) {
        setError('Company parameter is required. Please access via ?company=your-company-slug');
        setLoading(false);
        return;
      }

      const companyData = await getCompanyBySlug(companySlug);
      
      if (!companyData) {
        setError(`Company not found: ${companySlug}`);
        setLoading(false);
        return;
      }

      setCompany(companyData);
      setError(null);
    } catch (err) {
      console.error('Error loading company:', err);
      setError('Failed to load company');
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!company) return;
    
    try {
      setLoading(true);
      setError(null);

      // Load conversations with contact info
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('hvac_conversations')
        .select(`
          *,
          hvac_contacts!inner(
            id,
            first_name,
            last_name,
            phone,
            email,
            status
          )
        `)
        .eq('company_id', company.id)
        .eq('is_demo', demoMode)
        .order('last_message_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Transform data to include contact info
      const conversations: Conversation[] = (conversationsData || []).map(conv => ({
        id: conv.id,
        contact_id: conv.contact_id,
        service_type: conv.service_type,
        status: conv.status,
        last_message_at: conv.last_message_at,
        started_at: conv.started_at,
        contact: Array.isArray(conv.hvac_contacts) ? conv.hvac_contacts[0] : conv.hvac_contacts,
        unread_count: 0 // TODO: Calculate unread messages
      }));

      setConversations(conversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!company) return;
    
    try {
      const { data, error } = await supabase
        .from('hvac_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('company_id', company.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // TODO: Implement send message API for business responses
      // This would create a message with is_from_visitor = false
      
      setNewMessage('');
      // Reload messages after sending
      loadMessages(selectedConversation.id);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const getServiceBadge = (serviceType: string) => {
    const colors = {
      'Repair': 'bg-red-100 text-red-800',
      'Emergency': 'bg-red-100 text-red-800', 
      'Install': 'bg-blue-100 text-blue-800',
      'Tune Up': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[serviceType] || 'bg-gray-100 text-gray-800'}`}>
        {serviceType}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {company ? `${company.name} - Messages` : 'Messages'}
          </h1>
          
          {/* Demo Mode Toggle */}
          <div className="flex items-center space-x-3">
            {company && (
              <button
                onClick={() => window.open(`https://atlasgrowth.ai/${company.slug}`, '_blank')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Website
              </button>
            )}
            <span className="text-sm font-medium text-gray-700">Demo Mode</span>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                demoMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  demoMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-500">
              {demoMode ? 'Demo Data' : 'Live Data'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => router.push(`/hvac/contacts?company=${router.query.company}`)}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Contacts
            </button>
            <button
              onClick={() => router.push(`/hvac/messages?company=${router.query.company}`)}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Conversation List */}
          <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading conversations...</div>
              ) : error ? (
                <div className="p-6 text-center text-red-500">{error}</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No conversations yet</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {conversation.contact?.first_name} {conversation.contact?.last_name}
                            </h4>
                            {getServiceBadge(conversation.service_type)}
                          </div>
                          <div className="space-y-1">
                            {conversation.contact?.phone && (
                              <p className="text-xs text-gray-600">{conversation.contact.phone}</p>
                            )}
                            {conversation.contact?.email && (
                              <p className="text-xs text-gray-600">{conversation.contact.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {formatDate(conversation.last_message_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages View */}
          <div className="flex-1 bg-white flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedConversation.contact?.first_name} {selectedConversation.contact?.last_name}
                      </h2>
                      <div className="flex items-center space-x-3 mt-1">
                        {getServiceBadge(selectedConversation.service_type)}
                        <span className="text-sm text-gray-500">
                          Started {formatDate(selectedConversation.started_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_from_visitor ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] px-4 py-2 rounded-lg ${
                        message.is_from_visitor
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-blue-600 text-white'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.message}</p>
                        <div className={`text-xs mt-1 ${
                          message.is_from_visitor ? 'text-gray-500' : 'text-blue-100'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}