import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
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
  CheckCircle
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
  logo_url?: string;
}

interface CompanyDashboardProps {
  company: Company | null;
}

export default function CompanyDashboardPage({ company: initialCompany }: CompanyDashboardProps) {
  const router = useRouter();
  const { company: companySlug } = router.query;
  const [company, setCompany] = useState<Company | null>(initialCompany);
  const [loading, setLoading] = useState(!initialCompany);
  
  // Load company data if not provided through props
  useEffect(() => {
    // If company was provided through props or already loaded, skip
    if (company || !companySlug) return;
    
    // In a real implementation, this would be a database query
    setLoading(true);
    
    // Simulating API call to fetch company details
    setTimeout(() => {
      const mockCompany: Company = {
        id: '1',
        name: 'Comfort Heating & Cooling',
        slug: companySlug as string,
        city: 'Springfield',
        state: 'IL',
        website: 'www.comforthvac.example.com'
      };
      
      setCompany(mockCompany);
      setLoading(false);
    }, 500);
  }, [company, companySlug]);
  
  // Navigation functions
  const navigateToSection = (section: string) => {
    router.push(`/dashboard/${companySlug}/${section}`);
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
    <MainLayout title={company.name}>
      <Head>
        <title>{company.name} Dashboard - HVAC Pro</title>
        <meta name="description" content={`Dashboard for ${company.name}`} />
      </Head>
      
      <div>
        {/* Company header */}
        <div className="mb-8 flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600 mt-1">
              {company.city && company.state 
                ? `${company.city}, ${company.state}`
                : company.city || company.state || 'Location not specified'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.open(`https://${company.website}`, '_blank')}
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Today's Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <div className="flex justify-between mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  3 Completed
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  2 Upcoming
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Open Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <div className="flex justify-between mt-2">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  2 Urgent
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  10 Standard
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Revenue This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$24,500</div>
              <div className="flex items-center mt-2 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" /> 
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>
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
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Job #1234 completed</p>
                  <p className="text-sm text-gray-500">AC repair at John Smith's residence</p>
                  <p className="text-xs text-gray-400 mt-1">Today, 2:15 PM</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">New appointment scheduled</p>
                  <p className="text-sm text-gray-500">Annual maintenance for Oakridge Office Complex</p>
                  <p className="text-xs text-gray-400 mt-1">Today, 11:30 AM</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium">Emergency service request</p>
                  <p className="text-sm text-gray-500">Water heater leak at David Wilson's home</p>
                  <p className="text-xs text-gray-400 mt-1">Yesterday, 8:45 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

// In a real implementation, this would fetch the company data from the database
export async function getServerSideProps({ params }: { params: { company: string } }) {
  try {
    // This would be a database query to get the company by slug
    // For now, we're returning null to simulate the client-side fetching
    return {
      props: {
        company: null
      }
    };
    
    // Commented out example of what this would look like with a real DB query:
    /*
    const companies = await queryMany(`
      SELECT id, name, slug, city, state, website, logo_url 
      FROM companies 
      WHERE slug = $1
    `, [params.company]);
    
    return {
      props: {
        company: companies.length > 0 ? companies[0] : null
      }
    };
    */
  } catch (err) {
    console.error('Error fetching company:', err);
    return {
      props: {
        company: null
      }
    };
  }
}