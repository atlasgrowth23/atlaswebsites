import React, { useState, useEffect } from 'react';
import Layout from '@/components/software/Layout';
import ProtectedRoute from '@/components/software/ProtectedRoute';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  
  useEffect(() => {
    // In a real implementation, this would fetch from the API
    const fetchMessages = async () => {
      // Simulated API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Sample data - in real app would come from API
      const sampleMessages: Message[] = [
        {
          id: 1,
          sender: 'John Smith',
          content: 'I need help with my AC, it stopped working yesterday. The fan is running but no cold air is coming out. It was working fine until last night.',
          timestamp: '2025-05-14T09:30:00',
          isRead: false
        },
        {
          id: 2,
          sender: 'Sarah Johnson',
          content: 'Looking for a quote on a new heat pump installation. My current system is about 15 years old and I think it\'s time for a replacement.',
          timestamp: '2025-05-14T11:15:00',
          isRead: false
        },
        {
          id: 3,
          sender: 'Michael Brown',
          content: 'My furnace is making a strange noise. Is it possible to get someone to look at it this week? It sounds like a grinding noise when it turns on.',
          timestamp: '2025-05-13T16:45:00',
          isRead: true
        },
        {
          id: 4,
          sender: 'Emily Davis',
          content: 'Need thermostat replaced, the old one is not working properly. It\'s not maintaining the temperature correctly.',
          timestamp: '2025-05-13T14:20:00',
          isRead: true
        }
      ];
      
      setMessages(sampleMessages);
      setLoading(false);
    };
    
    fetchMessages();
  }, []);
  
  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
    
    // Mark as read in UI
    setMessages(prevMessages => 
      prevMessages.map(m => 
        m.id === message.id ? { ...m, isRead: true } : m
      )
    );
    
    // In a real app, would also call API to mark as read
  };
  
  const handleSendReply = () => {
    if (!newReply.trim() || !selectedMessage) return;
    
    // In a real app, would send to API
    alert(`Reply sent to ${selectedMessage.sender}: ${newReply}`);
    setNewReply('');
  };
  
  const createContact = () => {
    if (!selectedMessage) return;
    alert(`Creating contact for ${selectedMessage.sender}`);
    // Would redirect to contact creation form pre-filled with sender info
  };
  
  const createJob = () => {
    if (!selectedMessage) return;
    alert(`Creating job based on message from ${selectedMessage.sender}`);
    // Would redirect to job creation form with message content
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };
  
  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <ProtectedRoute>
      <Layout title="Messages">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Messages</h2>
          <div className="text-sm text-gray-500">
            {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden flex h-[calc(100vh-14rem)]">
          {/* Message List */}
          <div className="w-1/3 border-r">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-y-auto h-full">
                {messages.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No messages yet
                  </div>
                ) : (
                  <ul>
                    {messages.map(message => (
                      <li 
                        key={message.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                          selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleMessageSelect(message)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-medium ${!message.isRead ? 'text-blue-600' : ''}`}>
                            {message.sender}
                            {!message.isRead && <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {message.content}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          
          {/* Message Detail */}
          <div className="flex-1 flex flex-col">
            {selectedMessage ? (
              <>
                <div className="p-4 border-b">
                  <h3 className="font-bold">{selectedMessage.sender}</h3>
                  <span className="text-sm text-gray-500">
                    {formatDate(selectedMessage.timestamp)}
                  </span>
                </div>
                
                <div className="p-4 overflow-y-auto flex-grow">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </div>
                
                <div className="p-4 border-t">
                  <div className="flex">
                    <textarea
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="Type your reply here..."
                      className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!newReply.trim()}
                      className="bg-blue-600 text-white px-4 rounded-r-md disabled:bg-blue-300"
                    >
                      Send
                    </button>
                  </div>
                  
                  <div className="flex mt-4 space-x-2">
                    <button 
                      onClick={createContact}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Create Contact
                    </button>
                    <button 
                      onClick={createJob}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Create Job
                    </button>
                    <button 
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a message to view
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}