import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Users,
  Calendar,
  MessageSquare,
  DollarSign,
  Wrench,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Plus,
  Star,
  TrendingUp
} from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Stat card component
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  change,
  changeType = 'neutral',
  onClick
}) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <div className={`
          p-2 rounded-md
          ${changeType === 'positive' ? 'bg-green-100 text-green-800' : 
            changeType === 'negative' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'}
        `}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center mt-1">
          {change && (
            <span className={`text-xs font-medium mr-2
              ${changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 
                'text-blue-600'}
            `}>
              {change}
            </span>
          )}
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="gap-1 px-0 text-gray-600 hover:text-blue-600">
          View Details <ArrowUpRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// Activity item component
interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  status: 'new' | 'scheduled' | 'emergency' | 'completed' | 'pending';
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  description,
  time,
  icon,
  status
}) => {
  const getStatusColors = () => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'new':
        return 'New';
      case 'scheduled':
        return 'Scheduled';
      case 'emergency':
        return 'Emergency';
      case 'completed':
        return 'Completed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="flex items-start space-x-3">
      <div className={`${getStatusColors()} p-2 rounded-full flex-shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <p className="font-medium text-gray-900">{title}</p>
          <Badge className={getStatusColors()}>
            {getStatusLabel()}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        <p className="text-xs text-gray-500 mt-1 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {time}
        </p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();

  // Handlers for navigation
  const navigateToContacts = () => router.push('/dashboard/contacts');
  const navigateToSchedule = () => router.push('/dashboard/schedule');
  const navigateToMessages = () => router.push('/dashboard/messages');
  const navigateToReports = () => router.push('/dashboard/reports');

  return (
    <MainLayout title="Dashboard">
      <Head>
        <title>Dashboard - HVAC Pro</title>
        <meta name="description" content="HVAC business management dashboard" />
      </Head>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Contacts"
            value="124"
            description="12 new this month"
            icon={<Users className="h-4 w-4" />}
            change="+8.4%"
            changeType="positive"
            onClick={navigateToContacts}
          />
          <StatCard
            title="Scheduled Jobs"
            value="18"
            description="Next 7 days"
            icon={<Calendar className="h-4 w-4" />}
            change="+12%"
            changeType="positive"
            onClick={navigateToSchedule}
          />
          <StatCard
            title="New Messages"
            value="7"
            description="3 unread messages"
            icon={<MessageSquare className="h-4 w-4" />}
            onClick={navigateToMessages}
          />
          <StatCard
            title="Monthly Revenue"
            value="$24,500"
            description="May 2025"
            icon={<DollarSign className="h-4 w-4" />}
            change="+5.2%"
            changeType="positive"
            onClick={navigateToReports}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Feed */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ActivityItem
                  title="New service request from John Smith"
                  description="AC not cooling properly, requested emergency service"
                  time="15 minutes ago"
                  icon={<AlertCircle className="h-4 w-4" />}
                  status="new"
                />
                <ActivityItem
                  title="Service scheduled for Sarah Johnson"
                  description="Annual furnace maintenance, scheduled for May 16 at 10:00 AM"
                  time="1 hour ago"
                  icon={<Calendar className="h-4 w-4" />}
                  status="scheduled"
                />
                <ActivityItem
                  title="Emergency call from David Wilson"
                  description="Water heater leaking in basement, technician dispatched"
                  time="3 hours ago"
                  icon={<AlertCircle className="h-4 w-4" />}
                  status="emergency"
                />
                <ActivityItem
                  title="Job completed at Michael Brown's residence"
                  description="Thermostat replacement completed successfully"
                  time="Yesterday at 2:45 PM"
                  icon={<CheckCircle className="h-4 w-4" />}
                  status="completed"
                />
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Activity</Button>
              </CardFooter>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-green-100 text-green-800 p-1.5 rounded-md mr-2">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Revenue</span>
                      </div>
                      <span className="text-lg font-semibold">$24,500</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: '68%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 flex justify-between">
                      <span>Monthly Target: $36,000</span>
                      <span className="font-medium text-green-600">68%</span>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-800 p-1.5 rounded-md mr-2">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Completed Jobs</span>
                      </div>
                      <span className="text-lg font-semibold">42</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: '84%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 flex justify-between">
                      <span>Monthly Target: 50</span>
                      <span className="font-medium text-blue-600">84%</span>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 text-yellow-800 p-1.5 rounded-md mr-2">
                          <Star className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Customer Satisfaction</span>
                      </div>
                      <span className="text-lg font-semibold">4.8/5</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-yellow-500 h-full rounded-full" style={{ width: '96%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 flex justify-between">
                      <span>Based on 38 reviews</span>
                      <span className="font-medium text-yellow-600">96%</span>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-red-100 text-red-800 p-1.5 rounded-md mr-2">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Response Time</span>
                      </div>
                      <span className="text-lg font-semibold">56 min</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 flex justify-between">
                      <span>Target: 45 min</span>
                      <span className="font-medium text-red-600">+11 min</span>
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Detailed Reports</Button>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" onClick={() => router.push('/dashboard/schedule/new')}>
                  <Plus className="mr-2 h-4 w-4" /> Schedule New Job
                </Button>
                <Button className="w-full justify-start" onClick={() => router.push('/dashboard/contacts/new')}>
                  <Plus className="mr-2 h-4 w-4" /> Add New Contact
                </Button>
                <Button className="w-full justify-start" onClick={() => router.push('/dashboard/messages/new')}>
                  <Plus className="mr-2 h-4 w-4" /> Send Message
                </Button>
                <Button className="w-full justify-start bg-red-600 hover:bg-red-700">
                  <AlertCircle className="mr-2 h-4 w-4" /> Log Emergency Call
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Services */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Today's Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                      JS
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">John Smith</p>
                    <p className="text-sm text-gray-500">AC Repair - 2:00 PM</p>
                    <p className="text-xs text-gray-500 mt-1">123 Main St, Anytown</p>
                    <p className="text-xs font-medium text-blue-600 mt-1">Mike Johnson</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-md border border-green-100">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                      SJ
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-gray-500">Maintenance - 10:00 AM</p>
                    <p className="text-xs text-gray-500 mt-1">456 Oak Ave, Springfield</p>
                    <p className="text-xs font-medium text-green-600 mt-1">David Miller</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/schedule')}>
                  View Full Schedule
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}