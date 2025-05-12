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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="mt-3 text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/hvacportal/dashboard" className="ml-2 md:ml-0">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-medium text-lg">
                  H
                </div>
                <div className="ml-2">
                  <h1 className="text-lg font-bold text-gray-900">{businessName || 'HVAC Dashboard'}</h1>
                  <p className="text-xs text-gray-500">Management Portal</p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadMessages.length > 0 && (
                  <span className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages.length}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900">Recent Messages</h3>
                  </div>
                  
                  {unreadMessages.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-gray-500 text-center">
                      <p>No new messages</p>
                    </div>
                  ) : (
                    unreadMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          handleMarkAsRead(message.id);
                          router.push('/hvacportal/messages');
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm text-gray-900">{message.sender_name}</span>
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
                    <Link href="/hvacportal/messages" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      View All Messages
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Menu */}
            <div className="flex items-center">
              <div className="hidden md:block mr-3">
                <div className="text-sm font-medium text-gray-900">{localStorage.getItem('username') || 'User'}</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 border border-gray-300">
                <span className="font-medium">
                  {localStorage.getItem('username')?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            
            <Button 
              variant="outline"
              onClick={handleSignOut}
              className="hidden md:flex border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Banner for unread messages - conditional */}
      {unreadMessages.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span className="text-sm text-amber-800">
                You have <span className="font-bold">{unreadMessages.length}</span> unread {unreadMessages.length === 1 ? 'message' : 'messages'}
              </span>
            </div>
            <Link href="/hvacportal/messages">
              <button className="text-sm text-amber-800 hover:text-amber-900 font-medium flex items-center">
                View Messages
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar - Desktop (always visible) and Mobile (conditionally visible) */}
        <aside 
          className={`
            ${isSidebarOpen ? 'block' : 'hidden'} 
            fixed inset-0 z-40 md:static md:block md:z-auto
            md:w-64 flex-shrink-0 
            bg-white md:border-r border-gray-200 h-full
          `}
        >
          {/* Mobile close button overlay */}
          {isSidebarOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
          )}
          
          {/* Sidebar content */}
          <div className="absolute inset-0 bg-white md:static flex flex-col h-full z-10">
            {/* Mobile header */}
            <div className="md:hidden border-b border-gray-200 p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{businessName}</h3>
                <p className="text-xs text-gray-500">Management Portal</p>
              </div>
              <button 
                className="p-2 rounded-md text-gray-500 hover:text-gray-700"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto py-6 px-4">
              <div className="mb-8">
                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">Dashboard</h3>
                <ul className="space-y-2">
                  <li>
                    <Link 
                      href="/hvacportal/dashboard" 
                      className={`
                        flex items-center px-3 py-2 text-sm rounded-md
                        ${router.pathname === '/hvacportal/dashboard'
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/hvacportal/contacts" 
                      className={`
                        flex items-center px-3 py-2 text-sm rounded-md
                        ${router.pathname === '/hvacportal/contacts'
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Contacts
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/hvacportal/messages" 
                      className={`
                        flex items-center px-3 py-2 text-sm rounded-md
                        ${router.pathname === '/hvacportal/messages'
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Messages
                      {unreadMessages.length > 0 && (
                        <span className="ml-auto bg-rose-100 text-rose-800 text-xs font-medium rounded-full px-2 py-0.5">
                          {unreadMessages.length}
                        </span>
                      )}
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">Business</h3>
                <ul className="space-y-2">
                  <li>
                    <Link 
                      href="/hvacportal/settings" 
                      className={`
                        flex items-center px-3 py-2 text-sm rounded-md
                        ${router.pathname === '/hvacportal/settings'
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                  </li>
                  <li>
                    {activeBusinessSlug && (
                      <a 
                        href={`/t/moderntrust/${activeBusinessSlug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
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
              </div>
            </nav>
            
            {/* Mobile sign out button */}
            <div className="p-4 border-t border-gray-200 md:hidden">
              <Button 
                variant="outline" 
                onClick={handleSignOut} 
                className="w-full flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}