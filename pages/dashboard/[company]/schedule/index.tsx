import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Tool,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock job types for color coding
const JOB_TYPES = {
  installation: { bg: 'bg-green-100 border-green-300', text: 'text-green-700' },
  repair: { bg: 'bg-yellow-100 border-yellow-300', text: 'text-yellow-700' },
  maintenance: { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-700' },
  emergency: { bg: 'bg-red-100 border-red-300', text: 'text-red-700' },
};

// Mock data for jobs
const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'AC Installation',
    customer: 'John Smith',
    address: '123 Main St, Anytown, CA 95012',
    date: '2025-05-15',
    startTime: '09:00',
    endTime: '12:00',
    technician: 'Mike Johnson',
    type: 'installation',
    notes: 'New central AC unit installation',
  },
  {
    id: 'job-2',
    title: 'Furnace Repair',
    customer: 'Sarah Johnson',
    address: '456 Oak Ave, Springfield, IL 62701',
    date: '2025-05-15',
    startTime: '13:00',
    endTime: '15:00',
    technician: 'David Wilson',
    type: 'repair',
    notes: 'Furnace making strange noise, possible blower motor issue',
  },
  {
    id: 'job-3',
    title: 'Annual Maintenance',
    customer: 'Oakridge Office Complex',
    address: '555 Cedar Ln, Oakville, TX 78570',
    date: '2025-05-15',
    startTime: '15:30',
    endTime: '17:30',
    technician: 'Mike Johnson',
    type: 'maintenance',
    notes: 'Scheduled yearly maintenance for all units',
  },
  {
    id: 'job-4',
    title: 'Emergency AC Repair',
    customer: 'Jennifer Garcia',
    address: '321 Maple Rd, Riverside, CA 92501',
    date: '2025-05-15',
    startTime: '18:00',
    endTime: '19:30',
    technician: 'David Wilson',
    type: 'emergency',
    notes: 'AC not cooling at all, customer has small children',
  },
  {
    id: 'job-5',
    title: 'Water Heater Inspection',
    customer: 'David Wilson',
    address: '789 Pine St, Lakeside, MI 49456',
    date: '2025-05-16',
    startTime: '10:00',
    endTime: '11:30',
    technician: 'Mike Johnson',
    type: 'maintenance',
    notes: 'Customer reported lower water temperature than usual',
  }
];

export default function SchedulePage() {
  const router = useRouter();
  const { company } = router.query;
  
  // State for current date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  // Format date for display
  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Navigate to previous/next day
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - (viewMode === 'day' ? 1 : 7));
    } else {
      newDate.setDate(newDate.getDate() + (viewMode === 'day' ? 1 : 7));
    }
    setCurrentDate(newDate);
  };
  
  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  // Get date string in YYYY-MM-DD format
  const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Filter jobs for the current day
  const jobsForCurrentDay = MOCK_JOBS.filter(job => 
    job.date === getDateString(currentDate)
  );
  
  return (
    <MainLayout title="Schedule">
      <Head>
        <title>Schedule - HVAC Pro</title>
        <meta name="description" content="Manage your service schedule" />
      </Head>
      
      <div>
        {/* Page header */}
        <div className="border-b border-gray-200 pb-5 mb-5 flex flex-wrap items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage service calls and appointments
            </p>
          </div>
          <div className="mt-3 sm:mt-0">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>
        
        {/* Calendar navigation */}
        <div className="flex items-center mb-6 justify-between">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigateDate('prev')}
              className="mr-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
              <h2 className="text-lg font-medium">{formatDisplayDate(currentDate)}</h2>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigateDate('next')}
              className="ml-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              className={viewMode === 'day' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              className={viewMode === 'week' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
          </div>
        </div>
        
        {/* Jobs for the day */}
        {jobsForCurrentDay.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-300 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs scheduled</h3>
            <p className="text-sm text-gray-500 mb-4">
              There are no appointments scheduled for this day
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Job
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobsForCurrentDay.map(job => (
              <Card key={job.id} className={`border-l-4 ${JOB_TYPES[job.type as keyof typeof JOB_TYPES].bg}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <CardDescription>
                        <span className="font-medium">{job.customer}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className={`mr-2 ${JOB_TYPES[job.type as keyof typeof JOB_TYPES].bg} ${JOB_TYPES[job.type as keyof typeof JOB_TYPES].text}`}>
                        {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Reschedule</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{formatTime(job.startTime)} - {formatTime(job.endTime)}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{job.technician}</span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <span className="truncate">{job.address}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-start">
                    <Tool className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <span className="text-sm text-gray-600">{job.notes}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Start Job
                    </Button>
                    <Button variant="outline" size="sm">
                      Navigate
                    </Button>
                    <Button variant="outline" size="sm">
                      Call Customer
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}