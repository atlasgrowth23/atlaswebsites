import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';

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

interface JobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
}

// Helper function to format time for display
const formatTime = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return new Date(dateString).toLocaleTimeString('en-US', options);
};

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
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
    <div 
      className={`border rounded-md p-3 mb-2 ${statusColor} relative cursor-pointer`}
      onClick={() => onClick && onClick(job)}
    >
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

export default JobCard;