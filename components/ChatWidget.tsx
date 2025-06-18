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
  details: string;
  consent: boolean;
}

interface ChatState {
  step: 'welcome' | 'service_selected' | 'collecting_contact' | 'completed';
  selectedService: string | null;
  showContactForm: boolean;
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
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    details: '',
    consent: false
  });
  const [chatState, setChatState] = useState<ChatState>({
    step: 'welcome',
    selectedService: null,
    showContactForm: false
  });
  const [mounted, setMounted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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


  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize chat with welcome message and buttons
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: uuidv4(),
        text: `Hi! Welcome to ${companyName}. Send us a message or choose from the options below:`,
        isFromVisitor: false,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, companyName, messages.length]);

  const handleServiceSelection = (service: string) => {
    const serviceResponses = {
      'Repair': "Got it - repair request! Would you like to share any details, or tap 'Contact Me' and someone will reach out to you shortly.",
      'Install': "Perfect - installation inquiry! Would you like to share any details, or tap 'Contact Me' and someone will reach out to you shortly.", 
      'Tune Up': "Great - maintenance service! Would you like to share any details, or tap 'Contact Me' and someone will reach out to you shortly.",
      'Emergency': "Emergency service needed! Would you like to share any details, or tap 'Contact Me' and we'll get someone to you ASAP."
    };

    const serviceMessage: Message = {
      id: uuidv4(),
      text: service,
      isFromVisitor: true,
      timestamp: new Date(),
      type: 'text'
    };

    const botResponse: Message = {
      id: uuidv4(),
      text: serviceResponses[service as keyof typeof serviceResponses],
      isFromVisitor: false,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, serviceMessage, botResponse]);
    setChatState({
      step: 'service_selected',
      selectedService: service,
      showContactForm: true
    });
  };


  const getContextualResponse = (message: string, currentState: ChatState): { response: string; newState: ChatState } => {
    // If service is selected and user provides details
    if (currentState.step === 'service_selected') {
      return {
        response: "Thanks for the details! Let me get your contact info so we can help you.",
        newState: { ...currentState, showContactForm: true }
      };
    }
    
    // Default response for any other messages
    return {
      response: "Thanks for reaching out! Feel free to use the buttons above or tell me how I can help you.",
      newState: currentState
    };
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

      // Get contextual response based on current state
      const { response, newState } = getContextualResponse(userMessage.text, chatState);
      
      // Update chat state
      setChatState(newState);

      // AI response with delay
      setTimeout(() => {
        const aiResponse: Message = {
          id: uuidv4(),
          text: response,
          isFromVisitor: false,
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsWaitingForResponse(false);
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
          phone: contactForm.phone.trim() || undefined,
          details: contactForm.details.trim() || undefined
        })
      });

      if (response.ok) {
        // Hide contact form and show thank you message
        setChatState(prev => ({ ...prev, showContactForm: false, step: 'completed' }));
        
        const thankYouMessage: Message = {
          id: uuidv4(),
          text: `Thanks ${contactForm.name}! We'll contact you at your preferred method shortly.`,
          isFromVisitor: false,
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, thankYouMessage]);
        
        // Reset form
        setContactForm({ name: '', email: '', phone: '', details: '', consent: false });
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

            {/* Service Buttons - Show only if no service selected and first message */}
            {chatState.step === 'welcome' && messages.length === 1 && (
              <div className="p-4 space-y-3">
                <p className="text-center text-sm text-gray-600 font-medium">What can we help you with?</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Repair', 'Install', 'Tune Up', 'Emergency'].map((service) => (
                    <button
                      key={service}
                      onClick={() => handleServiceSelection(service)}
                      className="px-4 py-3 bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl text-center font-semibold text-gray-800 transition-all duration-200 hover:shadow-md active:scale-95"
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
            )}


            {/* Contact Form */}
            {chatState.showContactForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4 mx-2">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-800 mb-1">Contact Information</h4>
                  <p className="text-sm text-gray-600">We'll reach out to you shortly</p>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <textarea
                    placeholder="Additional details about your request (optional)"
                    value={contactForm.details}
                    onChange={(e) => setContactForm(prev => ({ ...prev, details: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                  
                  <label className="flex items-start space-x-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={contactForm.consent}
                      onChange={(e) => setContactForm(prev => ({ ...prev, consent: e.target.checked }))}
                      className="mt-0.5 text-blue-600"
                    />
                    <span>I consent to receive messages about my service request</span>
                  </label>
                  
                  <button
                    onClick={handleContactSubmit}
                    disabled={
                      !contactForm.name.trim() || 
                      (!contactForm.phone.trim() && !contactForm.email.trim()) ||
                      !contactForm.consent
                    }
                    className="w-full px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Only show after service selected */}
          {chatState.step !== 'welcome' && (
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
          )}

          {/* Welcome State Message */}
          {chatState.step === 'welcome' && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">👆 Please select an option above to get started</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}