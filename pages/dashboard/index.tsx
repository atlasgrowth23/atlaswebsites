import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/dashboard/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

// Dashboard main page that serves as a hub for the admin area
export default function Dashboard() {
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  
  return (
    <DashboardLayout title="Dashboard Overview">
      <Head>
        <title>HVAC Business Dashboard</title>
      </Head>
      
      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/messages')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 unread messages</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="gap-1 px-0 text-blue-600">
              View all messages <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/contacts')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">2 new customers this week</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="gap-1 px-0 text-green-600">
              Manage contacts <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/schedule')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Schedule</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Upcoming jobs this week</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="gap-1 px-0 text-purple-600">
              View schedule <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest customer interactions and jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-blue-700">New message from John Smith</p>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">New</Badge>
                    </div>
                    <p className="text-sm text-gray-600">AC not cooling properly</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="mr-1 h-3 w-3" />
                      Just now
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 text-purple-700 p-2 rounded-full">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-purple-700">Job scheduled for Sarah Johnson</p>
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Scheduled</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Furnace maintenance</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="mr-1 h-3 w-3" />
                      Tomorrow at 2:00 PM
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-100 text-yellow-700 p-2 rounded-full">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-yellow-700">Emergency call from David Wilson</p>
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Urgent</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Water leaking from ceiling</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="mr-1 h-3 w-3" />
                      2 hours ago
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 text-green-700 p-2 rounded-full">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-green-700">Job completed for Michael Brown</p>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Thermostat replacement</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="mr-1 h-3 w-3" />
                      Yesterday
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto">
                View all activity
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Quick Actions Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" size="lg">
                <Users className="mr-2 h-5 w-5" />
                Add New Contact
              </Button>
              <Button className="w-full justify-start" size="lg">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule New Job
              </Button>
              <Button className="w-full justify-start" size="lg">
                <MessageSquare className="mr-2 h-5 w-5" />
                Send Message
              </Button>
            </CardContent>
          </Card>
          
          {/* Recent Customers Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>Newest customers added to your system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800">
                        {/* First letter of first name and last name */}
                        JS
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">John Smith</p>
                      <p className="text-xs text-gray-500">Added May 10, 2025</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-800">
                        SJ
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sarah Johnson</p>
                      <p className="text-xs text-gray-500">Added May 8, 2025</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}