import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
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
  ArrowRight,
  BarChart4,
  DollarSign,
  Activity,
  Star
} from 'lucide-react';

// Dashboard statistics card component
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  colorClass,
  onClick 
}) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`${colorClass} rounded-md p-2`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="gap-1 px-0 text-blue-600">
          View details <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// Activity item component
interface ActivityItemProps {
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  badge?: {
    text: string;
    color: string;
  };
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  icon,
  iconBgColor,
  iconColor,
  title,
  description,
  time,
  badge
}) => {
  return (
    <div className="flex items-start space-x-4">
      <div className={`${iconBgColor} ${iconColor} p-2 rounded-full`}>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${iconColor}`}>{title}</p>
          {badge && (
            <Badge className={`${badge.color}`}>
              {badge.text}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="mr-1 h-3 w-3" />
          {time}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  
  return (
    <DashboardLayout title="Dashboard Overview">
      <Head>
        <title>HVAC Business Dashboard</title>
      </Head>
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Messages" 
          value="12" 
          description="3 unread messages"
          icon={<MessageSquare className="h-4 w-4 text-white" />}
          colorClass="bg-blue-500"
          onClick={() => router.push('/dashboard/messages')}
        />
        
        <StatCard 
          title="Contacts" 
          value="48" 
          description="2 new customers this week"
          icon={<Users className="h-4 w-4 text-white" />}
          colorClass="bg-green-500"
          onClick={() => router.push('/dashboard/contacts')}
        />
        
        <StatCard 
          title="Scheduled Jobs" 
          value="8" 
          description="Upcoming jobs this week"
          icon={<Calendar className="h-4 w-4 text-white" />}
          colorClass="bg-purple-500"
          onClick={() => router.push('/dashboard/schedule')}
        />
        
        <StatCard 
          title="Revenue" 
          value="$12,450" 
          description="15% increase from last month"
          icon={<DollarSign className="h-4 w-4 text-white" />}
          colorClass="bg-emerald-500"
          onClick={() => router.push('/dashboard/reports')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest customer interactions and jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ActivityItem 
                  icon={<MessageSquare className="h-5 w-5" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-700"
                  title="New message from John Smith"
                  description="AC not cooling properly"
                  time="Just now"
                  badge={{ text: "New", color: "bg-green-100 text-green-800 hover:bg-green-100" }}
                />
                
                <ActivityItem 
                  icon={<Calendar className="h-5 w-5" />}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-700"
                  title="Job scheduled for Sarah Johnson"
                  description="Furnace maintenance"
                  time="Tomorrow at 2:00 PM"
                  badge={{ text: "Scheduled", color: "bg-purple-100 text-purple-800 hover:bg-purple-100" }}
                />
                
                <ActivityItem 
                  icon={<AlertCircle className="h-5 w-5" />}
                  iconBgColor="bg-yellow-100"
                  iconColor="text-yellow-700"
                  title="Emergency call from David Wilson"
                  description="Water leaking from ceiling"
                  time="2 hours ago"
                  badge={{ text: "Urgent", color: "bg-red-100 text-red-800 hover:bg-red-100" }}
                />
                
                <ActivityItem 
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-700"
                  title="Job completed for Michael Brown"
                  description="Thermostat replacement"
                  time="Yesterday"
                  badge={{ text: "Completed", color: "bg-green-100 text-green-800 hover:bg-green-100" }}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto">
                View all activity
              </Button>
            </CardFooter>
          </Card>
          
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Monthly metrics and KPIs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Activity className="h-4 w-4 text-blue-700" />
                      </div>
                      <span className="text-sm font-medium">Jobs Completed</span>
                    </div>
                    <span className="text-lg font-semibold">32</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500">75% of monthly target</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <DollarSign className="h-4 w-4 text-green-700" />
                      </div>
                      <span className="text-sm font-medium">Revenue Target</span>
                    </div>
                    <span className="text-lg font-semibold">$12,450</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: '62%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500">62% of monthly target</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-full mr-3">
                        <Users className="h-4 w-4 text-purple-700" />
                      </div>
                      <span className="text-sm font-medium">New Customers</span>
                    </div>
                    <span className="text-lg font-semibold">15</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500">88% of monthly target</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 p-2 rounded-full mr-3">
                        <Star className="h-4 w-4 text-yellow-700" />
                      </div>
                      <span className="text-sm font-medium">Customer Rating</span>
                    </div>
                    <span className="text-lg font-semibold">4.8 / 5</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full rounded-full" style={{ width: '96%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500">Based on 28 reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full justify-start" 
                size="lg"
                onClick={() => router.push('/dashboard/contacts')}
              >
                <Users className="mr-2 h-5 w-5" />
                Add New Contact
              </Button>
              <Button 
                className="w-full justify-start" 
                size="lg"
                onClick={() => router.push('/dashboard/schedule')}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Schedule New Job
              </Button>
              <Button 
                className="w-full justify-start" 
                size="lg"
                onClick={() => router.push('/dashboard/messages')}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Send Message
              </Button>
            </CardContent>
          </Card>
          
          {/* Recent Customers Card */}
          <Card>
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
                        JS
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">John Smith</p>
                      <p className="text-xs text-gray-500">Added May 10, 2025</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => router.push('/dashboard/contacts')}
                  >
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
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => router.push('/dashboard/contacts')}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push('/dashboard/contacts')}
              >
                View All Customers
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}