import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  Search
} from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Types for job entries
interface Job {
  id: string;
  contact_id: string;
  contact_name: string;
  tech_id: string;
  tech_name: string;
  service_type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'emergency';
  priority: 'low' | 'normal' | 'high' | 'emergency';
  scheduled_at: string;
  address: string;
  notes: string;
}

// Utility functions for date handling
const formatDateRange = (start: Date, end: Date) => {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const getWeekDays = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    weekDays.push(nextDate);
  }
  
  return weekDays;
};

const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
};

export default function SchedulePage() {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize week days and fetch jobs
  useEffect(() => {
    setWeekDays(getWeekDays(new Date(currentDate)));
    
    setTimeout(() => {
      // Mock data - would be replaced with API call
      const mockJobs: Job[] = [
        {
          id: '1',
          contact_id: '1',
          contact_name: 'John Smith',
          tech_id: 'T1',
          tech_name: 'Mike Johnson',
          service_type: 'AC Repair',
          status: 'scheduled',
          priority: 'normal',
          scheduled_at: '2025-05-14T14:00:00',
          address: '123 Main St, Anytown, CA',
          notes: 'AC not cooling properly. Customer will be home after 2PM.'
        },
        {
          id: '2',
          contact_id: '2',
          contact_name: 'Sarah Johnson',
          tech_id: 'T2',
          tech_name: 'David Miller',
          service_type: 'Furnace Maintenance',
          status: 'scheduled',
          priority: 'low',
          scheduled_at: '2025-05-14T10:00:00',
          address: '456 Oak Ave, Springfield, IL',
          notes: 'Annual maintenance check-up.'
        },
        {
          id: '3',
          contact_id: '3',
          contact_name: 'David Wilson',
          tech_id: 'T1',
          tech_name: 'Mike Johnson',
          service_type: 'Water Heater Leak',
          status: 'emergency',
          priority: 'emergency',
          scheduled_at: '2025-05-15T09:00:00',
          address: '789 Pine St, Lakeside, MI',
          notes: 'Water heater leaking in basement, customer reports water on floor.'
        },
        {
          id: '4',
          contact_id: '4',
          contact_name: 'Emily Davis',
          tech_id: 'T3',
          tech_name: 'Sarah Lee',
          service_type: 'Air Filter Replacement',
          status: 'in_progress',
          priority: 'normal',
          scheduled_at: '2025-05-14T15:30:00',
          address: '101 Cedar Rd, Riverdale, NY',
          notes: 'Customer on maintenance plan. Home has 3 return air vents.'
        },
        {
          id: '5',
          contact_id: '5',
          contact_name: 'Michael Brown',
          tech_id: 'T2',
          tech_name: 'David Miller',
          service_type: 'Thermostat Installation',
          status: 'completed',
          priority: 'normal',
          scheduled_at: '2025-05-13T13:00:00',
          address: '202 Elm St, Oakridge, TX',
          notes: 'Installing new Nest thermostat. Customer has existing wiring compatible with system.'
        }
      ];
      
      setJobs(mockJobs);
      setLoading(false);
    }, 800);
  }, [currentDate]);

  // Navigate to previous or next week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Filter jobs for selected day
  const getJobsForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    return jobs.filter(job => {
      const jobDate = new Date(job.scheduled_at).toISOString().split('T')[0];
      return jobDate === dateString;
    }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  };

  return (
    <MainLayout title="Schedule">
      <Head>
        <title>Schedule - HVAC Pro</title>
        <meta name="description" content="Manage your service appointments" />
      </Head>

      <div>
        {/* Page header */}
        <div className="border-b border-gray-200 pb-5 mb-5 flex flex-wrap items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage service appointments
            </p>
          </div>
          <div className="mt-3 sm:mt-0">
            <Button className="bg-gray-900 hover:bg-gray-800 h-9">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        </div>

        {/* Week navigation */}
        <div className="flex items-center mb-4 space-x-4">
          <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">
            {weekDays.length > 0 && formatDateRange(weekDays[0], weekDays[6])}
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        {/* Week selector */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-4">
          <div className="grid grid-cols-7 divide-x">
            {weekDays.map((day, index) => {
              const isActive = selectedDay === index;
              const dayIsToday = isToday(day);
              
              return (
                <button
                  key={index}
                  className={cn(
                    "py-3 focus:outline-none",
                    isActive ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedDay(index)}
                >
                  <div className="text-xs text-gray-500">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={cn(
                    "text-lg mt-1",
                    dayIsToday ? "font-bold text-blue-600" : ""
                  )}>
                    {day.getDate()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Search */}
        <div className="mb-5 flex">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search jobs..." 
              className="pl-9 w-full h-9 border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Daily schedule */}
        <div className="bg-white border border-gray-200 rounded-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {weekDays[selectedDay] ? formatDate(weekDays[selectedDay]) : ''}
            </h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              weekDays[selectedDay] && getJobsForDay(weekDays[selectedDay]).length === 0 ? (
                <div className="text-center py-12 text-gray-500 border border-dashed rounded-md">
                  No jobs scheduled for this day
                </div>
              ) : (
                <div className="space-y-4">
                  {weekDays[selectedDay] && getJobsForDay(weekDays[selectedDay]).map(job => (
                    <div 
                      key={job.id}
                      className={cn(
                        "border rounded-md p-4 hover:bg-gray-50",
                        job.status === 'emergency' && "border-l-4 border-l-red-400",
                        job.status === 'in_progress' && "border-l-4 border-l-yellow-400",
                        job.status === 'completed' && "border-l-4 border-l-green-400"
                      )}
                    >
                      <div className="sm:flex justify-between items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">{job.service_type}</h3>
                            <Badge variant="outline" className={cn(
                              job.status === 'emergency' && "bg-red-50 text-red-700 border-red-200",
                              job.status === 'in_progress' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                              job.status === 'completed' && "bg-green-50 text-green-700 border-green-200",
                              job.status === 'cancelled' && "bg-gray-50 text-gray-700 border-gray-200",
                              job.status === 'scheduled' && "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                              {job.status === 'in_progress' ? 'In Progress' : 
                               job.status === 'completed' ? 'Completed' : 
                               job.status === 'emergency' ? 'Emergency' : 
                               job.status === 'cancelled' ? 'Cancelled' : 'Scheduled'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-700">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" /> 
                              {formatTime(job.scheduled_at)}
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              {job.contact_name}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              {job.address.split(',')[0]}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-0 text-sm bg-gray-100 py-1 px-2 rounded border text-gray-700">
                          {job.tech_name}
                        </div>
                      </div>
                      
                      {job.notes && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                          {job.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
        
        {/* Emergency Jobs */}
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-3">Emergency Service Requests</h3>
          <div className="bg-white border border-gray-200 rounded-md">
            {jobs.filter(job => job.status === 'emergency').length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No emergency service requests at this time
              </div>
            ) : (
              <div className="divide-y">
                {jobs
                  .filter(job => job.status === 'emergency')
                  .map(job => (
                    <div key={job.id} className="p-4 hover:bg-gray-50">
                      <div className="sm:flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Emergency
                            </Badge>
                            <h4 className="font-medium text-gray-900">{job.service_type}</h4>
                          </div>
                          <div className="text-sm text-gray-700">{job.contact_name}</div>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" /> 
                            {formatTime(job.scheduled_at)}
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}