import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [newReply, setNewReply] = useState('');

  useEffect(() => {
    // In a real implementation, this would fetch from the API
    const mockMessages: Message[] = [
      {
        id: 1,
        sender: 'John Smith',
        content: 'I need help with my AC, it stopped working yesterday.',
        timestamp: '2025-05-14T09:30:00',
        isRead: true
      },
      {
        id: 2,
        sender: 'Sarah Johnson',
        content: 'Looking for a quote on a new heat pump installation.',
        timestamp: '2025-05-14T11:15:00',
        isRead: false
      },
      {
        id: 3,
        sender: 'Michael Brown',
        content: 'My furnace is making a strange noise. Is it possible to get someone to look at it this week?',
        timestamp: '2025-05-13T16:45:00',
        isRead: false
      },
      {
        id: 4,
        sender: 'Emily Davis',
        content: 'Need thermostat replaced, the old one is not working properly.',
        timestamp: '2025-05-13T14:20:00',
        isRead: true
      }
    ];
    
    setMessages(mockMessages);
    setLoading(false);
  }, []);

  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
    
    // Mark as read
    setMessages(prevMessages => 
      prevMessages.map(m => 
        m.id === message.id ? { ...m, isRead: true } : m
      )
    );
  };

  const handleSendReply = () => {
    if (!newReply.trim() || !selectedMessage) return;
    
    alert(`Reply sent to ${selectedMessage.sender}: ${newReply}`);
    setNewReply('');
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

  return (
    <PortalLayout title="Messages" activeTab="messages">
      <div className="flex h-[calc(100vh-14rem)] bg-white rounded-lg shadow overflow-hidden">
        {/* Message List */}
        <div className="w-1/3 border-r">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">Messages</h2>
            <p className="text-sm text-gray-500">
              {messages.filter(m => !m.isRead).length} unread
            </p>
          </div>
          
          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin inline-block h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
              </div>
            ) : (
              <ul>
                {messages.map(message => (
                  <li 
                    key={message.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                    } ${!message.isRead ? 'font-semibold' : ''}`}
                    onClick={() => handleMessageSelect(message)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`${!message.isRead ? 'text-blue-600' : ''}`}>
                        {message.sender}
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
        </div>
        
        {/* Message Detail */}
        <div className="w-2/3 flex flex-col">
          {selectedMessage ? (
            <>
              <div className="p-4 border-b">
                <h3 className="font-bold">{selectedMessage.sender}</h3>
                <span className="text-sm text-gray-500">
                  {formatDate(selectedMessage.timestamp)}
                </span>
              </div>
              
              <div className="p-4 flex-grow overflow-y-auto">
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <p>{selectedMessage.content}</p>
                </div>
                
                {/* Here you would map through conversation history */}
              </div>
              
              <div className="p-4 border-t">
                <div className="flex">
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your reply..."
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
                
                <div className="flex mt-2 space-x-2">
                  <button className="px-3 py-1 text-sm border rounded">
                    Create Contact
                  </button>
                  <button className="px-3 py-1 text-sm border rounded">
                    Create Job
                  </button>
                  <button className="px-3 py-1 text-sm border rounded">
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
    </PortalLayout>
  );
}