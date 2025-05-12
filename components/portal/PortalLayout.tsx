import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';

interface Message {
  id: number;
  sender_name: string;
  message_content: string;
  created_at: string;
  read: boolean;
}

interface PortalLayoutProps {
  children: ReactNode;
  businessSlug?: string;
}

export default function PortalLayout({ children, businessSlug }: PortalLayoutProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeBusinessSlug, setActiveBusinessSlug] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Format business name from slug
  useEffect(() => {
    if (activeBusinessSlug) {
      const formatted = activeBusinessSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setBusinessName(formatted);
    }
  }, [activeBusinessSlug]);

  // Fetch unread messages
  useEffect(() => {
    async function fetchMessages() {
      if (!companyId) return;
      
      try {
        const response = await fetch(`/api/messages?businessSlug=${companyId}`);
        const data = await response.json();
        
        if (data.success && data.messages) {
          // Filter unread messages
          const unread = data.messages.filter((msg: Message) => !msg.read);
          setUnreadMessages(unread);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (companyId) {
      fetchMessages();
    }
  }, [companyId]);

  // Authentication check
  useEffect(() => {
    setIsClient(true);
    
    // Check if user is authenticated by looking for session data
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const storedBusinessSlug = localStorage.getItem('businessSlug');
      
      // Get business slug - prefer the one from props, fallback to localStorage
      const effectiveSlug = businessSlug || storedBusinessSlug;
      setActiveBusinessSlug(effectiveSlug);
      setCompanyId(effectiveSlug);
      
      // If not logged in, redirect to login
      if (!isLoggedIn) {
        // Redirect to login with the business slug if available
        if (effectiveSlug) {
          router.push(`/hvacportal/login?business=${effectiveSlug}`);
        } else {
          router.push('/hvacportal/login');
        }
      } else {
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
  }, [router, businessSlug]);

  const handleSignOut = () => {
    // Clear authentication state
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('businessSlug');
    localStorage.removeItem('username');
    
    // Redirect to login
    router.push('/hvacportal/login');
  };

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
        setUnreadMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // If not on client side yet or not authenticated, show minimal loading layout
  if (!isClient || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-blue-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/hvacportal/dashboard">
            <h1 className="text-2xl font-bold text-white">
              {businessName || 'HVAC Business'} <span className="text-sm opacity-75">Portal</span>
            </h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                className="p-2 rounded-full hover:bg-blue-600 transition-colors relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadMessages.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages.length}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700">Recent Messages</h3>
                  </div>
                  
                  {unreadMessages.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No new messages
                    </div>
                  ) : (
                    unreadMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className="px-4 py-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer"
                        onClick={() => {
                          handleMarkAsRead(message.id);
                          router.push('/hvacportal/messages');
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm text-gray-700">{message.sender_name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {message.message_content}
                        </p>
                      </div>
                    ))
                  )}
                  
                  <div className="px-4 py-2 text-center">
                    <Link href="/hvacportal/messages" className="text-xs text-blue-600 hover:text-blue-800">
                      View All Messages
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Menu */}
            <div className="flex items-center">
              <div className="hidden md:block mr-2">
                <div className="text-sm font-medium">{localStorage.getItem('username')}</div>
                <div className="text-xs opacity-75">Administrator</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {localStorage.getItem('username')?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="text-white hover:bg-blue-600 hidden md:flex"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Banner for unread messages - always visible at the top */}
      {unreadMessages.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-100 p-3">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-800">
                You have <span className="font-bold">{unreadMessages.length}</span> unread {unreadMessages.length === 1 ? 'message' : 'messages'}
              </span>
            </div>
            <Button 
              variant="link" 
              size="sm"
              className="text-yellow-800 hover:text-yellow-900"
              onClick={() => router.push('/hvacportal/messages')}
            >
              View Messages
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg border-r border-gray-100 hidden md:block">
          <div className="flex flex-col h-full">
            <nav className="flex-1 py-6 overflow-y-auto">
              <div className="px-4 mb-4">
                <h3 className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Main</h3>
              </div>
              <ul className="space-y-1">
                <li>
                  <Link href="/hvacportal/contacts" className={`flex items-center px-4 py-3 text-sm ${router.pathname === '/hvacportal/contacts' ? 'bg-blue-50 text-blue-700 font-medium border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Contacts
                  </Link>
                </li>
                <li>
                  <Link href="/hvacportal/messages" className={`flex items-center px-4 py-3 text-sm ${router.pathname === '/hvacportal/messages' ? 'bg-blue-50 text-blue-700 font-medium border-r-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Messages
                    {unreadMessages.length > 0 && (
                      <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium rounded-full px-2 py-0.5">
                        {unreadMessages.length}
                      </span>
                    )}
                  </Link>
                </li>
              </ul>
              
              <div className="px-4 mt-8 mb-4">
                <h3 className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Website</h3>
              </div>
              <ul className="space-y-1">
                <li>
                  {activeBusinessSlug && (
                    <a 
                      href={`/t/moderntrust/${activeBusinessSlug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      View Website
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </li>
              </ul>
            </nav>
            
            {/* Bottom section with sign out on small screens */}
            <div className="p-4 border-t border-gray-100 md:hidden">
              <Button variant="destructive" onClick={handleSignOut} className="w-full">
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 bg-white my-4 rounded-lg shadow">
          {/* Mobile Top Navigation */}
          <div className="md:hidden mb-6 flex justify-between items-center">
            <div>
              <button 
                className="text-blue-600"
                onClick={() => {
                  // This would open a mobile sidebar menu in a full implementation
                  alert("Mobile sidebar would open here");
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div>
              <Link href="/hvacportal/messages">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {unreadMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadMessages.length}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}