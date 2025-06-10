import React, { useState, useEffect } from 'react';
import SimpleAdminLayout from '../../components/SimpleAdminLayout';
import { getCurrentUser, signInWithGoogle, User } from '../../lib/auth';
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
  author_id: string;
  gmail_thread_id?: string;
  body_html: string;
  created_at: string;
  is_starred: boolean;
  author?: {
    email: string;
    raw_user_meta_data?: any;
  };
}

export default function MessagesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isNote, setIsNote] = useState(false);
  const [filter, setFilter] = useState<'inbox' | 'sent' | 'shared' | 'starred'>('inbox');
  const [showJaredInbox, setShowJaredInbox] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        await signInWithGoogle();
        return;
      }
      setUser(currentUser);
      await loadThreads();
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadThreads = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

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
    }
  };

  const loadMessages = async (threadId: string) => {
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
    if (!newMessage.trim() || !selectedThread) return;

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
          thread_id: selectedThread.id,
          body_html: newMessage,
          is_note: isNote,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages(selectedThread.id);
        await loadThreads();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredThreads = threads.filter(thread => {
    switch (filter) {
      case 'shared':
        return thread.shared;
      case 'starred':
        return thread.latest_message?.is_starred;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <SimpleAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </SimpleAdminLayout>
    );
  }

  if (!user) {
    return (
      <SimpleAdminLayout>
        <div className="flex items-center justify-center h-64">
          <button
            onClick={signInWithGoogle}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Sign in with Google
          </button>
        </div>
      </SimpleAdminLayout>
    );
  }

  return (
    <SimpleAdminLayout>
      <div className="h-full flex">
        {/* Sidebar */}
        <div className="w-40 bg-gray-50 p-4 border-r">
          <div className="space-y-2">
            <button
              onClick={() => setFilter('inbox')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                filter === 'inbox' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                filter === 'sent' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setFilter('shared')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                filter === 'shared' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              Shared
            </button>
            <button
              onClick={() => setFilter('starred')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                filter === 'starred' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              ⭐ Starred
            </button>
          </div>
          
          {user.role === 'super_admin' && (
            <div className="mt-6 pt-4 border-t">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={showJaredInbox}
                  onChange={(e) => setShowJaredInbox(e.target.checked)}
                  className="mr-2"
                />
                👁 Show Jared's inbox
              </label>
            </div>
          )}
        </div>

        {/* Thread List */}
        <div className="w-80 bg-white border-r">
          <div className="p-4 border-b">
            <input
              type="text"
              placeholder="🔍 Search messages..."
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          
          <div className="overflow-y-auto h-full">
            {filteredThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => {
                  setSelectedThread(thread);
                  loadMessages(thread.id);
                }}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedThread?.id === thread.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="font-medium text-sm truncate">{thread.subject}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {thread.latest_message && (
                    <>
                      <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${
                        thread.latest_message.kind === 'email' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {thread.latest_message.kind.toUpperCase()}
                      </span>
                      {new Date(thread.updated_at).toLocaleDateString()}
                    </>
                  )}
                  {thread.has_unread && (
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline/Composer */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              {/* Timeline */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">
                            {message.author?.email === 'nicholas@atlasgrowth.ai' ? 'Nicholas' : 'Jared'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            message.kind === 'email' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {message.kind.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {message.kind === 'note' ? (
                        <div className="bg-gray-100 p-3 rounded">
                          <div dangerouslySetInnerHTML={{ __html: message.body_html }} />
                        </div>
                      ) : (
                        <div className="prose max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: message.body_html }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Composer */}
              <div className="border-t p-4 bg-gray-50">
                <div className="mb-3">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={isNote}
                      onChange={(e) => setIsNote(e.target.checked)}
                      className="mr-2"
                    />
                    Internal note only
                  </label>
                </div>
                
                <div className="flex space-x-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isNote ? "Add internal note..." : "Compose email..."}
                    className="flex-1 px-3 py-2 border rounded-md resize-none"
                    rows={3}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a thread to view messages
            </div>
          )}
        </div>
      </div>
    </SimpleAdminLayout>
  );
}