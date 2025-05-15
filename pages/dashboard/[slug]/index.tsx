import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import {
  Building2,
  Users,
  Calendar,
  Settings,
  ChartBar,
  Tools,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { queryMany } from '@/lib/db';

interface Company {
  id: string;
  name: string;
  slug: string;
  city?: string;
  state?: string;
  website?: string;
  logo?: string;
}

interface CompanyDashboardProps {
  company: Company | null;
}

interface CompanyStats {
  totalContacts: number;
  todayJobs: number;
  completedTodayJobs: number;
  upcomingTodayJobs: number;
  openTickets: number;
  urgentTickets: number;
  standardTickets: number;
}

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  contact_id?: string;
  contact_name?: string;
  scheduled_date: string;
  created_at: string;
  updated_at: string;
}

export default function CompanyDashboardPage({ company: initialCompany }: CompanyDashboardProps) {
  const router = useRouter();
  const { slug } = router.query;
  const [company, setCompany] = useState<Company | null>(initialCompany);
  const [loading, setLoading] = useState(!initialCompany);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  
  // Load company data if not provided through props
  useEffect(() => {
    // If company was provided through props or already loaded, skip
    if (company || !slug) return;
    
    // We should never reach here as the company data is now fetched server-side
    // This is just a fallback in case somehow the company prop is null
    setLoading(true);
    
    // In a real implementation, we would make an API call here to fetch the company
    // For now, we'll just display an error since we expect the data to come from getServerSideProps
    console.error('Company data should have been provided via getServerSideProps');
    setLoading(false);
  }, [company, slug]);
  
  // Load company stats
  useEffect(() => {
    if (!company?.id) return;
    
    setStatsLoading(true);
    
    axios.get(`/api/companies/stats?companyId=${company.id}`)
      .then(response => {
        if (response.data.success) {
          setStats(response.data.data.stats);
          setRecentActivity(response.data.data.activity);
        }
      })
      .catch(error => {
        console.error('Error fetching company stats:', error);
      })
      .finally(() => {
        setStatsLoading(false);
      });
  }, [company]);
  
  // Navigation functions
  const navigateToSection = (section: string) => {
    router.push(`/dashboard/${slug}/${section}`);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h1>
        <p className="text-gray-600 mb-4">The company you are looking for does not exist.</p>
        <Button onClick={() => router.push('/')}>Go to Homepage</Button>
      </div>
    );
  }

  return (
    <MainLayout title={`${company.name} Dashboard`}>
      <Head>
        <title>{`${company.name} Dashboard - HVAC Pro`}</title>
        <meta name="description" content={`Dashboard for ${company.name}`} />
      </Head>
      
      <div>
        {/* Company header */}
        <div className="mb-8 flex flex-wrap justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            {company.logo && (
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <img src={company.logo} alt={`${company.name} logo`} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-600 mt-1">
                {company.city && company.state 
                  ? `${company.city}, ${company.state}`
                  : company.city || company.state || 'Location not specified'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.open(`${company.website}`, '_blank')}
              disabled={!company.website}
            >
              View Website
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigateToSection('settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Company Settings
            </Button>
          </div>
        </div>
        
        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4 mb-2"></div>
                    <div className="flex justify-between mt-2">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Today's Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.todayJobs || 0}</div>
                  <div className="flex justify-between mt-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {stats?.completedTodayJobs || 0} Completed
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {stats?.upcomingTodayJobs || 0} Upcoming
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Open Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
                  <div className="flex justify-between mt-2">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {stats?.urgentTickets || 0} Urgent
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {stats?.standardTickets || 0} Standard
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
                  <div className="flex items-center mt-2 text-blue-600 text-sm">
                    <Users className="h-4 w-4 mr-1" /> 
                    <span>Total customer contacts</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        {/* Main navigation cards */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToSection('contacts')}>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Contacts</CardTitle>
              <CardDescription>Manage customers and their equipment</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full" onClick={() => navigateToSection('contacts')}>
                View Contacts
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToSection('schedule')}>
            <CardHeader>
              <Calendar className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Manage jobs and technician assignments</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full" onClick={() => navigateToSection('schedule')}>
                View Schedule
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToSection('reports')}>
            <CardHeader>
              <ChartBar className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Reports</CardTitle>
              <CardDescription>View financial and performance reports</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full" onClick={() => navigateToSection('reports')}>
                View Reports
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Recent activity */}
        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Recent Activity</h2>
        <Card>
          <CardHeader>
            <CardTitle>Latest Updates</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-full">
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const date = new Date(activity.updated_at);
                  const formattedDate = new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  }).format(date);
                  
                  // Determine icon based on status
                  let Icon = Clock;
                  let iconColor = 'text-blue-500';
                  
                  if (activity.status === 'completed') {
                    Icon = CheckCircle;
                    iconColor = 'text-green-500';
                  } else if (activity.status === 'emergency' || activity.status === 'urgent') {
                    Icon = AlertTriangle;
                    iconColor = 'text-yellow-500';
                  }
                  
                  // Format the title based on status
                  let title = activity.title;
                  if (activity.status === 'completed') {
                    title = `Job completed: ${activity.title}`;
                  } else if (activity.status === 'emergency' || activity.status === 'urgent') {
                    title = `Emergency request: ${activity.title}`;
                  } else {
                    title = `Job scheduled: ${activity.title}`;
                  }
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 ${iconColor} mt-0.5`} />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-sm text-gray-500">
                          {activity.description || 'No description provided'}
                          {activity.contact_name && ` - Customer: ${activity.contact_name}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No recent activity found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

// Fetch the company data from the database based on slug
export async function getServerSideProps({ params }: { params: { slug: string } }) {
  try {
    // Database query to get the company by slug
    const companies = await queryMany(`
      SELECT id, name, slug, city, state, site as website, logo
      FROM companies 
      WHERE slug = $1 LIMIT 1
    `, [params.slug]);
    
    // Log the found company for debugging
    if (companies.length > 0) {
      console.log(`Found company: ${companies[0].name} for slug: ${params.slug}`);
    } else {
      console.log(`No company found for slug: ${params.slug}`);
    }
    
    return {
      props: {
        company: companies.length > 0 ? companies[0] : null
      }
    };
  } catch (err) {
    console.error('Error fetching company:', err);
    console.error(err);
    return {
      props: {
        company: null
      }
    };
  }
}