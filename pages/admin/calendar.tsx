import React, { useState, useEffect } from 'react';
import SimpleAdminLayout from '../../components/SimpleAdminLayout';
import { getCurrentUser, signInWithGoogle, User } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees?: { email: string }[];
  location?: string;
  source: 'google' | 'shared';
  type: 'my' | 'shared' | 'all';
}

export default function CalendarPage() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'shared' | 'all'>('my');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    summary: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    attendees: ['nicholas@atlasgrowth.ai', 'jared@atlasgrowth.ai'],
    sendInvites: true
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, activeTab]);

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

  const createEvent = async () => {
    if (!newEvent.summary || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const startDateTime = new Date(`${newEvent.date}T${newEvent.startTime}`);
      const endDateTime = new Date(`${newEvent.date}T${newEvent.endTime}`);

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
          attendees: newEvent.attendees.map(email => ({ email })),
          calendarType: activeTab === 'my' ? 'personal' : 'shared'
        }),
      });

      if (response.ok) {
        setShowEventModal(false);
        setNewEvent({
          summary: '',
          date: '',
          startTime: '',
          endTime: '',
          location: '',
          attendees: ['nicholas@atlasgrowth.ai', 'jared@atlasgrowth.ai'],
          sendInvites: true
        });
        await loadEvents();
      } else {
        const errorData = await response.json();
        if (errorData.warning) {
          if (confirm(errorData.warning)) {
            // TODO: Implement force create outside working hours
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

  if (loading) {
    return (
      <SimpleAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </SimpleAdminLayout>
    );
  }

  if (!user) {
    return (
      <SimpleAdminLayout>
        <div className="flex items-center justify-center h-64">
          <button
            onClick={signInWithGoogle}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Sign in with Google
          </button>
        </div>
      </SimpleAdminLayout>
    );
  }

  return (
    <SimpleAdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <button
            onClick={() => setShowEventModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            New Event
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              activeTab === 'my'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              activeTab === 'shared'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Shared
          </button>
          {user.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
          )}
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 7);
              setSelectedDate(prev);
            }}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            ← Previous Week
          </button>
          <h2 className="text-lg font-medium">
            {selectedDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
          <button
            onClick={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 7);
              setSelectedDate(next);
            }}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Next Week →
          </button>
        </div>

        {/* Weekly View */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center font-medium text-sm">
              {day}
            </div>
          ))}
          
          {generateWeekDays().map(day => {
            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={day.toISOString()}
                className={`bg-white p-2 min-h-[120px] ${
                  isToday ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded ${
                        event.source === 'shared'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <div className="font-medium truncate">{event.summary}</div>
                      <div className="text-xs opacity-75">
                        {new Date(event.start.dateTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-w-full">
              <h3 className="text-lg font-medium mb-4">New Event</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Summary *</label>
                  <input
                    type="text"
                    value={newEvent.summary}
                    onChange={(e) => setNewEvent({...newEvent, summary: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Event title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time *</label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time *</label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Meeting location"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={newEvent.sendInvites}
                      onChange={(e) => setNewEvent({...newEvent, sendInvites: e.target.checked})}
                      className="mr-2"
                    />
                    Send invites
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={createEvent}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SimpleAdminLayout>
  );
}