import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/dashboard/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Tool,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
  CheckCircle2
} from 'lucide-react';

// Types for the schedule page
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

// Helper function to format date for display
const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short', 
    month: 'short', 
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Helper function to format time for display
const formatTime = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return new Date(dateString).toLocaleTimeString('en-US', options);
};

// Generate week dates
const getWeekDates = (date: Date) => {
  const day = date.getDay(); // 0 is Sunday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    weekDates.push(nextDate);
  }
  
  return weekDates;
};

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() - 1);
  const [isMultiTech, setIsMultiTech] = useState<boolean>(true);
  const [techFilters, setTechFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  
  // Set up week dates when current date changes
  useEffect(() => {
    setWeekDates(getWeekDates(new Date(currentDate)));
  }, [currentDate]);
  
  // Mocked job data - this would be replaced with an API call
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
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
          status: 'completed',
          priority: 'normal',
          scheduled_at: '2025-05-13T15:30:00',
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
      
      // Get unique tech IDs for filtering
      const techIds = Array.from(new Set(mockJobs.map(job => job.tech_id)));
      setTechFilters(techIds);
      
    }, 800);
  }, []);
  
  // Helper function to get jobs for a specific day and tech
  const getJobsForDayAndTech = (date: Date, techId?: string) => {
    const dateString = date.toISOString().split('T')[0];
    
    return jobs.filter(job => {
      const jobDate = new Date(job.scheduled_at).toISOString().split('T')[0];
      return jobDate === dateString && (!techId || job.tech_id === techId);
    }).sort((a, b) => {
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    });
  };
  
  // Get all unique tech names from jobs
  const techNames = [...new Set(jobs.map(job => job.tech_name))];
  
  // Get all jobs for current selected day
  const selectedDayJobs = weekDates[selectedDay] ? 
    getJobsForDayAndTech(weekDates[selectedDay]) : [];
  
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
  
  // Styled component for job card based on status/priority
  const JobCard = ({ job }: { job: Job }) => {
    let statusColor = 'bg-gray-100 border-gray-300';
    let statusTextColor = 'text-gray-800';
    let statusBadgeClass = 'bg-gray-100 text-gray-800';
    
    switch (job.status) {
      case 'emergency':
        statusColor = 'bg-red-50 border-red-300';
        statusTextColor = 'text-red-800';
        statusBadgeClass = 'bg-red-100 text-red-800';
        break;
      case 'in_progress':
        statusColor = 'bg-yellow-50 border-yellow-300';
        statusTextColor = 'text-yellow-800';
        statusBadgeClass = 'bg-yellow-100 text-yellow-800';
        break;
      case 'completed':
        statusColor = 'bg-green-50 border-green-300 opacity-75';
        statusTextColor = 'text-green-800';
        statusBadgeClass = 'bg-green-100 text-green-800';
        break;
      default:
        if (job.priority === 'emergency') {
          statusColor = 'bg-red-50 border-red-300';
          statusTextColor = 'text-red-800';
          statusBadgeClass = 'bg-red-100 text-red-800';
        } else if (job.priority === 'high') {
          statusColor = 'bg-orange-50 border-orange-300';
          statusTextColor = 'text-orange-800';
          statusBadgeClass = 'bg-orange-100 text-orange-800';
        }
    }
    
    return (
      <div className={`border rounded-md p-3 mb-2 ${statusColor} relative`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`font-medium ${statusTextColor}`}>{job.service_type}</p>
            <div className="flex items-center mt-1 text-xs text-gray-600">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatTime(job.scheduled_at)}</span>
            </div>
            <div className="flex items-center mt-1 text-xs text-gray-600">
              <User className="h-3 w-3 mr-1" />
              <span>{job.contact_name}</span>
            </div>
          </div>
          
          <div>
            <Badge className={statusBadgeClass}>
              {job.status === 'in_progress' ? 'In Progress' : 
               job.status === 'completed' ? 'Completed' : 
               job.status === 'emergency' ? 'Emergency' : 
               job.status === 'cancelled' ? 'Cancelled' : 'Scheduled'}
            </Badge>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <DashboardLayout title="Schedule">
      <Head>
        <title>Schedule | HVAC Dashboard</title>
      </Head>
      
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="ml-2 text-lg font-semibold">
                  {weekDates.length > 0 && `${formatDate(weekDates[0].toISOString())} - ${formatDate(weekDates[6].toISOString())}`}
                </div>
              </div>
              
              <div className="flex space-x-2">
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
            
            {/* Day selector pills */}
            <div className="flex space-x-1 mt-4 overflow-x-auto pb-1">
              {weekDates.map((date, index) => {
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelected = selectedDay === index;
                
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : isToday ? "outline" : "ghost"}
                    size="sm"
                    className={`
                      ${isSelected ? 'bg-blue-600 text-white' : ''} 
                      ${isToday && !isSelected ? 'border-blue-300 text-blue-700' : ''} 
                      rounded-full px-4
                    `}
                    onClick={() => setSelectedDay(index)}
                  >
                    <div className="text-center">
                      <div className="text-xs">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-sm font-semibold">{date.getDate()}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardHeader>
          
          <CardContent>
            {isMultiTech ? (
              // Multi-tech view (columns for each tech)
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {techNames.map((techName, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="text-center mb-4 pb-2 border-b">
                      <h3 className="font-medium">{techName}</h3>
                    </div>
                    
                    <div>
                      {jobs
                        .filter(job => 
                          job.tech_name === techName && 
                          new Date(job.scheduled_at).toDateString() === weekDates[selectedDay]?.toDateString()
                        )
                        .sort((a, b) => 
                          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
                        )
                        .map(job => (
                          <JobCard key={job.id} job={job} />
                        ))}
                        
                      {jobs.filter(job => 
                        job.tech_name === techName && 
                        new Date(job.scheduled_at).toDateString() === weekDates[selectedDay]?.toDateString()
                      ).length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm border border-dashed rounded-md">
                          No jobs scheduled
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Single tech view (list of jobs for the day)
              <div className="border rounded-md p-4">
                <div className="text-center mb-4 pb-2 border-b">
                  <h3 className="font-medium">{formatDate(weekDates[selectedDay]?.toISOString() || new Date().toISOString())}</h3>
                </div>
                
                {selectedDayJobs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No jobs scheduled for this day
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayJobs.map(job => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Jobs</CardTitle>
          <CardDescription>Next 7 days of scheduled work</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {jobs
              .filter(job => new Date(job.scheduled_at) > new Date() && job.status !== 'completed')
              .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
              .slice(0, 5)
              .map(job => (
                <div key={job.id} className="flex space-x-4 border-b pb-4 last:border-0">
                  <div className="flex-shrink-0">
                    {job.status === 'emergency' ? (
                      <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{job.service_type}</p>
                        <p className="text-sm text-gray-600">{job.contact_name}</p>
                      </div>
                      
                      <Badge variant={job.status === 'emergency' ? 'destructive' : 'outline'}>
                        {job.status === 'emergency' ? 'Emergency' : formatDate(job.scheduled_at)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {formatTime(job.scheduled_at)}
                      <MapPin className="h-3.5 w-3.5 ml-3 mr-1" />
                      {job.address.split(',')[0]}
                      <User className="h-3.5 w-3.5 ml-3 mr-1" />
                      {job.tech_name}
                    </div>
                  </div>
                </div>
              ))}
              
            {jobs.filter(job => new Date(job.scheduled_at) > new Date() && job.status !== 'completed').length === 0 && (
              <div className="text-center py-6 text-gray-500">
                No upcoming jobs scheduled
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          <Button variant="outline" className="ml-auto">View Full Schedule</Button>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}