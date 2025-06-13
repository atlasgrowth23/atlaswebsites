import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import UnifiedAdminLayout from '@/components/UnifiedAdminLayout';
import { CalendarIcon, ClockIcon, UserIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';

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

interface CalendarData {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  accessRole: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

export default function AdminCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarData[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

  // Form state for creating new events
  const [newEvent, setNewEvent] = useState({
    summary: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    attendeeEmail: ''
  });

  useEffect(() => {
    fetchCalendars();
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    if (selectedCalendar) {
      fetchEvents();
    }
  }, [selectedCalendar]);

  const fetchCalendars = async () => {
    try {
      const response = await fetch('/api/admin/calendar/calendars');
      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch calendars');
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      setError('Failed to fetch calendars');
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/calendar/events?calendarId=${selectedCalendar}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch('/api/admin/calendar/events?upcoming=true');
      if (response.ok) {
        const data = await response.json();
        setUpcomingEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.summary || !newEvent.startDate || !newEvent.startTime || 
        !newEvent.endDate || !newEvent.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const startDateTime = `${newEvent.startDate}T${newEvent.startTime}:00`;
      const endDateTime = `${newEvent.endDate}T${newEvent.endTime}:00`;

      const eventData: CalendarEvent = {
        summary: newEvent.summary,
        description: newEvent.description,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Chicago'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Chicago'
        },
        location: newEvent.location,
        attendees: newEvent.attendeeEmail ? [{
          email: newEvent.attendeeEmail
        }] : undefined
      };

      const response = await fetch(`/api/admin/calendar/events?calendarId=${selectedCalendar}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewEvent({
          summary: '',
          description: '',
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          location: '',
          attendeeEmail: ''
        });
        fetchEvents();
        fetchUpcomingEvents();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    
    return {
      date: start.toLocaleDateString(),
      time: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };
  };

  if (error && error.includes('Calendar access not granted')) {
    return (
      <UnifiedAdminLayout currentPage="calendar">
        <Head>
          <title>Calendar - Admin Panel</title>
        </Head>
        
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <CalendarIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Calendar Access Required
            </h2>
            <p className="text-yellow-700 mb-4">
              To use the calendar integration, you need to grant calendar permissions to your Google account.
            </p>
            <a
              href="/api/admin/google-auth?scopes=calendar"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Grant Calendar Access
            </a>
          </div>
        </div>
      </UnifiedAdminLayout>
    );
  }

  return (
    <UnifiedAdminLayout currentPage="calendar">
      <Head>
        <title>Calendar - Admin Panel</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Calendar Management</h2>
              <p className="text-gray-600">Manage appointments and schedule pipeline meetings</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Event
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Upcoming Events
              </h3>
              
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map((event, index) => {
                    const { date, time } = formatEventTime(event);
                    return (
                      <div key={event.id || index} className="border-l-4 border-blue-500 pl-3">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {event.summary}
                        </h4>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {time}
                        </div>
                        <div className="text-xs text-gray-500">{date}</div>
                        {event.location && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <MapPinIcon className="w-3 h-3 mr-1" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No upcoming events</p>
              )}
            </div>

            {/* Calendar Selection */}
            {calendars.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Calendar
                </h3>
                <select
                  value={selectedCalendar}
                  onChange={(e) => setSelectedCalendar(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {calendars.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.summary} {calendar.primary && '(Primary)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Main Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Embedded Google Calendar */}
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Google Calendar
                </h3>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(selectedCalendar)}&ctz=America/Chicago`}
                    style={{ border: 0 }}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    title="Google Calendar"
                  />
                </div>
              </div>

              {/* Recent Events List */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Events
                </h3>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                    {error}
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-4">
                    {events.slice(0, 10).map((event, index) => {
                      const { date, time } = formatEventTime(event);
                      return (
                        <div key={event.id || index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {event.summary}
                              </h4>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {event.description}
                                </p>
                              )}
                              <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                                <div className="flex items-center">
                                  <ClockIcon className="w-4 h-4 mr-1" />
                                  {time} on {date}
                                </div>
                                {event.location && (
                                  <div className="flex items-center">
                                    <MapPinIcon className="w-4 h-4 mr-1" />
                                    {event.location}
                                  </div>
                                )}
                                {event.attendees && event.attendees.length > 0 && (
                                  <div className="flex items-center">
                                    <UserIcon className="w-4 h-4 mr-1" />
                                    {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              event.status === 'tentative' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.status || 'confirmed'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No events found in this calendar
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Event
            </h3>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.summary}
                  onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendee Email
                </label>
                <input
                  type="email"
                  value={newEvent.attendeeEmail}
                  onChange={(e) => setNewEvent({ ...newEvent, attendeeEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UnifiedAdminLayout>
  );
}