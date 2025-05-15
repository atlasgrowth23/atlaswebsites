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
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  CalendarDays,
  CalendarIcon,
  Calendar as CalendarRange,
  MoreHorizontal
} from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// Status badge component
interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'emergency':
      return (
        <Badge variant="outline" className="bg-gray-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Emergency
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="outline" className="bg-gray-50 text-amber-700 border-amber-200">
          <Loader2 className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="bg-gray-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-blue-700 border-blue-200">
          <CalendarIcon className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
  }
};

export default function SchedulePage() {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [viewMode, setViewMode] = useState<'day' | 'tech' | 'week'>('day');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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
        },
        {
          id: '6',
          contact_id: '6',
          contact_name: 'Jennifer Thomas',
          tech_id: 'T3',
          tech_name: 'Sarah Lee',
          service_type: 'AC Tune-up',
          status: 'scheduled',
          priority: 'normal',
          scheduled_at: '2025-05-16T11:00:00',
          address: '789 Maple Dr, Highland, TX',
          notes: 'Annual maintenance. Customer has pets that should be kept away from work area.'
        },
        {
          id: '7',
          contact_id: '7',
          contact_name: 'Robert Jackson',
          tech_id: 'T1',
          tech_name: 'Mike Johnson',
          service_type: 'Duct Cleaning',
          status: 'scheduled',
          priority: 'normal',
          scheduled_at: '2025-05-16T14:30:00',
          address: '345 Cedar Ave, Westfield, MI',
          notes: 'Full home duct cleaning. Customer mentioned concerns about air quality.'
        }
      ];
      
      setJobs(mockJobs);
      setFilteredJobs(mockJobs);
      setLoading(false);
    }, 800);
  }, [currentDate]);

  // Update filtered jobs when search or filter changes
  useEffect(() => {
    let filtered = [...jobs];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }
    
    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter]);

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
    
    return filteredJobs.filter(job => {
      const jobDate = new Date(job.scheduled_at).toISOString().split('T')[0];
      return jobDate === dateString;
    }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  };
  
  // Handle going to today
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDay() === 0 ? 6 : today.getDay() - 1);
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
              Manage service appointments and technician schedules
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex space-x-3">
            <Button 
              variant="outline"
              className="text-gray-700 border-gray-300 h-9"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-gray-900 hover:bg-gray-800 h-9">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        </div>

        {/* View toggles and date navigation */}
        <div className="mb-5 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 text-gray-500"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-none h-9 pl-3 pr-2 text-gray-900"
              onClick={goToToday}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              <span className="pr-1">
                {weekDays.length > 0 && formatDateRange(weekDays[0], weekDays[6])}
              </span>
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 text-gray-500"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              className="h-9 ml-2 text-gray-700"
              onClick={goToToday}
            >
              Today
            </Button>
          </div>
          
          <div className="flex space-x-1 sm:space-x-2">
            <div className="inline-flex rounded-md border border-gray-200 bg-white p-1">
              <Button 
                variant={viewMode === 'day' ? "default" : "ghost"} 
                size="sm"
                className={cn(
                  "rounded-sm h-7 text-xs px-3",
                  viewMode === 'day' 
                    ? "bg-gray-900 text-white hover:bg-gray-800" 
                    : "text-gray-700"
                )}
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
              <Button 
                variant={viewMode === 'tech' ? "default" : "ghost"} 
                size="sm"
                className={cn(
                  "rounded-sm h-7 text-xs px-3",
                  viewMode === 'tech' 
                    ? "bg-gray-900 text-white hover:bg-gray-800" 
                    : "text-gray-700"
                )}
                onClick={() => setViewMode('tech')}
              >
                Technician
              </Button>
              <Button 
                variant={viewMode === 'week' ? "default" : "ghost"} 
                size="sm"
                className={cn(
                  "rounded-sm h-7 text-xs px-3",
                  viewMode === 'week' 
                    ? "bg-gray-900 text-white hover:bg-gray-800" 
                    : "text-gray-700"
                )}
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
            </div>

            <div className="relative hidden sm:block w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input 
                type="text"
                placeholder="Search jobs..."
                className="pl-9 h-9 border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 text-gray-700">
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter === 'all' ? 'All Status' : 
                    statusFilter === 'scheduled' ? 'Scheduled' :
                    statusFilter === 'in_progress' ? 'In Progress' :
                    statusFilter === 'completed' ? 'Completed' :
                    statusFilter === 'emergency' ? 'Emergency' : 'Cancelled'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setStatusFilter('all')}
                >
                  All Status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setStatusFilter('scheduled')}
                >
                  Scheduled
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setStatusFilter('in_progress')}
                >
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setStatusFilter('completed')}
                >
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setStatusFilter('emergency')}
                >
                  Emergency
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setStatusFilter('cancelled')}
                >
                  Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Week day selector */}
        <div className="mb-6 bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day, index) => {
              const isActive = selectedDay === index;
              const dayIsToday = isToday(day);
              
              return (
                <button
                  key={index}
                  className={cn(
                    "py-3 focus:outline-none transition-colors border-r last:border-r-0",
                    isActive ? "bg-gray-100" : "hover:bg-gray-50",
                  )}
                  onClick={() => setSelectedDay(index)}
                >
                  <div 
                    className={cn(
                      "text-xs uppercase",
                      isActive ? "text-gray-900" : "text-gray-500"
                    )}
                  >
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={cn(
                    "text-xl mt-1 font-medium",
                    dayIsToday ? "text-gray-900" : isActive ? "text-gray-900" : "text-gray-600",
                    dayIsToday && "relative"
                  )}>
                    {day.getDate()}
                    {dayIsToday && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 rounded-full mt-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main schedule content */}
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white border border-gray-200 rounded-md">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            {viewMode === 'day' && (
              <div className="bg-white border border-gray-200 rounded-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    {weekDays[selectedDay] ? formatDate(weekDays[selectedDay]) : ''}
                  </h2>
                </div>
                
                <div className="p-6">
                  {weekDays[selectedDay] && getJobsForDay(weekDays[selectedDay]).length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border border-dashed rounded-md border-gray-300">
                      No jobs scheduled for this day
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {weekDays[selectedDay] && getJobsForDay(weekDays[selectedDay]).map(job => (
                        <div 
                          key={job.id}
                          className={cn(
                            "border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors",
                            job.status === 'emergency' && "border-l-4 border-l-red-400",
                            job.status === 'in_progress' && "border-l-4 border-l-yellow-400",
                            job.status === 'completed' && "border-l-4 border-l-green-400"
                          )}
                        >
                          <div className="sm:flex justify-between items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-900">{job.service_type}</h3>
                                <StatusBadge status={job.status} />
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 text-sm text-gray-700">
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
                            
                            <div className="mt-3 sm:mt-0 flex items-center space-x-2">
                              <div className="text-sm bg-gray-100 py-1 px-2 rounded border border-gray-200 text-gray-900">
                                {job.tech_name}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem className="cursor-pointer">
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    Edit Job
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    Update Status
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="cursor-pointer text-red-600">
                                    Cancel Job
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {job.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                              <p className="line-clamp-2">{job.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {viewMode === 'tech' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {technicians.map((tech, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-md overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-medium text-gray-900">{tech}</h3>
                    </div>
                    
                    <div className="p-4">
                      {weekDays[selectedDay] && getJobsForDay(weekDays[selectedDay])
                        .filter(job => job.tech_name === tech)
                        .length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border border-dashed rounded-md border-gray-300">
                          No jobs scheduled
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {weekDays[selectedDay] && getJobsForDay(weekDays[selectedDay])
                            .filter(job => job.tech_name === tech)
                            .map(job => (
                              <div 
                                key={job.id}
                                className={cn(
                                  "border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors",
                                  job.status === 'emergency' && "border-l-4 border-l-red-400",
                                  job.status === 'in_progress' && "border-l-4 border-l-yellow-400",
                                  job.status === 'completed' && "border-l-4 border-l-green-400"
                                )}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-gray-900">{job.service_type}</h4>
                                      <StatusBadge status={job.status} />
                                    </div>
                                    <div className="flex items-center text-sm text-gray-700">
                                      <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" /> 
                                      {formatTime(job.scheduled_at)}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-700 mt-1">
                                      <User className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                      {job.contact_name}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-700 mt-1">
                                      <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                      {job.address.split(',')[0]}
                                    </div>
                                  </div>
                                  
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {viewMode === 'week' && (
              <div className="bg-white border border-gray-200 rounded-md overflow-auto">
                <div className="min-w-[1000px]">
                  <div className="grid grid-cols-8 border-b">
                    <div className="p-4 text-sm font-medium text-gray-500 border-r">
                      Technicians
                    </div>
                    {weekDays.map((day, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "p-4 text-center text-sm font-medium border-r last:border-r-0",
                          isToday(day) ? "text-gray-900" : "text-gray-500",
                          i === selectedDay && "bg-gray-50"
                        )}
                      >
                        <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-base font-semibold mt-1">{day.getDate()}</div>
                      </div>
                    ))}
                  </div>
                  
                  {technicians.map((tech, techIndex) => (
                    <div key={tech} className="grid grid-cols-8 border-b last:border-b-0">
                      <div className={cn(
                        "p-4 font-medium text-gray-900 border-r",
                        techIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                      )}>
                        {tech}
                      </div>
                      
                      {weekDays.map((day, dayIndex) => {
                        const dayJobs = filteredJobs.filter(job => {
                          const jobDate = new Date(job.scheduled_at).toISOString().split('T')[0];
                          return jobDate === day.toISOString().split('T')[0] && job.tech_name === tech;
                        });
                        
                        return (
                          <div 
                            key={dayIndex} 
                            className={cn(
                              "p-2 border-r last:border-r-0 relative",
                              techIndex % 2 === 0 ? "bg-gray-50" : "bg-white",
                              dayIndex === selectedDay && "bg-gray-100"
                            )}
                            onClick={() => setSelectedDay(dayIndex)}
                          >
                            <div className="space-y-1">
                              {dayJobs.length === 0 ? (
                                <div className="h-12 flex items-center justify-center text-xs text-gray-400">
                                  No jobs
                                </div>
                              ) : (
                                dayJobs.map(job => (
                                  <div 
                                    key={job.id} 
                                    className={cn(
                                      "px-2 py-1.5 text-xs rounded border",
                                      job.status === 'emergency' ? "bg-red-50 border-red-200 text-red-800" :
                                      job.status === 'in_progress' ? "bg-yellow-50 border-yellow-200 text-yellow-800" :
                                      job.status === 'completed' ? "bg-green-50 border-green-200 text-green-800" :
                                      "bg-blue-50 border-blue-200 text-blue-800"
                                    )}
                                  >
                                    <div className="font-medium">{job.service_type}</div>
                                    <div className="flex items-center mt-0.5 text-[10px]">
                                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                                      {formatTime(job.scheduled_at)}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Upcoming emergencies */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Emergency Service Requests</h3>
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            {filteredJobs.filter(job => job.status === 'emergency').length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No emergency service requests at this time.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredJobs
                  .filter(job => job.status === 'emergency')
                  .map(job => (
                    <div key={job.id} className="p-4 hover:bg-gray-50">
                      <div className="sm:flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status="emergency" />
                            <h4 className="font-medium text-gray-900">{job.service_type}</h4>
                          </div>
                          <div className="text-sm text-gray-700">{job.contact_name}</div>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" /> 
                            {formatDate(new Date(job.scheduled_at))} at {formatTime(job.scheduled_at)}
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-0 flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-gray-700 h-8"
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-gray-900 hover:bg-gray-800 h-8"
                          >
                            Dispatch
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