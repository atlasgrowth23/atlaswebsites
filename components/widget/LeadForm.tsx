import React, { useState } from 'react';

interface LeadFormProps {
  companySlug: string;
  buttonType: string;
  onBack: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ companySlug, buttonType, onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFormTitle = () => {
    switch (buttonType) {
      case 'service':
        return 'Schedule a Service';
      case 'quote':
        return 'Request a Free Quote';
      case 'emergency':
        return 'Emergency Service';
      case 'question':
        return 'Ask a Question';
      default:
        return 'Contact Us';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          companySlug,
          leadType: buttonType,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setSubmitted(true);
    } catch (err) {
      setError('There was an error submitting your request. Please try again later.');
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-bold text-lg mb-2">Thank You!</h3>
        <p className="text-gray-600 mb-4">
          Your request has been submitted. We'll be in touch shortly.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-md text-white font-medium"
          style={{ backgroundColor: 'var(--widget-primary)' }}
        >
          Back to Options
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <button 
          onClick={onBack}
          className="mr-2 text-gray-500 hover:text-gray-700"
        >
          ←
        </button>
        <h3 className="font-bold">{getFormTitle()}</h3>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-widget-primary rounded-md focus:outline-none focus:ring-2 focus:ring-widget-primary focus:ring-opacity-50"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-widget-primary rounded-md focus:outline-none focus:ring-2 focus:ring-widget-primary focus:ring-opacity-50"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-widget-primary rounded-md focus:outline-none focus:ring-2 focus:ring-widget-primary focus:ring-opacity-50"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-widget-primary rounded-md focus:outline-none focus:ring-2 focus:ring-widget-primary focus:ring-opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 rounded-md text-white font-medium transition-colors"
          style={{ 
            backgroundColor: isSubmitting ? '#ccc' : 'var(--widget-primary)',
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default LeadForm;