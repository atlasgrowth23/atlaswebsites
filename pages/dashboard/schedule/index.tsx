import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Plus } from 'lucide-react';
import WeekView from '@/components/dashboard/schedule/WeekView';
import UpcomingJobs from '@/components/dashboard/schedule/UpcomingJobs';

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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
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
  
  // Get all unique tech names from jobs without using Set
  const techNames = jobs
    .map(job => job.tech_name)
    .filter((name, index, array) => array.indexOf(name) === index);
  
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

  // Handle job selection
  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    // This would typically open a job details modal or navigate to a job details page
    console.log('Selected job:', job);
  };

  // Toggle between multi-tech and single view
  const toggleViewMode = () => {
    setIsMultiTech(!isMultiTech);
  };
  
  return (
    <DashboardLayout title="Schedule">
      <Head>
        <title>Schedule | HVAC Dashboard</title>
      </Head>
      
      <div className="space-y-6">
        {/* Main Schedule Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle>Schedule</CardTitle>
              
              <div className="flex space-x-2">
                <Button 
                  variant={isMultiTech ? "default" : "outline"} 
                  size="sm"
                  onClick={toggleViewMode}
                >
                  {isMultiTech ? "Single View" : "Tech View"}
                </Button>
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
          </CardHeader>
          
          <CardContent>
            <WeekView 
              currentDate={currentDate}
              weekDates={weekDates}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onNavigateWeek={navigateWeek}
              getJobsForDayAndTech={getJobsForDayAndTech}
              techNames={techNames}
              isMultiTech={isMultiTech}
              onJobClick={handleJobClick}
            />
          </CardContent>
        </Card>
        
        {/* Upcoming Jobs Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Jobs</CardTitle>
            <CardDescription>Next 7 days of scheduled work</CardDescription>
          </CardHeader>
          
          <CardContent>
            <UpcomingJobs 
              jobs={jobs}
              onJobClick={handleJobClick}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}