import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { query } from '@/lib/db';

type Message = {
  id: number;
  company_id: number;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message_content: string;
  created_at: string;
  read: boolean;
};

export default function Messages() {
  const router = useRouter();
  const { slug } = router.query;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);

  // Fetch messages when the page loads
  useEffect(() => {
    async function fetchCompanyId() {
      if (!slug) return;
      
      try {
        // Get company ID from the slug
        const companyResult = await fetch(`/api/company-id?slug=${slug}`);
        const companyData = await companyResult.json();
        
        if (!companyData.success) {
          throw new Error(companyData.message || 'Could not find company');
        }
        
        setCompanyId(companyData.companyId);
      } catch (err: any) {
        console.error('Error fetching company:', err);
        setError('Failed to load company information');
        setLoading(false);
      }
    }
    
    fetchCompanyId();
  }, [slug]);

  // Fetch messages once we have the company ID
  useEffect(() => {
    async function fetchMessages() {
      if (!companyId) return;
      
      try {
        const messagesResult = await fetch(`/api/messages?companyId=${companyId}`);
        const messagesData = await messagesResult.json();
        
        if (!messagesData.success) {
          throw new Error(messagesData.message || 'Could not fetch messages');
        }
        
        setMessages(messagesData.messages || []);
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    }
    
    if (companyId) {
      fetchMessages();
    }
  }, [companyId]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  // Mark a message as read
  const markAsRead = async (messageId: number) => {
    try {
      await fetch('/api/mark-message-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });
      
      // Update the local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  return (
    <PortalLayout businessSlug={slug as string}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Customer Messages</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-500">No messages yet. When customers send you messages, they'll appear here.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card 
                key={message.id}
                className={`transition-all ${!message.read ? 'border-blue-400 bg-blue-50' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-medium">
                      {message.sender_name}
                      {!message.read && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                          New
                        </span>
                      )}
                    </CardTitle>
                    <div className="text-sm text-gray-500">{formatDate(message.created_at)}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Email: {message.sender_email}</div>
                    {message.sender_phone && <div>Phone: {message.sender_phone}</div>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap mb-3">{message.message_content}</div>
                  {!message.read && (
                    <button 
                      onClick={() => markAsRead(message.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark as read
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}