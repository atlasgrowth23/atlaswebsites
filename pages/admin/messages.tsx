import React, { useState, useEffect } from 'react';
import UnifiedAdminLayout from '../../components/UnifiedAdminLayout';
import { supabase } from '../../lib/supabase';

interface Thread {
  id: string;
  subject: string;
  company_id?: string;
  shared: boolean;
  created_at: string;
  updated_at: string;
  latest_message?: any;
  message_count: number;
  has_unread: boolean;
}

interface Message {
  id: string;
  thread_id: string;
  kind: 'email' | 'note';
  direction?: 'inbound' | 'outbound';
  author_id: string;
  gmail_thread_id?: string;
  body_html: string;
  subject?: string;
  to_email?: string;
  from_email?: string;
  created_at: string;
  is_starred: boolean;
  demo?: boolean;
  author?: {
    email: string;
    raw_user_meta_data?: any;
  };
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [filter, setFilter] = useState<'inbox' | 'sent' | 'shared' | 'notes'>('inbox');
  const [isComposing, setIsComposing] = useState(false);
  
  // Composer state
  const [messageKind, setMessageKind] = useState<'email' | 'note'>('email');
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    loadDemoSettings();
    loadThreads();
  }, []);

  useEffect(() => {
    if (demoMode) {
      createDemoData();
    } else {
      removeDemoData();
    }
  }, [demoMode]);

  // Auto-poll for new messages every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!demoMode) {
        pollGmailInbox();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [demoMode]);

  const loadDemoSettings = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const response = await fetch('/api/admin/settings/demo-mode', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDemoMode(data.demoMode || false);
      }
    } catch (error) {
      console.error('Error loading demo settings:', error);
    }
  };

  const toggleDemoMode = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const newDemoMode = !demoMode;
      
      const response = await fetch('/api/admin/settings/demo-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({ demoMode: newDemoMode }),
      });

      if (response.ok) {
        setDemoMode(newDemoMode);
      }
    } catch (error) {
      console.error('Error toggling demo mode:', error);
    }
  };

  const createDemoData = async () => {
    // Create demo thread and messages
    const demoThread = {
      id: 'demo-thread-1',
      subject: 'Welcome to Atlas Admin',
      shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 2,
      has_unread: true,
      latest_message: {
        kind: 'email',
        is_starred: false
      }
    };

    const demoMessages = [
      {
        id: 'demo-msg-1',
        thread_id: 'demo-thread-1',
        kind: 'email' as const,
        direction: 'inbound' as const,
        author_id: 'demo-user',
        body_html: '<p>Welcome to the new Atlas admin interface! This is a demo email to show you how the system works.</p>',
        subject: 'Welcome to Atlas Admin',
        from_email: 'demo@example.com',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_starred: false,
        demo: true,
        author: { email: 'demo@example.com' }
      },
      {
        id: 'demo-msg-2',
        thread_id: 'demo-thread-1',
        kind: 'note' as const,
        author_id: 'current-user',
        body_html: '<p>This is an internal note. Only team members can see this.</p>',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        is_starred: false,
        demo: true,
        author: { email: 'nicholas@atlasgrowth.ai' }
      }
    ];

    setThreads([demoThread]);
    if (selectedThread?.id === 'demo-thread-1') {
      setMessages(demoMessages);
    }
  };

  const removeDemoData = () => {
    setThreads(prev => prev.filter(t => !t.id.startsWith('demo-')));
    setMessages(prev => prev.filter(m => !m.demo));
    if (selectedThread?.id.startsWith('demo-')) {
      setSelectedThread(null);
    }
  };

  const pollGmailInbox = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      await fetch('/api/admin/messages/poll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      // Reload threads after polling
      loadThreads();
    } catch (error) {
      console.error('Error polling Gmail:', error);
    }
  };

  const loadThreads = async () => {
    if (demoMode) return; // Skip loading real data in demo mode
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/messages/threads', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    if (threadId.startsWith('demo-')) {
      // Demo messages are already set
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const response = await fetch(`/api/admin/messages/${threadId}`, {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (messageKind === 'email' && (!composeData.to || !composeData.subject || !composeData.body)) {
      return;
    }
    if (messageKind === 'note' && !composeData.body) {
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const response = await fetch('/api/admin/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          kind: messageKind,
          to: messageKind === 'email' ? composeData.to : undefined,
          subject: messageKind === 'email' ? composeData.subject : undefined,
          body: composeData.body,
          threadId: selectedThread?.id
        }),
      });

      if (response.ok) {
        setComposeData({ to: '', subject: '', body: '' });
        setIsComposing(false);
        if (selectedThread) {
          await loadMessages(selectedThread.id);
        }
        await loadThreads();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getFilteredThreads = () => {
    return threads.filter(thread => {
      switch (filter) {
        case 'shared':
          return thread.shared;
        case 'notes':
          return thread.latest_message?.kind === 'note';
        case 'sent':
          return thread.latest_message?.direction === 'outbound';
        default:
          return true;
    }
    });
  };

  const getFilterIcon = (filterType: string) => {
    switch (filterType) {
      case 'inbox': return '📧';
      case 'sent': return '📤';
      case 'shared': return '👥';
      case 'notes': return '📝';
      default: return '';
    }
  };

  const getUnreadCount = (filterType: string) => {
    const filtered = threads.filter(thread => {
      switch (filterType) {
        case 'shared': return thread.shared && thread.has_unread;
        case 'notes': return thread.latest_message?.kind === 'note' && thread.has_unread;
        case 'sent': return thread.latest_message?.direction === 'outbound' && thread.has_unread;
        default: return thread.has_unread;
      }
    });
    return filtered.length;
  };

  if (loading) {
    return (
      <UnifiedAdminLayout currentPage="messages">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="ml-3 text-lg text-gray-600">Loading messages...</div>
        </div>
      </UnifiedAdminLayout>
    );
  }

  return (
    <UnifiedAdminLayout currentPage="messages">
      <div className={`h-full flex ${demoMode ? 'bg-amber-50' : 'bg-white'} transition-colors duration-500`}>
        {demoMode && (
          <div className="absolute top-4 left-4 z-10 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
            🎭 DEMO MODE
          </div>
        )}

        {/* Demo Mode Toggle */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-3">
          <span className="text-sm text-gray-600">Demo Mode</span>
          <button
            onClick={toggleDemoMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              demoMode ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                demoMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Left Sidebar - Filters */}
        <div className="w-56 bg-gray-50 border-r border-gray-200 p-6">
          <div className="space-y-2">
            {(['inbox', 'sent', 'shared', 'notes'] as const).map((filterType) => {
              const unreadCount = getUnreadCount(filterType);
              return (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    filter === filterType
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-700 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getFilterIcon(filterType)}</span>
                    <span className="capitalize">{filterType}</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      filter === filterType
                        ? 'bg-white text-blue-500'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread List */}
        <div className="w-80 bg-white border-r border-gray-200">
          {/* New Message Button */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setIsComposing(!isComposing)}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                isComposing
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25'
              }`}
            >
              {isComposing ? '← Back to Threads' : '✍️ New Message'}
            </button>
          </div>

          {/* Composer */}
          {isComposing && (
            <div className="p-4 border-b border-gray-200 bg-gray-50 animate-in slide-in-from-top duration-300">
              <div className="space-y-4">
                {/* Message Type Selector */}
                <div className="flex rounded-lg bg-white p-1 shadow-sm">
                  <button
                    onClick={() => setMessageKind('email')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      messageKind === 'email'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📧 Email
                  </button>
                  <button
                    onClick={() => setMessageKind('note')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      messageKind === 'note'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📝 Note
                  </button>
                </div>

                {/* Email Fields */}
                {messageKind === 'email' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <input
                      type="email"
                      placeholder="To: recipient@example.com"
                      value={composeData.to}
                      onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Subject"
                      value={composeData.subject}
                      onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Message Body */}
                <textarea
                  placeholder={messageKind === 'email' ? 'Compose your email...' : 'Write an internal note...'}
                  value={composeData.body}
                  onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />

                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={messageKind === 'email' ? (!composeData.to || !composeData.subject || !composeData.body) : !composeData.body}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Send {messageKind === 'email' ? 'Email' : 'Note'}
                </button>
              </div>
            </div>
          )}

          {/* Thread List */}
          <div className="overflow-y-auto h-full">
            {getFilteredThreads().map((thread) => (
              <div
                key={thread.id}
                onClick={() => {
                  setSelectedThread(thread);
                  loadMessages(thread.id);
                  setIsComposing(false);
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  selectedThread?.id === thread.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {thread.subject || 'No Subject'}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {thread.latest_message && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          thread.latest_message.kind === 'email'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {thread.latest_message.kind === 'email' ? '📧' : '📝'}
                          {thread.latest_message.kind.toUpperCase()}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(thread.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {thread.has_unread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 animate-pulse"></div>
                  )}
                </div>
              </div>
            ))}

            {getFilteredThreads().length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">📭</div>
                <div className="text-lg font-medium">No messages found</div>
                <div className="text-sm mt-1">
                  {demoMode ? 'Try toggling demo mode off to see real messages' : 'Start a conversation to see messages here'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Thread View */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedThread.subject || 'No Subject'}
                </h2>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedThread.message_count} message{selectedThread.message_count !== 1 ? 's' : ''} • Last updated {new Date(selectedThread.updated_at).toLocaleString()}
                </div>
              </div>

              {/* Messages Timeline */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message, index) => (
                  <div key={message.id} className="group">
                    <div className={`max-w-4xl ${
                      message.kind === 'note' 
                        ? 'ml-8' 
                        : message.direction === 'outbound' 
                          ? 'ml-auto mr-8' 
                          : 'mr-8'
                    }`}>
                      {/* Message Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            message.direction === 'outbound' || message.kind === 'note'
                              ? 'bg-blue-500'
                              : 'bg-gray-500'
                          }`}>
                            {message.author?.email?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {message.author?.email === 'nicholas@atlasgrowth.ai' ? 'Nicholas' : 
                               message.author?.email === 'jared@atlasgrowth.ai' ? 'Jared' :
                               message.from_email || message.author?.email || 'Unknown'}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                                message.kind === 'email'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {message.kind === 'email' ? '📧' : '📝'}
                                {message.kind.toUpperCase()}
                              </span>
                              {message.direction && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                                  message.direction === 'inbound'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {message.direction === 'inbound' ? '↓ IN' : '↑ OUT'}
                                </span>
                              )}
                              <span>{new Date(message.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className={`rounded-xl p-4 shadow-sm ${
                        message.kind === 'note'
                          ? 'bg-gray-50 border-l-4 border-gray-300'
                          : message.direction === 'outbound'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-white border border-gray-200'
                      }`}>
                        {message.subject && message.kind === 'email' && (
                          <div className="font-medium text-gray-900 mb-2 pb-2 border-b border-gray-200">
                            {message.subject}
                          </div>
                        )}
                        <div 
                          className={`prose max-w-none ${
                            message.kind === 'note' ? 'prose-sm' : ''
                          }`}
                          dangerouslySetInnerHTML={{ __html: message.body_html }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <div className="text-4xl mb-4">💬</div>
                    <div className="text-lg font-medium">No messages in this thread</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📬</div>
                <div className="text-xl font-medium mb-2">Select a thread to view messages</div>
                <div className="text-sm">
                  Choose a conversation from the list to see the message timeline
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </UnifiedAdminLayout>
  );
}