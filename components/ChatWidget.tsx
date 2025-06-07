import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  text: string;
  isFromVisitor: boolean;
  timestamp: Date;
  type?: 'text' | 'system' | 'contact_form';
}

interface ContactForm {
  name: string;
  email: string;
  phone: string;
}

interface ChatWidgetProps {
  companyId: string;
  companyName: string;
  companyHours?: any;
  companyLocation?: { latitude?: number; longitude?: number };
  companyLogo?: string;
}

export default function ChatWidget({ 
  companyId, 
  companyName, 
  companyHours, 
  companyLocation,
  companyLogo 
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [visitorId] = useState(() => uuidv4());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    phone: ''
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Focus name input when contact form shows
  useEffect(() => {
    if (showContactForm) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showContactForm]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: uuidv4(),
        text: `Hi! Welcome to ${companyName}. How can we help you today?`,
        isFromVisitor: false,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, companyName, messages.length]);

  const getSimpleResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Quote/estimate requests
    if (lowerMessage.includes('quote') || lowerMessage.includes('estimate') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return "Great! We'd love to help with a quote. Share your details below and we'll get back to you quickly!";
    }
    
    // Service requests
    if (lowerMessage.includes('service') || lowerMessage.includes('repair') || lowerMessage.includes('fix') || lowerMessage.includes('hvac') || lowerMessage.includes('heating') || lowerMessage.includes('cooling')) {
      return "We can definitely help with that! Please share your contact information and we'll reach out to schedule a service call.";
    }
    
    // Emergency requests
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('broken') || lowerMessage.includes('not working')) {
      return "We understand this is urgent! Please provide your contact details and we'll get someone to help you right away.";
    }
    
    // Contact info requests
    if (lowerMessage.includes('phone') || lowerMessage.includes('call') || lowerMessage.includes('contact')) {
      return "You can reach us at our main number, or share your details below and we'll call you back!";
    }
    
    // General greeting/questions
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return "Hello! We're here to help with all your HVAC needs. What can we assist you with today?";
    }
    
    // Default response
    return "Thanks for reaching out! We'd love to help you. Please share your contact information below so we can follow up with you.";
  };

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    sendMessageWithText(suggestion);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isWaitingForResponse) return;
    setShowSuggestions(false);
    sendMessageWithText(inputMessage.trim());
  };

  const sendMessageWithText = async (messageText: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      text: messageText,
      isFromVisitor: true,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsWaitingForResponse(true);

    try {
      // Get simple response
      const responseText = getSimpleResponse(messageText);
      
      // Add AI response
      const aiResponse: Message = {
        id: uuidv4(),
        text: responseText,
        isFromVisitor: false,
        timestamp: new Date(),
        type: 'text'
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, aiResponse]);
        
        // Show contact form after response
        setTimeout(() => {
          setShowContactForm(true);
        }, 1000);
        
        setIsWaitingForResponse(false);
      }, 800);

      // Send to API for logging
      await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          companyId,
          visitorId,
          conversationId,
          companyName,
          response: responseText
        })
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        text: "Sorry, I'm having trouble responding right now. Please try again or call us directly.",
        isFromVisitor: false,
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsWaitingForResponse(false);
    }
  };

  const submitContactForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name.trim()) {
      nameInputRef.current?.focus();
      return;
    }

    try {
      // Create contact record
      const response = await fetch('/api/chat/create-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          visitorId,
          conversationId,
          name: contactForm.name.trim(),
          email: contactForm.email.trim() || undefined,
          phone: contactForm.phone.trim() || undefined
        })
      });

      if (response.ok) {
        setShowContactForm(false);
        
        // Thank you message
        const thankYou: Message = {
          id: uuidv4(),
          text: `Thanks ${contactForm.name}! We have your contact info and will follow up with you soon. Feel free to ask any other questions!`,
          isFromVisitor: false,
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, thankYou]);
        
        // Reset form
        setContactForm({ name: '', email: '', phone: '' });
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Bubble */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative w-16 h-16 bg-white hover:bg-gray-50 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 border-2 border-gray-200 hover:border-blue-300"
            aria-label="Open chat"
          >
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt={`${companyName} logo`}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <svg className="w-7 h-7 text-blue-600 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-30"></div>
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">!</span>
            </div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                {companyLogo ? (
                  <img 
                    src={companyLogo} 
                    alt={`${companyName} logo`}
                    className="w-9 h-9 object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-base">{companyName}</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs opacity-90">Online • Fast Response Guaranteed</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.isFromVisitor ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`flex ${message.isFromVisitor ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[85%]`}>
                  {!message.isFromVisitor && (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      message.isFromVisitor
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                        : message.type === 'system'
                        ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200 rounded-bl-md'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <div className={`text-xs mt-2 ${
                      message.isFromVisitor ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isWaitingForResponse && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-end space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md text-sm border border-gray-200 shadow-sm">
                    <div className="flex space-x-1 items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-gray-500 text-xs ml-2">Typing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Form */}
            {showContactForm && (
              <div className="animate-in slide-in-from-bottom-2 duration-300 mx-2">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold text-blue-900">Get Expert Service Today!</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">We'll contact you within minutes to help with your HVAC needs.</p>
                  
                  <form onSubmit={submitContactForm} className="space-y-4">
                    <div className="relative">
                      <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="Your full name *"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm placeholder-gray-400 transition-all duration-200"
                        required
                      />
                      <div className="absolute right-3 top-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="Email address"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm placeholder-gray-400 transition-all duration-200"
                      />
                      <div className="absolute right-3 top-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm placeholder-gray-400 transition-all duration-200"
                      />
                      <div className="absolute right-3 top-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-3 focus:ring-blue-500 shadow-lg hover:shadow-xl"
                    >
                      Get Expert Help Now →
                    </button>
                  </form>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    🔒 Your information is secure and will never be shared
                  </p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input - only show if contact form is not showing */}
          {!showContactForm && (
            <div className="border-t border-gray-100 bg-white p-5">
              {/* Quick Suggestions */}
              {showSuggestions && messages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Quick options:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSuggestionClick("I need pricing information")}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                    >
                      💰 Pricing
                    </button>
                    <button
                      onClick={() => handleSuggestionClick("I need service or repair")}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
                    >
                      🔧 Service
                    </button>
                    <button
                      onClick={() => handleSuggestionClick("I'd like to schedule an appointment")}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                    >
                      📅 Schedule
                    </button>
                    <button
                      onClick={() => handleSuggestionClick("I have an emergency")}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-colors"
                    >
                      🚨 Emergency
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message or use quick options above..."
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 placeholder-gray-500 transition-all duration-200 resize-none"
                    disabled={isWaitingForResponse}
                  />
                  <div className="absolute right-3 top-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isWaitingForResponse}
                  className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-3 focus:ring-blue-500 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  {isWaitingForResponse ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-center mt-3">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Quick response</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>Trusted service</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}