import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import PortalLayout from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';

interface Message {
  id: number;
  company_id: number;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message_content: string;
  created_at: string;
  read: boolean;
}

export default function MessagesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Get business slug from localStorage
    const storedBusinessSlug = localStorage.getItem('businessSlug');
    setBusinessSlug(storedBusinessSlug);
    
    if (!storedBusinessSlug) {
      setIsLoading(false);
      return;
    }
    
    // Fetch messages from the API
    async function fetchMessages() {
      try {
        const response = await fetch(`/api/messages?businessSlug=${storedBusinessSlug}`);
        const data = await response.json();
        
        if (data.success && data.messages) {
          setMessages(data.messages);
        } else {
          console.error('Failed to fetch messages:', data.message);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMessages();
  }, []);

  // Handle marking a message as read
  const handleMarkAsRead = async (messageId: number) => {
    try {
      const response = await fetch('/api/mark-message-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state to mark message as read
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId ? { ...msg, read: true } : msg
          )
        );
        
        // If the selected message is the one being marked as read, update it too
        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage({ ...selectedMessage, read: true });
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Filter messages based on active tab and search query
  const filteredMessages = messages.filter(message => {
    // First filter by tab
    if (activeTab === 'unread' && message.read) return false;
    if (activeTab === 'read' && !message.read) return false;
    
    // Then filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        message.sender_name.toLowerCase().includes(query) ||
        message.sender_email.toLowerCase().includes(query) ||
        message.message_content.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Sort messages by date (newest first)
  const sortedMessages = [...filteredMessages].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // When a message is selected, mark it as read if it's not already
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      handleMarkAsRead(message.id);
    }
  };

  return (
    <>
      <Head>
        <title>Messages | HVAC Business Portal</title>
      </Head>
      
      <PortalLayout businessSlug={businessSlug || undefined}>
        <div className="flex flex-col h-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Messages</h1>
            <p className="text-gray-600">
              View and respond to customer inquiries and messages
            </p>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="flex space-x-2">
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors 
                  ${activeTab === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center
                  ${activeTab === 'unread' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setActiveTab('unread')}
              >
                Unread
                {messages.filter(m => !m.read).length > 0 && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${activeTab === 'unread' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                    {messages.filter(m => !m.read).length}
                  </span>
                )}
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors 
                  ${activeTab === 'read' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setActiveTab('read')}
              >
                Read
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {/* Messages List */}
              <div className="md:col-span-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">
                    {sortedMessages.length} {sortedMessages.length === 1 ? 'Message' : 'Messages'}
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {sortedMessages.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      {searchQuery 
                        ? 'No messages found matching your search' 
                        : activeTab === 'unread' 
                          ? 'No unread messages' 
                          : activeTab === 'read'
                            ? 'No read messages'
                            : 'No messages found'}
                    </div>
                  ) : (
                    sortedMessages.map(message => (
                      <div 
                        key={message.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        } ${!message.read ? 'font-semibold' : ''}`}
                        onClick={() => handleSelectMessage(message)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-gray-900">{message.sender_name}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 mb-2">{message.sender_email}</div>
                        <p className={`text-sm ${!message.read ? 'text-gray-900' : 'text-gray-600'} line-clamp-2`}>
                          {message.message_content}
                        </p>
                        {!message.read && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Message Detail */}
              <div className="md:col-span-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
                {selectedMessage ? (
                  <div className="flex flex-col h-full">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-lg font-medium text-gray-900">{selectedMessage.sender_name}</h2>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="mr-4">{selectedMessage.sender_email}</span>
                            {selectedMessage.sender_phone && (
                              <span>{selectedMessage.sender_phone}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(selectedMessage.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto">
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-line">{selectedMessage.message_content}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="space-x-2">
                          <Button variant="outline" size="sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Reply
                          </Button>
                          <Button variant="outline" size="sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                            Archive
                          </Button>
                        </div>
                        
                        <div>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No message selected</h3>
                    <p className="text-gray-500 max-w-md">
                      Select a message from the list to view its contents here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </PortalLayout>
    </>
  );
}