import React, { useState, useEffect, useRef } from 'react';

interface WidgetProps {
  companySlug: string;
  primaryColor: string;
  accentColor: string;
}

const Widget: React.FC<WidgetProps> = ({ companySlug, primaryColor, accentColor }) => {
  // State for widget
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'options'|'form'>("options");
  const [service, setService] = useState<string|null>(null);
  const [msg, setMsg] = useState("");
  const [cssVarsApplied, setCssVarsApplied] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Refs for focus trap
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Apply CSS variables dynamically
  useEffect(() => {
    const applyColorVariables = () => {
      const root = document.documentElement;
      
      // Set color variables
      root.style.setProperty('--color-primary', primaryColor);
      root.style.setProperty('--color-accent', accentColor);
      
      setCssVarsApplied(true);
    };
    
    applyColorVariables();
  }, [primaryColor, accentColor]);
  
  // Handle Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closePanel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  // Handle focus trap
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    
    // Focus first input when form opens
    if (step === 'form') {
      const firstInput = panelRef.current.querySelector('input') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }
  }, [isOpen, step]);
  
  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset state when reopening
      setStep('options');
      if (!submitted) {
        setService(null);
        setMsg("");
      }
    }
  };
  
  const closePanel = () => {
    setIsOpen(false);
  };
  
  const handleServiceSelect = (serviceType: string) => {
    setService(serviceType);
    setStep('form');
  };
  
  const handleCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (msg.trim()) {
      setService(null); // Custom message doesn't have a specific service
      setStep('form');
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          companySlug, 
          name, 
          phone, 
          email, 
          street,
          service, 
          initialMessage: msg 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      
      // Reset form and show success
      setSubmitted(true);
      setIsOpen(false);
      
      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-20 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
      toast.textContent = "Thanks, we'll confirm soon.";
      document.body.appendChild(toast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset state after successful submission for next use
  const resetWidget = () => {
    setSubmitted(false);
    setName("");
    setEmail("");
    setPhone("");
    setStreet("");
    setService(null);
    setMsg("");
    setStep('options');
  };
  
  if (!cssVarsApplied) {
    return null; // Don't render until CSS vars are applied
  }
  
  return (
    <div className="widget-container">
      {/* Bubble Button - Fixed bottom-right */}
      <button
        onClick={toggleWidget}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center cursor-pointer z-50"
        style={{ backgroundColor: primaryColor }}
        aria-label="Open help widget"
      >
        {isOpen ? <span className="text-xl">&times;</span> : <span className="text-xl">?</span>}
      </button>
      
      {/* Panel */}
      {isOpen && (
        <div 
          ref={panelRef}
          className="fixed bottom-20 right-4 max-w-[22rem] w-full bg-white border rounded-lg shadow-xl p-4 z-50"
          style={{ borderTopColor: primaryColor, borderTopWidth: '3px' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-800">
              {step === 'options' ? 'How can we help you?' : 'Contact Information'}
            </h3>
            <button 
              onClick={closePanel}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close panel"
            >
              &times;
            </button>
          </div>
          
          {/* Content based on current step */}
          {step === 'options' ? (
            <>
              {/* Service Options */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { id: 'repair', label: 'Repair', icon: '🔧' },
                  { id: 'install', label: 'Install', icon: '🏠' },
                  { id: 'maintain', label: 'Maintenance', icon: '🔍' },
                  { id: 'quote', label: 'Free Quote', icon: '📋' }
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => handleServiceSelect(btn.id)}
                    className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-gray-50"
                    style={{ borderColor: primaryColor }}
                  >
                    <span className="text-2xl mb-1">{btn.icon}</span>
                    <span className="font-medium text-sm" style={{ color: primaryColor }}>
                      {btn.label}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Other (Free text) */}
              <form onSubmit={handleCustomMessage} className="mt-4">
                <label htmlFor="custom-message" className="block text-sm font-medium text-gray-700 mb-1">
                  Or tell us what you need:
                </label>
                <textarea
                  id="custom-message"
                  ref={textareaRef}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none"
                  rows={2}
                  placeholder="Type your message here..."
                  style={{ borderColor: primaryColor }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && msg.trim()) {
                      e.preventDefault();
                      handleCustomMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit"
                  disabled={!msg.trim()}
                  className="mt-2 px-4 py-2 rounded text-white w-full disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  Continue
                </button>
              </form>
            </>
          ) : (
            /* Contact Form */
            <form onSubmit={handleFormSubmit}>
              {service && (
                <div className="mb-3 py-2 px-3 bg-gray-50 rounded-md text-sm">
                  <strong>Service:</strong> {service.charAt(0).toUpperCase() + service.slice(1)}
                </div>
              )}
              
              {msg && (
                <div className="mb-3 py-2 px-3 bg-gray-50 rounded-md text-sm">
                  <strong>Message:</strong> {msg}
                </div>
              )}
              
              <div className="mb-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none"
                  style={{ borderColor: primaryColor }}
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none"
                  style={{ borderColor: primaryColor }}
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none"
                  style={{ borderColor: primaryColor }}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  id="street"
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none"
                  style={{ borderColor: primaryColor }}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('options')}
                  className="px-4 py-2 border rounded text-gray-600 flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded text-white flex-1"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Widget;