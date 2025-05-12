import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Lightbulb, Calendar, Star, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';

interface ChatWidgetProps {
  company: Company;
}

// Quick response options
const QUICK_RESPONSES = [
  { id: 'service', text: 'Schedule a service', icon: <Calendar size={16} className="mr-2" /> },
  { id: 'quote', text: 'Request a quote', icon: <Star size={16} className="mr-2" /> },
  { id: 'emergency', text: 'Emergency service', icon: <AlertTriangle size={16} className="mr-2" /> },
  { id: 'hours', text: 'Business hours', icon: <Clock size={16} className="mr-2" /> },
];

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

export default function ChatWidget({ company }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    companyId: company.id || '',
    companySlug: company.slug || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  
  // Set company colors based on company settings or defaults
  const primaryColor = company.primary_color || '#2563eb';
  const secondaryColor = company.secondary_color || '#1e40af';
  
  // Add a system welcome message when chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content: `Welcome to ${company.name}! How can we help you today?`,
          sender: 'system',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, company.name, messages.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle AI chat message
  const handleChatMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setAiThinking(true);
    
    try {
      // Get company identifier for API call
      const companyIdentifier = company.slug 
        ? { companySlug: company.slug } 
        : { companyId: company.id };
      
      // Get AI response
      const response = await fetch('/api/ai-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          ...companyIdentifier
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: data.response || "I'm sorry, I couldn't process that request.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error getting AI response:', err);
      
      // Add fallback message
      const fallbackMessage: Message = {
        id: `system-${Date.now()}`,
        content: "I'm sorry, I'm having trouble connecting to our system. Would you like to leave your contact information for one of our representatives to reach out?",
        sender: 'system',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setAiThinking(false);
    }
  };

  // Handle quick response selection
  const handleQuickResponse = (responseId: string) => {
    let message = '';
    
    switch(responseId) {
      case 'service':
        message = "I'd like to schedule a service appointment";
        break;
      case 'quote':
        message = "I'm interested in getting a quote for a new system";
        break;
      case 'emergency':
        message = "I need emergency HVAC service";
        break;
      case 'hours':
        message = "What are your business hours?";
        break;
      default:
        message = "I need assistance with my HVAC system";
    }
    
    handleChatMessage(message);
  };

  // Handle contact form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Determine what company identifier we have
      let payload = {
        ...formData
      };

      // If we have an ID that's a number
      if (company.id && typeof company.id === 'number') {
        payload.companyId = company.id;
      } 
      // If we have a slug, use that
      else if (company.slug) {
        payload.companySlug = company.slug;
      } 
      // If ID is a string (likely a slug)
      else if (company.id) {
        payload.companyId = company.id;
      }

      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      
      // Show success message
      const successMessage: Message = {
        id: `system-${Date.now()}`,
        content: `Thanks, ${formData.name}! Your message has been sent to our team. We'll contact you shortly.`,
        sender: 'system',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, successMessage]);
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        companyId: company.id || '',
        companySlug: company.slug || '',
      });
      
      // Hide the contact form
      setShowContactForm(false);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert chat timestamp to readable format
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Function to handle sending a chat message
  const [inputMessage, setInputMessage] = useState('');
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleChatMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-50"
        style={{ backgroundColor: primaryColor }}
        aria-label="Open chat"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat dialog */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-end p-4 md:p-6 pointer-events-none ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } transition-opacity duration-300`}
      >
        <div
          className={`bg-white rounded-lg shadow-xl w-full max-w-md pointer-events-auto transform transition-transform duration-300 ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Chat header */}
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ backgroundColor: primaryColor, borderColor: secondaryColor }}
          >
            <h3 className="text-lg font-semibold text-white flex items-center">
              <MessageSquare size={20} className="mr-2" />
              Chat with {company.name}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4" style={{ height: '350px' }}>
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.sender === 'user' 
                          ? 'bg-blue-100 text-blue-900' 
                          : msg.sender === 'assistant'
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-yellow-50 text-gray-800 border border-yellow-200'
                      }`}
                    >
                      <div className="text-sm">{msg.content}</div>
                      <div className="text-[10px] opacity-70 mt-1 text-right">
                        {formatTimestamp(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                {aiThinking && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-75"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                        <span className="text-xs text-gray-500 ml-1">Typing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between">
                <div className="text-center py-8">
                  <Lightbulb className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">How can we help?</h3>
                  <p className="text-sm text-gray-500">
                    Chat with our virtual assistant or leave a message for our team.
                  </p>
                </div>
              
                {/* Quick response options */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {QUICK_RESPONSES.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleQuickResponse(option.id)}
                      className="flex items-center justify-center px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md border border-gray-200"
                    >
                      {option.icon}
                      <span>{option.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area or contact form */}
          <div className="border-t p-4">
            {showContactForm && submitSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
                <h4 className="text-green-800 font-medium mb-1">Message Sent!</h4>
                <p className="text-green-700 text-sm">
                  Thanks for reaching out. {company.name} will contact you shortly.
                </p>
              </div>
            ) : showContactForm ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Your email *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={2}
                    placeholder="Your message *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  ></textarea>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 text-white font-medium rounded-md shadow-sm transition-colors duration-200 flex justify-center text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 underline py-1"
                >
                  Back to chat
                </button>
              </form>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || aiThinking}
                  className="p-2 rounded-md text-white flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send size={20} />
                </button>
              </form>
            )}
            
            {!showContactForm && messages.length > 0 && (
              <button 
                onClick={() => setShowContactForm(true)}
                className="w-full mt-3 text-xs text-center text-gray-500 hover:text-gray-700 py-1"
              >
                Need to leave your contact info? Click here
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}