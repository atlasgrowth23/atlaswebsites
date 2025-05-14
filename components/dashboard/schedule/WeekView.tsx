import React from 'react';
import { Button } from '@/components/ui/button';
import JobCard from './JobCard';
import { 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

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

interface WeekViewProps {
  currentDate: Date;
  weekDates: Date[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onNavigateWeek: (direction: 'prev' | 'next') => void;
  getJobsForDayAndTech: (date: Date, techId?: string) => Job[];
  techNames: string[];
  isMultiTech: boolean;
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

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  weekDates,
  selectedDay,
  onSelectDay,
  onNavigateWeek,
  getJobsForDayAndTech,
  techNames,
  isMultiTech,
  onJobClick
}) => {
  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => onNavigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onNavigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-2 text-lg font-semibold">
              {weekDates.length > 0 && `${formatDate(weekDates[0].toISOString())} - ${formatDate(weekDates[6].toISOString())}`}
            </div>
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
                onClick={() => onSelectDay(index)}
              >
                <div className="text-center">
                  <div className="text-xs">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-sm font-semibold">{date.getDate()}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
      
      <div>
        {isMultiTech ? (
          // Multi-tech view (columns for each tech)
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {techNames.map((techName, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="text-center mb-4 pb-2 border-b">
                  <h3 className="font-medium">{techName}</h3>
                </div>
                
                <div>
                  {weekDates[selectedDay] &&
                    getJobsForDayAndTech(weekDates[selectedDay])
                      .filter(job => job.tech_name === techName)
                      .map(job => (
                        <JobCard key={job.id} job={job} onClick={onJobClick} />
                      ))}
                      
                  {weekDates[selectedDay] && 
                    getJobsForDayAndTech(weekDates[selectedDay])
                      .filter(job => job.tech_name === techName)
                      .length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm border border-dashed rounded-md">
                      No jobs scheduled
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Single view (list of jobs for the day)
          <div className="border rounded-md p-4">
            <div className="text-center mb-4 pb-2 border-b">
              <h3 className="font-medium">
                {weekDates[selectedDay] && formatDate(weekDates[selectedDay].toISOString())}
              </h3>
            </div>
            
            {weekDates[selectedDay] && getJobsForDayAndTech(weekDates[selectedDay]).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No jobs scheduled for this day
              </div>
            ) : (
              <div className="space-y-3">
                {weekDates[selectedDay] && getJobsForDayAndTech(weekDates[selectedDay])
                  .map(job => (
                    <JobCard key={job.id} job={job} onClick={onJobClick} />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeekView;