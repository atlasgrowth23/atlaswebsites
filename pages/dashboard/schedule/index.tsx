import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const getWeekDays = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [viewMode, setViewMode] = useState<'tech' | 'day'>('tech');
  const [jobs, setJobs] = useState<Job[]>([]);

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

  // Get all unique technicians
  const technicians = Array.from(new Set(jobs.map(job => job.tech_name)));

  // Filter jobs for selected day
  const getJobsForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return jobs.filter(job => {
      const jobDate = new Date(job.scheduled_at).toISOString().split('T')[0];
      return jobDate === dateString;
    }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  };

  // Get status classnames for job card
  const getStatusClasses = (status: string, priority: string) => {
    switch (status) {
      case 'emergency':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'in_progress':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'cancelled':
        return 'bg-gray-50 border-gray-200 text-gray-500';
      default:
        if (priority === 'high' || priority === 'emergency') {
          return 'bg-orange-50 border-orange-200 text-orange-800';
        }
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'emergency':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Emergency
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
            <Loader className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
            <Calendar className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
    }
  };

  return (
    <MainLayout title="Schedule">
      <Head>
        <title>Schedule - HVAC Pro</title>
        <meta name="description" content="Manage your service appointments" />
      </Head>

      <div className="space-y-6">
        {/* Schedule header with controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium text-lg">
              {weekDays.length > 0 && formatDateRange(weekDays[0], weekDays[6])}
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="ml-2">
              Today
            </Button>
          </div>
          <div className="flex items-center space-x-3 mt-3 sm:mt-0">
            <div className="flex items-center bg-white border rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'tech' ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('tech')}
              >
                By Technician
              </Button>
              <Button
                variant={viewMode === 'day' ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('day')}
              >
                By Day
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Job
            </Button>
          </div>
        </div>

        {/* Week day selector */}
        <div className="bg-white rounded-md shadow overflow-hidden">
          <div className="grid grid-cols-7 divide-x border-b">
            {weekDays.map((day, index) => {
              const isActive = selectedDay === index;
              const dayIsToday = isToday(day);
              
              return (
                <button
                  key={index}
                  className={cn(
                    "py-2 focus:outline-none transition-colors",
                    isActive ? "bg-blue-50" : "hover:bg-gray-50",
                    dayIsToday && "font-bold"
                  )}
                  onClick={() => setSelectedDay(index)}
                >
                  <div className="text-xs uppercase text-gray-500">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={cn(
                    "text-lg",
                    dayIsToday && "text-blue-600"
                  )}>
                    {day.getDate()}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Schedule content */}
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {viewMode === 'tech' ? (
                  /* Technician view */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {technicians.map((tech, index) => (
                      <div key={index} className="bg-gray-50 rounded-md overflow-hidden border">
                        <div className="bg-gray-100 px-4 py-2 font-medium border-b">
                          {tech}
                        </div>
                        <div className="p-3 space-y-2">
                          {weekDays[selectedDay] && getJobsForDay(weekDays[selectedDay])
                            .filter(job => job.tech_name === tech)
                            .map(job => (
                              <div 
                                key={job.id}
                                className={cn(
                                  "rounded-md border p-3 cursor-pointer transition-all hover:shadow-md",
                                  getStatusClasses(job.status, job.priority)
                                )}
                                onClick={() => {
                                  // Handle job click (e.g., show details modal)
                                  console.log('Selected job:', job);
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">{job.service_type}</h3>
                                    <div className="text-sm mt-1">{job.contact_name}</div>
                                    <div className="flex items-center mt-1 text-xs opacity-75">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {formatTime(job.scheduled_at)}
                                    </div>
                                  </div>
                                  <div>
                                    {getStatusBadge(job.status)}
                                  </div>
                                </div>
                                <div className="flex items-center mt-2 text-xs opacity-75 border-t border-current pt-2">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {job.address.split(',')[0]}
                                </div>
                              </div>
                            ))}
                          
                          {weekDays[selectedDay] && getJobsForDay(weekDays[selectedDay])
                            .filter(job => job.tech_name === tech).length === 0 && (
                            <div className="text-center py-8 text-gray-400 border border-dashed rounded-md">
                              No jobs scheduled
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Day view */
                  <div className="space-y-3">
                    {weekDays[selectedDay] && getJobsForDay(weekDays[selectedDay]).length > 0 ? (
                      getJobsForDay(weekDays[selectedDay]).map(job => (
                        <div 
                          key={job.id}
                          className={cn(
                            "rounded-md border p-4 cursor-pointer transition-all hover:shadow-md",
                            getStatusClasses(job.status, job.priority)
                          )}
                          onClick={() => {
                            // Handle job click (e.g., show details modal)
                            console.log('Selected job:', job);
                          }}
                        >
                          <div className="sm:flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">{job.service_type}</h3>
                                {getStatusBadge(job.status)}
                              </div>
                              <div className="mt-2 grid sm:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center">
                                  <User className="h-4 w-4 mr-2 opacity-70" />
                                  {job.contact_name}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 opacity-70" />
                                  {formatTime(job.scheduled_at)}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2 opacity-70" />
                                  {job.address.split(',')[0]}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 sm:mt-0 text-sm bg-white bg-opacity-50 py-1 px-3 rounded border border-current">
                              Technician: {job.tech_name}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-400 border border-dashed rounded-md">
                        No jobs scheduled for this day
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => router.push('/dashboard/schedule/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Job
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/schedule/emergency')}
          >
            <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
            Emergency Service
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/schedule/calendar')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Month View
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}