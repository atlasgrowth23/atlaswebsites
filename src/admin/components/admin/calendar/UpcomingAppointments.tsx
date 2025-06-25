import { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon, UserIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

interface UpcomingAppointmentsProps {
  maxEvents?: number;
  showHeader?: boolean;
  className?: string;
}

export default function UpcomingAppointments({ 
  maxEvents = 5, 
  showHeader = true,
  className = ''
}: UpcomingAppointmentsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/calendar/events?upcoming=true');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    
    return {
      date: start.toLocaleDateString(),
      time: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      isToday: start.toDateString() === new Date().toDateString(),
      isTomorrow: start.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString(),
      dayName: start.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.status === 'cancelled') return 'border-red-200 bg-red-50';
    if (event.status === 'tentative') return 'border-yellow-200 bg-yellow-50';
    if (event.summary.toLowerCase().includes('pipeline') || event.summary.toLowerCase().includes('sales')) {
      return 'border-blue-200 bg-blue-50';
    }
    return 'border-gray-200 bg-gray-50';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        {showHeader && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Upcoming Appointments
          </h3>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && error.includes('Calendar access not granted')) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        {showHeader && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Upcoming Appointments
          </h3>
        )}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <CalendarIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm text-yellow-700">Calendar access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {showHeader && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Upcoming Appointments
          </h3>
          <button
            onClick={fetchUpcomingEvents}
            className="text-sm text-gray-500 hover:text-gray-700"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      )}
      
      {error ? (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          {error}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          {events.slice(0, maxEvents).map((event, index) => {
            const { date, time, isToday, isTomorrow, dayName } = formatEventTime(event);
            const colorClass = getEventColor(event);
            
            return (
              <div key={event.id || index} className={`border rounded-lg p-3 ${colorClass}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {event.summary}
                      {event.status === 'cancelled' && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Cancelled
                        </span>
                      )}
                      {event.status === 'tentative' && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Tentative
                        </span>
                      )}
                    </h4>
                    
                    <div className="flex items-center text-xs text-gray-600 space-x-3">
                      <div className="flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        <span>
                          {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dayName} {time}
                        </span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center">
                          <MapPinIcon className="w-3 h-3 mr-1" />
                          <span className="truncate max-w-24">{event.location}</span>
                        </div>
                      )}
                      
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center">
                          <UserIcon className="w-3 h-3 mr-1" />
                          <span>{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-2 text-right">
                    <div className="text-xs text-gray-500">{date}</div>
                    {isToday && (
                      <div className="text-xs font-medium text-blue-600 mt-1">Today</div>
                    )}
                    {isTomorrow && (
                      <div className="text-xs font-medium text-green-600 mt-1">Tomorrow</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {events.length > maxEvents && (
            <div className="text-center pt-2">
              <a
                href="/admin/calendar"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all {events.length} appointments →
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No upcoming appointments</p>
          <p className="text-xs text-gray-400 mt-1">
            Schedule appointments from the pipeline
          </p>
        </div>
      )}
    </div>
  );
}