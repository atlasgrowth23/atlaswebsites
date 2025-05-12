import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Chart component for visualization
const AreaChart = ({ data }: { data: number[] }) => (
  <div className="h-[200px] w-full bg-gradient-to-b from-blue-50 to-transparent rounded-md relative overflow-hidden">
    <div className="absolute bottom-0 left-0 w-full h-[150px]">
      <svg viewBox="0 0 100 20" className="w-full h-full">
        <path
          fill="rgba(59, 130, 246, 0.2)"
          fillOpacity="0.2"
          d={`M0 20 ${data.map((d, i) => `L ${i * (100 / (data.length - 1))} ${20 - d / 5}`).join(' ')} L 100 20 Z`}
        />
        <path
          fill="none"
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth="0.5"
          d={`M0 ${20 - data[0] / 5} ${data.map((d, i) => `L ${i * (100 / (data.length - 1))} ${20 - d / 5}`).join(' ')}`}
        />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={i * (100 / (data.length - 1))}
            cy={20 - d / 5}
            r="0.5"
            fill="#3B82F6"
          />
        ))}
      </svg>
    </div>
  </div>
);

export default function Dashboard() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  
  // Stats data (would be from API in production)
  const [unreadMessages, setUnreadMessages] = useState<number>(4);
  const [activeJobs, setActiveJobs] = useState<number>(8);
  const [pendingInvoices, setPendingInvoices] = useState<number>(3);
  const [revenueData, setRevenueData] = useState<number[]>([15, 25, 40, 30, 45, 70, 55, 65, 85, 75, 80]);
  const [jobData, setJobData] = useState<number[]>([8, 12, 15, 10, 20, 25, 18, 30, 28, 32, 35]);

  // Today's date for display
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is logged in using localStorage
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
          router.push('/hvacportal/login');
          return;
        }
        
        // Get businessSlug and username from localStorage
        const storedBusinessSlug = localStorage.getItem('businessSlug');
        const storedUsername = localStorage.getItem('username');
        
        setBusinessSlug(storedBusinessSlug);
        setUsername(storedUsername);
        
        // Format business name for display from slug
        if (storedBusinessSlug) {
          const formattedName = storedBusinessSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          setBusinessName(formattedName);
        }
        
        // In a production app, you would make API calls here to get 
        // the latest business data from the database
        
      } catch (err: any) {
        console.error('Error checking auth:', err);
        setError('Failed to load your business information');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
        </div>
      </PortalLayout>
    );
  }

  // Convert businessSlug from string|null to string|undefined for prop type compatibility
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;
  
  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {businessName ? `${businessName} Dashboard` : 'Dashboard'}
            </h1>
            <p className="text-gray-500">{today}</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/hvacportal/jobs">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                + New Job
              </button>
            </Link>
            <Link href="/hvacportal/reports">
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Generate Report
              </button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                  <h3 className="text-2xl font-bold">{activeJobs}</h3>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/hvacportal/jobs" className="text-sm text-blue-600 hover:underline">
                  View all jobs →
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <h3 className="text-2xl font-bold">$24,500</h3>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>↑ 8.2% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Invoices Pending</p>
                  <h3 className="text-2xl font-bold">{pendingInvoices}</h3>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/hvacportal/invoices" className="text-sm text-blue-600 hover:underline">
                  View invoices →
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Unread Messages</p>
                  <h3 className="text-2xl font-bold">{unreadMessages}</h3>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/hvacportal/messages" className="text-sm text-blue-600 hover:underline">
                  View messages →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChart data={revenueData} />
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium">Jobs Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChart data={jobData} />
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'job', title: 'New A/C installation completed', customer: 'John Smith', time: '2 hours ago' },
                    { type: 'message', title: 'New quote request', customer: 'Emily Johnson', time: '5 hours ago' },
                    { type: 'invoice', title: 'Invoice #1092 paid', customer: 'Michael Brown', time: '1 day ago' },
                    { type: 'job', title: 'Scheduled maintenance', customer: 'Robert Davis', time: '1 day ago' },
                    { type: 'message', title: 'Customer feedback received', customer: 'Sarah Wilson', time: '2 days ago' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className={`p-2 rounded-full mr-4 ${
                        activity.type === 'job' ? 'bg-blue-100' : 
                        activity.type === 'message' ? 'bg-purple-100' : 
                        'bg-green-100'
                      }`}>
                        {activity.type === 'job' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        ) : activity.type === 'message' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{activity.title}</h4>
                        <p className="text-xs text-gray-500">Customer: {activity.customer}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                      <button className="text-sm text-blue-600 hover:underline">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/hvacportal/contacts">
                    <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>Add New Contact</span>
                    </button>
                  </Link>
                  <Link href="/hvacportal/jobs">
                    <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Create New Invoice</span>
                    </button>
                  </Link>
                  <Link href="/hvacportal/schedule">
                    <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Schedule Appointment</span>
                    </button>
                  </Link>
                  <Link href="/hvacportal/equipment">
                    <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span>Add Equipment</span>
                    </button>
                  </Link>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">View Your Website</h4>
                  <div className="space-y-2">
                    {businessSlug && (
                      <>
                        <Link 
                          href={`/t/moderntrust/${businessSlug}`} 
                          className="text-blue-600 hover:underline block"
                          target="_blank"
                        >
                          ModernTrust Template →
                        </Link>
                        <Link 
                          href={`/t/boldenergy/${businessSlug}`} 
                          className="text-blue-600 hover:underline block"
                          target="_blank"
                        >
                          BoldEnergy Template →
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}