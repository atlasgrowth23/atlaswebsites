'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  direction: 'in' | 'out';
  body: string;
  service_type: string | null;
  ts: string;
  contact_id: string | null;
  contact_name?: string;
  contact_phone?: string;
}

export default function MessagesPage({ params }: { params: { slug: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    serviceType: '',
  });
  
  const router = useRouter();

  // Function to load messages
  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/company/messages?slug=${params.slug}`);
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load messages on component mount
  useEffect(() => {
    loadMessages();
    
    // Set up websocket connection for real-time updates
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws?slug=${params.slug}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          // Add new message to the list
          setMessages((prevMessages) => [data.message, ...prevMessages]);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
    
    // Clean up websocket on unmount
    return () => {
      ws.close();
    };
  }, [params.slug]);

  // Handle message selection for conversion
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    
    // Pre-fill form if the message contains useful info
    const phoneMatch = message.body.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
    const emailMatch = message.body.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    
    setFormData({
      ...formData,
      phone: phoneMatch ? phoneMatch[0] : '',
      email: emailMatch ? emailMatch[0] : '',
      serviceType: message.service_type || '',
    });
    
    setShowConvertModal(true);
  };

  // Handle form submission for converting to contact & job
  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMessage) return;
    
    try {
      const response = await fetch('/api/company/convert-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companySlug: params.slug,
          messageId: selectedMessage.id,
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          notes: formData.notes || null,
          serviceType: formData.serviceType || 'custom',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to convert message');
      }
      
      // Close modal and refresh messages
      setShowConvertModal(false);
      setSelectedMessage(null);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
        serviceType: '',
      });
      
      // Navigate to schedule page
      router.push(`/${params.slug}/portal/schedule`);
    } catch (error) {
      console.error('Error converting message:', error);
      // Show error to user
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          <p>{error}</p>
          <button
            onClick={loadMessages}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
      </div>
      
      {messages.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No messages yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Messages from your website widget will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg border ${
                message.direction === 'in'
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                    message.direction === 'in' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {message.direction === 'in' ? 'Inbound' : 'Outbound'}
                    {message.service_type && ` • ${message.service_type}`}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(message.ts)}
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                {message.body}
              </p>
              
              {message.direction === 'in' && !message.contact_id && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleSelectMessage(message)}
                    className="bg-primary text-white px-3 py-1.5 text-sm rounded hover:bg-primary/90 transition-colors"
                  >
                    Convert to Contact & Job
                  </button>
                </div>
              )}
              
              {message.contact_id && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Contact: </span>
                      <Link
                        href={`/${params.slug}/portal/contacts?id=${message.contact_id}`}
                        className="text-primary hover:underline"
                      >
                        {message.contact_name || 'View contact'}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Convert to Contact & Job Modal */}
      {showConvertModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Convert to Contact & Job
              </h3>
              
              <form onSubmit={handleConvertSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name*
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone*
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Service Type
                    </label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="custom">Custom</option>
                      <option value="ac_repair">AC Repair</option>
                      <option value="heating_repair">Heating Repair</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="installation">Installation</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Create & Go to Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}