import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  MessageSquare,
  X,
  Send,
  CheckCircle
} from 'lucide-react';

interface ChatWidgetProps {
  companySlug: string;
  companyName?: string;
  primaryColor?: string;
  accentColor?: string;
}

type WidgetState = 'closed' | 'open' | 'minimized' | 'success';

export default function ChatWidget({
  companySlug,
  companyName = 'HVAC Company',
  primaryColor = '#0066FF',
  accentColor = '#F6AD55'
}: ChatWidgetProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>('closed');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    serviceType: 'repair'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toggle widget visibility
  const toggleWidget = () => {
    if (widgetState === 'closed') {
      setWidgetState('open');
    } else if (widgetState === 'open') {
      setWidgetState('closed');
    } else if (widgetState === 'minimized') {
      setWidgetState('open');
    }
  };
  
  // Minimize the widget
  const minimizeWidget = () => {
    setWidgetState('minimized');
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Send data to API
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          companySlug,
          leadType: 'widget',
          timestamp: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      
      // Show success message
      setWidgetState('success');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        serviceType: 'repair'
      });
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ form: 'Failed to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset to closed state
  const closeWidget = () => {
    setWidgetState('closed');
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Main Widget */}
      {widgetState === 'open' && (
        <div className="bg-white rounded-lg shadow-lg mb-4 w-full max-w-sm overflow-hidden transition-all duration-300 ease-in-out">
          {/* Header */}
          <div 
            className="p-4 text-white flex justify-between items-center"
            style={{ backgroundColor: primaryColor }}
          >
            <h3 className="font-semibold">{companyName} Support</h3>
            <div className="flex space-x-2">
              <button 
                onClick={minimizeWidget}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button 
                onClick={closeWidget}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Name Field */}
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
                
                {/* Email Field */}
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                
                {/* Phone Field */}
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
                
                {/* Service Type Field */}
                <div>
                  <Label htmlFor="serviceType">Service Type</Label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="repair">Repair</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="installation">Installation</option>
                    <option value="emergency">Emergency Service</option>
                    <option value="quote">Request Quote</option>
                  </select>
                </div>
                
                {/* Message Field */}
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className={errors.message ? 'border-red-500' : ''}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1">{errors.message}</p>
                  )}
                </div>
                
                {/* Form Error */}
                {errors.form && (
                  <div className="bg-red-50 text-red-600 p-2 rounded-md text-sm">
                    {errors.form}
                  </div>
                )}
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {widgetState === 'success' && (
        <div className="bg-white rounded-lg shadow-lg mb-4 w-full max-w-sm overflow-hidden transition-all duration-300 ease-in-out">
          <div 
            className="p-4 text-white flex justify-between items-center"
            style={{ backgroundColor: primaryColor }}
          >
            <h3 className="font-semibold">Message Sent</h3>
            <button 
              onClick={closeWidget}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="text-lg font-medium mb-2">Thank You!</h4>
            <p className="text-gray-600 mb-4">
              Your message has been sent successfully. We'll get back to you as soon as possible.
            </p>
            <Button
              onClick={closeWidget}
              style={{ backgroundColor: primaryColor }}
            >
              Close
            </Button>
          </div>
        </div>
      )}
      
      {/* Minimized Widget */}
      {widgetState === 'minimized' && (
        <div 
          className="bg-white rounded-lg shadow-lg mb-4 p-3 cursor-pointer transition-all duration-300 ease-in-out"
          onClick={() => setWidgetState('open')}
        >
          <div className="flex items-center space-x-2">
            <div 
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: primaryColor }}
            ></div>
            <span className="text-sm font-medium">{companyName} Support</span>
          </div>
        </div>
      )}
      
      {/* Toggle Button */}
      <button
        onClick={toggleWidget}
        className="rounded-full shadow-lg p-4 text-white transition-transform duration-300 ease-in-out hover:scale-110 focus:outline-none"
        style={{ backgroundColor: primaryColor }}
      >
        {widgetState === 'closed' ? (
          <MessageSquare className="h-6 w-6" />
        ) : (
          <X className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}