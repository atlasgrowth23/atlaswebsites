import React, { useState, useEffect } from 'react';
import UnifiedAdminLayout from '../../components/UnifiedAdminLayout';
import { getCurrentUser, signInWithGoogle, User } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees?: { email: string }[];
  location?: string;
  description?: string;
  source: 'google' | 'shared';
  type: 'my' | 'shared' | 'all';
  demo?: boolean;
}

export default function CalendarPage() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'shared' | 'all'>('my');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [newEvent, setNewEvent] = useState({
    summary: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    attendees: ['nicholas@atlasgrowth.ai', 'jared@atlasgrowth.ai'],
    calendarType: 'shared' as 'my' | 'shared'
  });

  useEffect(() => {
    initializeAuth();
    loadDemoSettings();
  }, []);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, activeTab, demoMode]);

  useEffect(() => {
    if (demoMode) {
      createDemoEvents();
    } else {
      removeDemoEvents();
    }
  }, [demoMode]);

  const loadDemoSettings = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const response = await fetch('/api/admin/settings/demo-mode', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDemoMode(data.demoMode || false);
      }
    } catch (error) {
      console.error('Error loading demo settings:', error);
    }
  };

  const toggleDemoMode = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const newDemoMode = !demoMode;
      
      const response = await fetch('/api/admin/settings/demo-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({ demoMode: newDemoMode }),
      });

      if (response.ok) {
        setDemoMode(newDemoMode);
      }
    } catch (error) {
      console.error('Error toggling demo mode:', error);
    }
  };

  const createDemoEvents = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);

    const demoEvents: CalendarEvent[] = [
      {
        id: 'demo-event-1',
        summary: 'Team Standup',
        start: { dateTime: tomorrow.toISOString() },
        end: { dateTime: new Date(tomorrow.getTime() + 30 * 60000).toISOString() },
        attendees: [
          { email: 'nicholas@atlasgrowth.ai' },
          { email: 'jared@atlasgrowth.ai' }
        ],
        location: 'Virtual',
        description: 'Daily team sync and project updates',
        source: 'shared',
        type: 'shared',
        demo: true
      },
      {
        id: 'demo-event-2',
        summary: 'Client Call - HVAC System Review',
        start: { dateTime: nextWeek.toISOString() },
        end: { dateTime: new Date(nextWeek.getTime() + 60 * 60000).toISOString() },
        attendees: [
          { email: 'nicholas@atlasgrowth.ai' },
          { email: 'client@example.com' }
        ],
        location: 'Zoom',
        description: 'Review HVAC system implementation and next steps',
        source: 'shared',
        type: 'shared',
        demo: true
      }
    ];

    setEvents(prev => [...prev.filter(e => !e.demo), ...demoEvents]);
  };

  const removeDemoEvents = () => {
    setEvents(prev => prev.filter(e => !e.demo));
  };

  const initializeAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        await signInWithGoogle();
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    if (demoMode) return; // Skip loading real events in demo mode
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 7);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30);

      const response = await fetch(`/api/admin/calendar/events?tab=${activeTab}&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const checkFreeBusy = async (startTime: string, endTime: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return { available: true };

      const response = await fetch('/api/admin/calendar/freebusy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          timeMin: startTime,
          timeMax: endTime,
          calendarIds: ['primary'] // Add shared calendar ID if needed
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Check if there are any busy periods
        const hasConflicts = Object.values(data.calendars || {}).some((cal: any) => 
          cal.busy && cal.busy.length > 0
        );
        return { available: !hasConflicts };
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
    return { available: true };
  };

  const createEvent = async () => {
    if (!newEvent.summary || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    const startDateTime = new Date(`${newEvent.date}T${newEvent.startTime}`);
    const endDateTime = new Date(`${newEvent.date}T${newEvent.endTime}`);

    // Check availability
    const availability = await checkFreeBusy(startDateTime.toISOString(), endDateTime.toISOString());
    
    if (!availability.available) {
      if (!confirm('⚠️ Time conflict detected. Continue anyway?')) {
        return;
      }
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const response = await fetch('/api/admin/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          summary: newEvent.summary,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
          location: newEvent.location,
          description: newEvent.description,
          attendees: newEvent.attendees.map(email => ({ email })),
          calendarType: newEvent.calendarType
        }),
      });

      if (response.ok) {
        setShowEventModal(false);
        resetEventForm();
        await loadEvents();
      } else {
        const errorData = await response.json();
        if (errorData.warning) {
          if (confirm(errorData.warning)) {
            // Force create outside working hours
            // Implementation would go here
          }
        } else {
          alert('Error creating event: ' + errorData.error);
        }
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event');
    }
  };

  const resetEventForm = () => {
    setNewEvent({
      summary: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      description: '',
      attendees: ['nicholas@atlasgrowth.ai', 'jared@atlasgrowth.ai'],
      calendarType: 'shared'
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const generateWeekDays = () => {
    const week = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'my': return '👤';
      case 'shared': return '👥';
      case 'all': return '🌍';
      default: return '';
    }
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.source === 'shared' || event.type === 'shared') {
      return 'bg-green-100 border-green-200 text-green-800';
    }
    return 'bg-blue-100 border-blue-200 text-blue-800';
  };

  if (loading) {
    return (
      <UnifiedAdminLayout currentPage="calendar">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="ml-3 text-lg text-gray-600">Loading calendar...</div>
        </div>
      </UnifiedAdminLayout>
    );
  }

  if (!user) {
    return (
      <UnifiedAdminLayout currentPage="calendar">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <div className="text-xl font-medium mb-4">Google Authentication Required</div>
            <button
              onClick={signInWithGoogle}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              🔗 Connect Google Calendar
            </button>
          </div>
        </div>
      </UnifiedAdminLayout>
    );
  }

  return (
    <UnifiedAdminLayout currentPage="calendar">
      <div className={`h-full ${demoMode ? 'bg-amber-50' : 'bg-white'} transition-colors duration-500`}>
        {demoMode && (
          <div className="absolute top-4 left-4 z-10 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
            🎭 DEMO MODE
          </div>
        )}

        {/* Demo Mode Toggle */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-3">
          <span className="text-sm text-gray-600">Demo Mode</span>
          <button
            onClick={toggleDemoMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              demoMode ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                demoMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600 mt-1">Manage your schedule and team events</p>
            </div>
            <button
              onClick={() => setShowEventModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center space-x-2"
            >
              <span>📅</span>
              <span>New Event</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
              {(['my', 'shared', 'all'] as const).map((tab) => {
                if (tab === 'all' && user.role !== 'super_admin') return null;
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{getTabIcon(tab)}</span>
                    <span className="capitalize">{tab} Calendar</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    calendarView === 'week'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setCalendarView('month')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    calendarView === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - (calendarView === 'week' ? 7 : 30));
                setSelectedDate(prev);
              }}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <span>←</span>
              <span>Previous {calendarView}</span>
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            
            <button
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + (calendarView === 'week' ? 7 : 30));
                setSelectedDate(next);
              }}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <span>Next {calendarView}</span>
              <span>→</span>
            </button>
          </div>

          {/* Calendar View */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="p-4 text-center">
                  <div className="font-medium text-gray-900">{day}</div>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 divide-x divide-gray-200">
              {generateWeekDays().map(day => {
                const dayEvents = getEventsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[150px] p-3 ${
                      isWeekend ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-gray-50 transition-colors duration-200`}
                  >
                    <div className={`text-sm font-medium mb-3 flex items-center justify-between ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      <span className={`${
                        isToday ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''
                      }`}>
                        {day.getDate()}
                      </span>
                      {isToday && (
                        <span className="text-xs text-blue-600 font-medium">TODAY</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className={`p-2 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-all duration-200 ${getEventColor(event)}`}
                          title={`${event.summary}\n${new Date(event.start.dateTime).toLocaleTimeString()} - ${new Date(event.end.dateTime).toLocaleTimeString()}\n${event.location || ''}`}
                        >
                          <div className="font-medium truncate">{event.summary}</div>
                          <div className="text-xs opacity-75 mt-1">
                            {new Date(event.start.dateTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                            {event.location && (
                              <span className="ml-2">📍 {event.location}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {dayEvents.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <div className="text-2xl mb-2">📅</div>
                          <div className="text-xs">No events</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Events Summary */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {events
                .filter(event => new Date(event.start.dateTime) > new Date())
                .slice(0, 5)
                .map(event => (
                  <div key={event.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                    <div className={`w-3 h-3 rounded-full ${
                      event.source === 'shared' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{event.summary}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(event.start.dateTime).toLocaleString()}
                        {event.location && ` • ${event.location}`}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.source === 'shared' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {event.source === 'shared' ? 'Team' : 'Personal'}
                    </div>
                  </div>
                ))}
              
              {events.filter(event => new Date(event.start.dateTime) > new Date()).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🗓️</div>
                  <div className="text-lg font-medium">No upcoming events</div>
                  <div className="text-sm mt-1">Create an event to get started</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Create New Event</h3>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      resetEventForm();
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
                    <input
                      type="text"
                      value={newEvent.summary}
                      onChange={(e) => setNewEvent({...newEvent, summary: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calendar</label>
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setNewEvent({...newEvent, calendarType: 'my'})}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                          newEvent.calendarType === 'my'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        👤 My Calendar
                      </button>
                      <button
                        onClick={() => setNewEvent({...newEvent, calendarType: 'shared'})}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                          newEvent.calendarType === 'shared'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        👥 Shared
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                      <input
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                      <input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Meeting room, Zoom link, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Event details and agenda"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-8">
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      resetEventForm();
                    }}
                    className="flex-1 py-3 px-4 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createEvent}
                    disabled={!newEvent.summary || !newEvent.date || !newEvent.startTime || !newEvent.endTime}
                    className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedAdminLayout>
  );
}