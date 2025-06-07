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
  const [mounted, setMounted] = useState(false);
  
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

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

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
    
    // Default responses
    const defaultResponses = [
      "Thanks for reaching out! We're here to help with all your HVAC needs.",
      "I'd be happy to assist you! Please share your contact info so we can follow up.",
      "Great question! Let me connect you with our team who can provide detailed information.",
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: uuidv4(),
      text: inputMessage.trim(),
      isFromVisitor: true,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsWaitingForResponse(true);
    setShowSuggestions(false);

    try {
      // Send to API
      await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          companyId,
          visitorId,
          conversationId,
          companyName
        })
      });

      // Simple AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: uuidv4(),
          text: getSimpleResponse(userMessage.text),
          isFromVisitor: false,
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsWaitingForResponse(false);
        
        // Show contact form after 2-3 messages
        if (messages.length >= 4) {
          setShowContactForm(true);
        }
      }, 1000 + Math.random() * 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        text: "Sorry, there was an issue. Please try again or call us directly!",
        isFromVisitor: false,
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsWaitingForResponse(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactForm.name.trim()) return;

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

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Chat Bubble */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="group transition-all duration-300 hover:scale-105 focus:outline-none"
            aria-label="Open chat"
          >
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt={`${companyName} logo`}
                className="w-16 h-16 object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 w-auto sm:w-96 h-[85vh] sm:h-[32rem] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
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
              <div className="flex justify-start">
                <div className="flex items-end space-x-2 max-w-[85%]">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-md">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Form */}
            {showContactForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-800 mb-1">Get a Quick Response</h4>
                  <p className="text-sm text-gray-600">Share your details for faster service</p>
                </div>
                <div className="space-y-2">
                  <input
                    ref={nameInputRef}
                    type="text"
                    placeholder="Your name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Your phone number"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowContactForm(false)}
                      className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleContactSubmit}
                      disabled={!contactForm.name.trim()}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-4 border-t border-gray-100 bg-white">
            <div className="flex space-x-2 sm:space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isWaitingForResponse}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isWaitingForResponse}
                className="px-3 py-2 sm:px-4 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}