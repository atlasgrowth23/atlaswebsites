import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CalendarIcon, Clock, MapPin, User } from 'lucide-react';

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

interface UpcomingJobsProps {
  jobs: Job[];
  onViewAllClick?: () => void;
  onJobClick?: (job: Job) => void;
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

const UpcomingJobs: React.FC<UpcomingJobsProps> = ({ jobs, onViewAllClick, onJobClick }) => {
  // Only show jobs that are upcoming and not completed
  const upcomingJobs = jobs
    .filter(job => new Date(job.scheduled_at) > new Date() && job.status !== 'completed')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="space-y-4">
        {upcomingJobs.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No upcoming jobs scheduled
          </div>
        ) : (
          upcomingJobs.map(job => (
            <div 
              key={job.id} 
              className="flex space-x-4 border-b pb-4 last:border-0 cursor-pointer"
              onClick={() => onJobClick && onJobClick(job)}
            >
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
          ))
        )}
      </div>
      
      {upcomingJobs.length > 0 && (
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onViewAllClick}
          >
            View Full Schedule
          </Button>
        </div>
      )}
    </div>
  );
};

export default UpcomingJobs;