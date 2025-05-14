import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/dashboard/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { 
  Phone, 
  Mail, 
  Clock, 
  Search, 
  Send,
  MessageSquare,
  User,
  Filter,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';

// Types for the messages page
interface Message {
  id: string;
  company_id: string;
  contact_id: string;
  contact_name: string;
  direction: 'inbound' | 'outbound';
  body: string;
  service_type: string;
  timestamp: string;
  status: 'new' | 'read' | 'replied';
}

// Helper function to format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  // If it's today, just show the time
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  
  // If it's yesterday, show "Yesterday at TIME"
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  // If it's within the last 7 days, show day of week and time
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  if (date > lastWeek) {
    return date.toLocaleDateString('en-US', { weekday: 'short' }) + 
      ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  
  // Otherwise, show the full date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
    ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mocked data for demonstration - this would be replaced with an API call
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      const mockMessages: Message[] = [
        {
          id: '1',
          company_id: 'C1',
          contact_id: '1',
          contact_name: 'John Smith',
          direction: 'inbound',
          body: 'My AC is not cooling properly. The house gets very warm in the afternoon. Can someone come take a look this week?',
          service_type: 'AC Repair',
          timestamp: '2025-05-14T16:30:00',
          status: 'new'
        },
        {
          id: '2',
          company_id: 'C1',
          contact_id: '2',
          contact_name: 'Sarah Johnson',
          direction: 'inbound',
          body: 'I need to schedule my annual furnace maintenance. When is the next available appointment?',
          service_type: 'Furnace Maintenance',
          timestamp: '2025-05-14T14:15:00',
          status: 'read'
        },
        {
          id: '3',
          company_id: 'C1',
          contact_id: '3',
          contact_name: 'David Wilson',
          direction: 'inbound',
          body: 'EMERGENCY! My water heater is leaking all over the basement floor. I need someone immediately!',
          service_type: 'Water Heater Repair',
          timestamp: '2025-05-14T09:45:00',
          status: 'replied'
        },
        {
          id: '4',
          company_id: 'C1',
          contact_id: '3',
          contact_name: 'David Wilson',
          direction: 'outbound',
          body: 'We have dispatched our emergency technician Mike. He will be at your location within the hour. Please turn off the water supply to the heater if possible.',
          service_type: 'Water Heater Repair',
          timestamp: '2025-05-14T10:05:00',
          status: 'read'
        },
        {
          id: '5',
          company_id: 'C1',
          contact_id: '4',
          contact_name: 'Emily Davis',
          direction: 'inbound',
          body: 'Just following up on our conversation about replacing the air filters. Do I need to be home for this service?',
          service_type: 'Maintenance',
          timestamp: '2025-05-13T15:30:00',
          status: 'replied'
        },
        {
          id: '6',
          company_id: 'C1',
          contact_id: '4',
          contact_name: 'Emily Davis',
          direction: 'outbound',
          body: 'You don\'t need to be home as long as we have access to the system. If your HVAC is in a locked area, please make arrangements for access. The service takes about 30 minutes.',
          service_type: 'Maintenance',
          timestamp: '2025-05-13T16:10:00',
          status: 'read'
        },
        {
          id: '7',
          company_id: 'C1',
          contact_id: '5',
          contact_name: 'Michael Brown',
          direction: 'inbound',
          body: 'I\'d like to get a quote for a new Nest thermostat installation. Does your company handle these?',
          service_type: 'Installation',
          timestamp: '2025-05-12T11:20:00',
          status: 'replied'
        }
      ];
      
      setMessages(mockMessages);
      setSelectedMessage(mockMessages[0]);
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Handle sending a reply
  const handleSendReply = () => {
    if (!replyText.trim() || !selectedMessage) return;
    
    // Create a new reply message
    const newMessage: Message = {
      id: `reply-${Date.now()}`,
      company_id: selectedMessage.company_id,
      contact_id: selectedMessage.contact_id,
      contact_name: selectedMessage.contact_name,
      direction: 'outbound',
      body: replyText,
      service_type: selectedMessage.service_type,
      timestamp: new Date().toISOString(),
      status: 'read'
    };
    
    // Add to messages and update selected message status
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newMessage];
      return updatedMessages.map(msg => 
        msg.id === selectedMessage.id ? { ...msg, status: 'replied' as const } : msg
      );
    });
    
    // Clear reply text
    setReplyText('');
  };
  
  // Filter messages based on filter setting and search term
  const filteredMessages = messages.filter(message => {
    // First apply status filter
    if (filter === 'new' && message.status !== 'new') return false;
    if (filter === 'unread' && message.status !== 'new' && message.status !== 'read') return false;
    
    // Then apply search term
    if (searchTerm) {
      return (
        message.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.service_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
  });
  
  // Group messages by contact
  const groupedMessages: { [contactId: string]: Message[] } = {};
  filteredMessages.forEach(message => {
    if (!groupedMessages[message.contact_id]) {
      groupedMessages[message.contact_id] = [];
    }
    groupedMessages[message.contact_id].push(message);
  });
  
  // Get the most recent message for each contact
  const contactMessages = Object.values(groupedMessages).map(group => {
    return group.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  });
  
  // Sort contacts by most recent message
  contactMessages.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Get conversation for selected contact
  const selectedConversation = selectedMessage ? 
    messages
      .filter(msg => msg.contact_id === selectedMessage.contact_id)
      .sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ) : 
    [];
  
  return (
    <DashboardLayout title="Messages">
      <Head>
        <title>Messages | HVAC Dashboard</title>
      </Head>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
        {/* Sidebar with message list */}
        <div className="md:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <Button size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  New Message
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent className="flex-grow overflow-auto pb-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : contactMessages.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No messages found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {contactMessages.map(message => (
                    <div 
                      key={message.id}
                      className={`
                        p-3 cursor-pointer rounded-md transition-colors
                        ${selectedMessage?.contact_id === message.contact_id ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      `}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start">
                        <Avatar className="h-9 w-9 mr-3">
                          <div className="bg-blue-100 h-9 w-9 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                            {message.contact_name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </Avatar>
                        
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{message.contact_name}</p>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                          
                          <div className="flex items-center mt-1">
                            <div className="text-xs text-gray-500 truncate flex-grow">
                              {message.direction === 'inbound' ? 
                                message.body : 
                                `You: ${message.body}`}
                            </div>
                            
                            {message.status === 'new' && (
                              <Badge className="ml-1 bg-blue-500">New</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Main content area for conversation */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            {selectedMessage ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <div className="bg-blue-100 h-10 w-10 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                          {selectedMessage.contact_name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center">
                          <CardTitle className="text-base">{selectedMessage.contact_name}</CardTitle>
                          <Badge variant="outline" className="ml-2">
                            {selectedMessage.service_type}
                          </Badge>
                        </div>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          <span className="mr-3">(555) 123-4567</span>
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          <span>
                            {selectedMessage.contact_name.split(' ').join('.').toLowerCase()}@example.com
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-grow overflow-auto space-y-4 p-4">
                  {selectedConversation.map((msg, index) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`
                          max-w-[75%] rounded-lg p-3 shadow-sm
                          ${msg.direction === 'outbound' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-800'
                          }
                        `}
                      >
                        <div className="break-words">{msg.body}</div>
                        <div 
                          className={`
                            text-xs mt-1 flex justify-end items-center
                            ${msg.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'}
                          `}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
                
                <CardFooter className="border-t p-4">
                  <div className="flex w-full space-x-2">
                    <Textarea 
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-grow"
                      rows={2}
                    />
                    <Button 
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="self-end"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                  </div>
                </CardFooter>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg font-medium">No conversation selected</p>
                  <p className="text-gray-500">Select a message from the list to view the conversation</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}