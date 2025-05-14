import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, Lightbulb, Calendar, Star, AlertTriangle, Clock, UserPlus } from 'lucide-react';
import { Company } from '@/types';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

interface ChatWidgetProps {
  company: Company;
}

// Service options with descriptions
const SERVICE_OPTIONS = [
  { 
    id: 'service', 
    text: 'Schedule Service', 
    icon: <Calendar size={18} className="mr-2" />,
    description: 'Book a regular maintenance or service appointment'
  },
  { 
    id: 'quote', 
    text: 'Get a Quote', 
    icon: <Star size={18} className="mr-2" />,
    description: 'Request pricing for repairs or new installations'
  },
  { 
    id: 'emergency', 
    text: 'Emergency Service', 
    icon: <AlertTriangle size={18} className="mr-2" />,
    description: 'Immediate help for urgent HVAC problems'
  },
  { 
    id: 'hours', 
    text: 'Business Hours', 
    icon: <Clock size={18} className="mr-2" />,
    description: 'Check our availability and operating hours'
  },
];

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

export default function ChatWidget({ company }: ChatWidgetProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    type: 'residential', // Required field for contact creation
    notes: '', // Use this for the message content from the form
    companyId: company.id || '',
    companySlug: company.slug || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [promptedForContact, setPromptedForContact] = useState(false);
  
  // Company colors
  const primaryColor = company.primary_color || '#2563eb';
  const secondaryColor = company.secondary_color || '#1e40af';
  
  // Chat container ref for scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-open chat after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3000); // 3 seconds
    
    return () => clearTimeout(timer);
  }, []);

  // Add welcome message when chat opens
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

  // Prompt for contact info after first AI response
  useEffect(() => {
    // After first AI message (when we have 3 messages total: welcome, user, AI), prompt for contact
    if (messages.length === 3 && !promptedForContact) {
      setPromptedForContact(true);
      // Show contact form immediately after first exchange
      setTimeout(() => {
        setShowContactForm(true);
      }, 500);
    }
  }, [messages.length, promptedForContact]);

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Format chat timestamp
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle address selection from Google Places
  const handleAddressSelected = (address: string, city: string, state: string, zip: string) => {
    setFormData(prev => ({
      ...prev,
      address,
      city,
      state,
      zip
    }));
  };

  // Handle service option selection
  const handleServiceOption = (optionId: string) => {
    let message = '';
    
    switch(optionId) {
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
    
    // Increment message count when user sends a message
    setMessageCount(prev => prev + 1);
    
    try {
      // Get company identifier for API
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

  // Handle sending a chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleChatMessage(inputMessage);
      setInputMessage('');
    }
  };

  // Handle contact form submission to create a new contact
  const createNewContact = async () => {
    try {
      // Normalize contact information
      const contactPayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        type: formData.type, // Include the required type field
        notes: formData.notes || "Contact created from chat widget", // Default notes if none provided
        companyId: company.id,
        companySlug: company.slug,
      };

      // Create the contact in the database
      const contactResponse = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactPayload),
      });

      if (!contactResponse.ok) {
        const errorData = await contactResponse.json();
        throw new Error(errorData.message || 'Failed to create contact');
      }

      // Successfully created the contact
      return true;
    } catch (err) {
      console.error('Error creating contact:', err);
      return false;
    }
  };

  // Handle contact form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // First, create a new contact in the database
      const contactCreated = await createNewContact();
      
      if (!contactCreated) {
        throw new Error("Failed to create contact record");
      }
      
      // Prepare message payload (use notes field as message content)
      const messagePayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        message: formData.notes || "Contact request from website",
        companyId: company.id || '',
        companySlug: company.slug || '',
      };

      // Then send a message notification
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      // Show success message
      const successMessage: Message = {
        id: `system-${Date.now()}`,
        content: `Thanks, ${formData.name}! We've received your information and will contact you shortly.`,
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
        address: '',
        city: '',
        state: '',
        zip: '',
        type: 'residential', // Include type field
        notes: '',
        companyId: company.id || '',
        companySlug: company.slug || '',
      });
      
      // Hide the contact form and return to chat
      setTimeout(() => {
        setShowContactForm(false);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error processing form:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
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

          {/* Messages area with optional contact form */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4" 
            style={{ height: showContactForm ? '500px' : '350px' }}>
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
                
                {/* Show typing indicator */}
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
                
                {/* Contact form inside chat stream */}
                {showContactForm && (
                  <div className="flex justify-start w-full">
                    <div className="w-full max-w-[95%] bg-white rounded-lg border border-blue-200 shadow-md p-4" style={{ borderColor: primaryColor }}>
                      {submitSuccess ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
                          <h4 className="text-green-800 font-medium mb-1">Information Received!</h4>
                          <p className="text-green-700 text-sm">
                            Thanks for reaching out. {company.name} will contact you shortly.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-3">
                            <h3 className="text-base font-semibold" style={{ color: primaryColor }}>
                              Please provide your contact information
                            </h3>
                          </div>
                          
                          <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="relative">
                              <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">Your Name*</label>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 pt-3 pb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div className="relative">
                              <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">Your Email*</label>
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-3 pt-3 pb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div className="relative">
                              <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">Phone Number</label>
                              <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-3 pt-3 pb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            <div className="relative">
                              <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">Address</label>
                              <GooglePlacesAutocomplete
                                onAddressSelected={handleAddressSelected}
                                placeholder="Start typing your address"
                                className="w-full px-3 pt-3 pb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              />
                            </div>

                            {formData.address && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                  <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">City</label>
                                  <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-3 pt-3 pb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 text-sm"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="relative">
                                    <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">State</label>
                                    <input
                                      type="text"
                                      id="state"
                                      name="state"
                                      value={formData.state}
                                      onChange={handleChange}
                                      className="w-full px-3 pt-3 pb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 text-sm"
                                    />
                                  </div>
                                  <div className="relative">
                                    <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">ZIP</label>
                                    <input
                                      type="text"
                                      id="zip"
                                      name="zip"
                                      value={formData.zip}
                                      onChange={handleChange}
                                      className="w-full px-3 pt-3 pb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {error && (
                              <div className="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-800">
                                {error}
                              </div>
                            )}

                            <div className="flex space-x-2 pt-1">
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-2 text-white text-sm font-medium rounded-md shadow-sm transition-all duration-200 flex justify-center items-center"
                                style={{ backgroundColor: primaryColor }}
                              >
                                {isSubmitting ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                  </>
                                ) : (
                                  <>Submit</>
                                )}
                              </button>
                              
                              <button 
                                type="button"
                                onClick={() => setShowContactForm(false)}
                                className="px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between">
                <div className="text-center py-5">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lightbulb className="h-9 w-9" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-1">How can we help you today?</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Select an option below or type your question
                  </p>
                </div>
              
                {/* Service options */}
                <div className="flex flex-col space-y-3 mt-2">
                  {SERVICE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleServiceOption(option.id)}
                      className="w-full flex flex-col items-start px-4 py-3 rounded-md transition-all duration-200 hover:shadow-md"
                      style={{ 
                        backgroundColor: `${primaryColor}10`, 
                        borderLeft: `4px solid ${primaryColor}` 
                      }}
                    >
                      <div className="flex items-center font-medium text-gray-800 mb-1">
                        {option.icon}
                        <span>{option.text}</span>
                      </div>
                      <p className="text-xs text-gray-500 pl-7">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Input area - only show when not displaying contact form */}
          {!showContactForm && (
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your question here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || aiThinking}
                  className="p-3 rounded-md text-white flex-shrink-0 transition-all duration-200 shadow-md hover:shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send size={22} />
                </button>
              </form>
              
              {/* Link to contact form */}
              {!promptedForContact && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button 
                    onClick={() => setShowContactForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-colors duration-200"
                    style={{ color: primaryColor }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Leave your contact information
                  </button>
                </div>
              )}
            </div>
          )}
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