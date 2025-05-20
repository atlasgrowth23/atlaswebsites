import React, { useState, useEffect } from 'react';

type Message = {
  id: string;
  message: string;
  contact_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  ts: string;
  direction: string;
  service_type: string;
  session_id?: string;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  has_details: boolean;
};

type Session = {
  session_id: string;
  contact: Contact;
  messages: Message[];
  last_message_time: string;
  last_message: string;
};

type PortalMessagesTabProps = {
  slug: string;
};

const PortalMessagesTab: React.FC<PortalMessagesTabProps> = ({ slug }) => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);

  useEffect(() => {
    fetchMessages();
  }, [slug]);

  useEffect(() => {
    if (selectedSession && sessions.length > 0) {
      const session = sessions.find(s => s.session_id === selectedSession);
      if (session) {
        // Sort messages by timestamp (oldest first)
        const sortedMessages = [...session.messages].sort((a, b) => 
          new Date(a.ts).getTime() - new Date(b.ts).getTime()
        );
        setSelectedMessages(sortedMessages);
      }
    } else if (sessions.length > 0) {
      // Default to the first session
      setSelectedSession(sessions[0].session_id);
      const sortedMessages = [...sessions[0].messages].sort((a, b) => 
        new Date(a.ts).getTime() - new Date(b.ts).getTime()
      );
      setSelectedMessages(sortedMessages);
    }
  }, [selectedSession, sessions]);

  // Function to fetch messages
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages/${slug}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.sessions) {
          setSessions(data.sessions);
          setMessages(data.messages || []);
        } else {
          // Handle old format
          setMessages(data);
          // Try to group messages by timestamp proximity to create pseudo-sessions
          groupMessagesByTimestamp(data);
        }
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group messages by timestamp proximity (if we don't have session data)
  const groupMessagesByTimestamp = (messages: Message[]) => {
    const SESSION_TIME_GAP = 30 * 60 * 1000; // 30 minutes in milliseconds
    const groupedSessions: Session[] = [];
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );
    
    let currentSession: Session | null = null;
    
    sortedMessages.forEach(message => {
      const messageTime = new Date(message.ts).getTime();
      
      if (!currentSession || 
          messageTime - new Date(currentSession.last_message_time).getTime() > SESSION_TIME_GAP ||
          (message.contact_name && currentSession.contact.name !== message.contact_name)) {
        // Start a new session
        currentSession = {
          session_id: `session_${messageTime}_${Math.random().toString(36).substring(2, 9)}`,
          contact: {
            id: message.contact_id || '',
            name: message.contact_name || 'Website Visitor',
            email: message.contact_email || '',
            phone: message.contact_phone || '',
            has_details: !!(message.contact_email || message.contact_phone)
          },
          messages: [message],
          last_message_time: message.ts,
          last_message: message.message
        };
        groupedSessions.push(currentSession);
      } else {
        // Add to current session
        currentSession.messages.push(message);
        currentSession.last_message_time = message.ts;
        currentSession.last_message = message.message;
        
        // Update contact info if available
        if (message.contact_name || message.contact_email || message.contact_phone) {
          currentSession.contact = {
            id: message.contact_id || currentSession.contact.id,
            name: message.contact_name || currentSession.contact.name,
            email: message.contact_email || currentSession.contact.email,
            phone: message.contact_phone || currentSession.contact.phone,
            has_details: !!(message.contact_email || message.contact_phone || currentSession.contact.has_details)
          };
        }
      }
    });
    
    // Sort sessions by most recent message
    groupedSessions.sort((a, b) => 
      new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
    );
    
    setSessions(groupedSessions);
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Messages</h1>
        <div>
          <span style={{ 
            backgroundColor: '#10b981', 
            color: 'white', 
            padding: '4px 8px', 
            borderRadius: '9999px',
            fontSize: '0.8rem',
            marginRight: '10px'
          }}>
            Website Leads
          </span>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
        borderRadius: '8px',
        display: 'flex',
        height: '600px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', width: '100%' }}>
            Loading messages...
          </div>
        ) : (
          <>
            {/* Conversations List */}
            <div style={{ 
              width: '300px', 
              borderRight: '1px solid #eee',
              overflowY: 'auto'
            }}>
              {sessions && sessions.length > 0 ? (
                <div>
                  {sessions.map(session => (
                    <div 
                      key={session.session_id}
                      style={{
                        padding: '15px',
                        borderBottom: '1px solid #eee',
                        backgroundColor: selectedSession === session.session_id ? '#f9faff' : 'white',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedSession(session.session_id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <div style={{
                          backgroundColor: session.contact.has_details ? '#e5edff' : '#f0f0f0',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '15px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: session.contact.has_details ? '#1e3a8a' : '#666'
                        }}>
                          {session.contact.name 
                            ? session.contact.name.charAt(0).toUpperCase() 
                            : 'W'}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ 
                            fontWeight: session.contact.has_details ? 'bold' : 'normal',
                            marginBottom: '3px',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ 
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              maxWidth: '150px'
                            }}>
                              {session.contact.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#666',
                            }}>
                              {new Date(session.last_message_time).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: '#666',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}>
                            {session.last_message?.substring(0, 50)}
                            {session.last_message?.length > 50 ? '...' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '30px',
                  color: '#666' 
                }}>
                  No conversations yet.
                </div>
              )}
            </div>
            
            {/* Conversation Detail */}
            <div style={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {selectedSession ? (
                <>
                  {/* Conversation Header */}
                  <div style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    backgroundColor: '#f9faff',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {sessions.find(s => s.session_id === selectedSession)?.contact && (
                      <>
                        <div style={{
                          backgroundColor: '#e5edff',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '15px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#1e3a8a'
                        }}>
                          {sessions.find(s => s.session_id === selectedSession)?.contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {sessions.find(s => s.session_id === selectedSession)?.contact.name}
                          </div>
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: '#666',
                            display: 'flex',
                            gap: '15px'
                          }}>
                            {sessions.find(s => s.session_id === selectedSession)?.contact.email && (
                              <div>
                                <span style={{ marginRight: '5px' }}>📧</span>
                                {sessions.find(s => s.session_id === selectedSession)?.contact.email}
                              </div>
                            )}
                            {sessions.find(s => s.session_id === selectedSession)?.contact.phone && (
                              <div>
                                <span style={{ marginRight: '5px' }}>📱</span>
                                {sessions.find(s => s.session_id === selectedSession)?.contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Messages */}
                  <div style={{ 
                    flex: 1, 
                    padding: '15px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {selectedMessages && selectedMessages.length > 0 ? (
                      selectedMessages.map(message => (
                        <div 
                          key={message.id}
                          style={{
                            padding: '10px 15px',
                            marginBottom: '10px',
                            maxWidth: '80%',
                            borderRadius: '10px',
                            backgroundColor: message.direction === 'out' ? '#e5edff' : '#f0f0f0',
                            alignSelf: message.direction === 'out' ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div style={{ marginBottom: '5px' }}>
                            {message.message}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#666', 
                            textAlign: 'right' 
                          }}>
                            {new Date(message.ts).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '30px',
                        color: '#666' 
                      }}>
                        No messages in this conversation.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '30px',
                  color: '#666' 
                }}>
                  Select a conversation to view messages.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PortalMessagesTab;