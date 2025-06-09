import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

interface Session {
  id: string;
  user_name: string;
  start_time: string;
  end_time: string | null;
  leads_processed: number;
  calls_made: number;
  contacts_made: number;
  voicemails_left: number;
  created_at: string;
}

interface Activity {
  id: string;
  action: string;
  action_data: any;
  created_at: string;
  lead_id: string;
  company_name?: string;
}

interface SessionsPageProps {
  initialSessions: Session[];
  currentUser: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get recent sessions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: sessions, error } = await supabaseAdmin
      .from('cold_call_sessions')
      .select('*')
      .gte('start_time', sevenDaysAgo.toISOString())
      .order('start_time', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching sessions:', error);
      return {
        props: {
          initialSessions: [],
          currentUser: 'Nick' // Default user
        }
      };
    }

    return {
      props: {
        initialSessions: sessions || [],
        currentUser: 'Nick' // TODO: Get from auth context
      }
    };
  } catch (error) {
    console.error('Server-side error:', error);
    return {
      props: {
        initialSessions: [],
        currentUser: 'Nick'
      }
    };
  }
};

export default function SessionsPage({ initialSessions, currentUser }: SessionsPageProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>(currentUser);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [selectedSessionActivities, setSelectedSessionActivities] = useState<Activity[]>([]);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);

  // Check for active session on load
  useEffect(() => {
    const active = sessions.find(s => s.user_name === currentUser && !s.end_time);
    setActiveSession(active || null);
  }, [sessions, currentUser]);

  // Refresh sessions data
  const refreshSessions = async () => {
    try {
      const response = await fetch(`/api/sessions?user=${selectedUser}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    }
  };

  // Start new session
  const startSession = async () => {
    setIsStarting(true);
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: currentUser })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);
        await refreshSessions();
      } else {
        const error = await response.json();
        alert(`Failed to start session: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  // End active session
  const endSession = async () => {
    if (!activeSession) return;
    
    setIsEnding(true);
    try {
      const response = await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: currentUser })
      });

      if (response.ok) {
        setActiveSession(null);
        await refreshSessions();
      } else {
        const error = await response.json();
        alert(`Failed to end session: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      alert('Failed to end session. Please try again.');
    } finally {
      setIsEnding(false);
    }
  };

  // View session details
  const viewSessionDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/activities`);
      if (response.ok) {
        const data = await response.json();
        setSelectedSessionActivities(data.activities);
        setViewingSessionId(sessionId);
      }
    } catch (error) {
      console.error('Failed to fetch session activities:', error);
    }
  };

  // Format duration
  const formatDuration = (startTime: string, endTime?: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Activity display names
  const getActivityDisplayName = (action: string): string => {
    const actionMap: Record<string, string> = {
      'preview_website': 'Previewed website',
      'view_google_reviews': 'Viewed Google Reviews',
      'call_started': 'Started call',
      'sms_answer_call_sent': 'Sent Answer Call SMS',
      'sms_voicemail_1_sent': 'Sent Voicemail Part 1 SMS',
      'sms_voicemail_2_sent': 'Sent Voicemail Part 2 SMS',
      'owner_name_added': 'Added owner name',
      'owner_email_added': 'Added owner email',
      'note_added': 'Added note',
      'template_saved': 'Saved template',
      'unsuccessful_call_marked': 'Marked unsuccessful call'
    };
    return actionMap[action] || action;
  };

  if (viewingSessionId) {
    const session = sessions.find(s => s.id === viewingSessionId);
    if (!session) return <div>Session not found</div>;

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
              <p className="text-gray-600">
                {session.user_name} - {new Date(session.start_time).toLocaleDateString()} {' '}
                {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {session.end_time && ` - ${new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                {' '}({formatDuration(session.start_time, session.end_time)})
              </p>
            </div>
            <button
              onClick={() => setViewingSessionId(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              ← Back to Sessions
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{session.leads_processed}</div>
                <div className="text-sm text-gray-600">Leads Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{session.calls_made}</div>
                <div className="text-sm text-gray-600">Calls Made</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{session.contacts_made}</div>
                <div className="text-sm text-gray-600">Successful Calls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{session.voicemails_left}</div>
                <div className="text-sm text-gray-600">Voicemails Left</div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-4">Activity Timeline</h3>
            <div className="space-y-3">
              {selectedSessionActivities.map((activity) => (
                <div key={activity.id} className="border-l-4 border-gray-300 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {getActivityDisplayName(activity.action)}
                      </div>
                      {activity.company_name && (
                        <div className="text-sm text-gray-600">
                          Company: {activity.company_name}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(activity.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {selectedSessionActivities.length === 0 && (
                <div className="text-gray-500 text-center py-8">
                  No activities recorded for this session
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Cold Call Sessions</h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="Nick">Nick</option>
              <option value="Jared">Jared</option>
            </select>
          </div>
        </div>

        {/* Start Session Button */}
        {!activeSession && (
          <div className="mb-6">
            <button
              onClick={startSession}
              disabled={isStarting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
            >
              {isStarting ? 'Starting...' : 'Start New Session'}
            </button>
          </div>
        )}

        {/* Active Session */}
        {activeSession && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">Active Session</h3>
                <p className="text-green-700">
                  Started: {new Date(activeSession.start_time).toLocaleTimeString()} | 
                  Duration: {formatDuration(activeSession.start_time)} | 
                  Leads: {activeSession.leads_processed}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = '/admin/pipeline'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Go to Pipeline
                </button>
                <button
                  onClick={endSession}
                  disabled={isEnding}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm"
                >
                  {isEnding ? 'Ending...' : 'End Session'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Sessions - {selectedUser}
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {sessions.filter(s => s.user_name === selectedUser).map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {new Date(session.start_time).toLocaleDateString()} - {' '}
                        {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {session.end_time && ` to ${new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        {' '}({formatDuration(session.start_time, session.end_time)})
                        {!session.end_time && ' - ACTIVE'}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {session.leads_processed} leads processed | {session.calls_made} calls | {session.contacts_made} contacts made
                      </div>
                    </div>
                    <button
                      onClick={() => viewSessionDetails(session.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
              {sessions.filter(s => s.user_name === selectedUser).length === 0 && (
                <div className="text-gray-500 text-center py-8">
                  No sessions found for {selectedUser}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}