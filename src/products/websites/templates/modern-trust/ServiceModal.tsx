import React, { useState, useEffect } from 'react';
import { Company } from '@/types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    title: string;
    description: string;
    icon: React.ReactNode;
  };
  company: Company;
  serviceType: 'cooling' | 'heating';
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, service, company, serviceType }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: `I'm interested in learning more about ${service.title} services. Please contact me to schedule a consultation.`
  });

  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [showAllBenefits, setShowAllBenefits] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send to your CRM/email system
    console.log('Service inquiry submitted:', { ...formData, service: service.title, company: company.name });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      setFormData({
        name: '',
        phone: '',
        email: '',
        message: `I'm interested in learning more about ${service.title} services. Please contact me to schedule a consultation.`
      });
    }, 2000);
  };

  const serviceDetails = {
    'AC Repair': {
      details: [
        'Comprehensive diagnostic testing',
        'Refrigerant level checking and refilling',
        'Electrical component inspection',
        'Filter replacement and cleaning',
        'Thermostat calibration',
        'Emergency same-day service available'
      ],
      benefits: [
        'Restore optimal cooling performance',
        'Improve energy efficiency',
        'Extend system lifespan',
        'Prevent costly future breakdowns'
      ]
    },
    'Maintenance & Tune-ups': {
      details: [
        'Complete system inspection',
        'Coil cleaning and maintenance',
        'Belt and motor inspection',
        'Refrigerant level optimization',
        'Air filter replacement',
        'Performance testing and calibration'
      ],
      benefits: [
        'Up to 15% energy savings',
        'Prevent unexpected breakdowns',
        'Maintain warranty coverage',
        'Improve indoor air quality'
      ]
    },
    'AC Installation': {
      details: [
        'Free in-home consultation',
        'Energy efficiency assessment',
        'Proper sizing calculations',
        'Professional installation',
        'System testing and setup',
        'Warranty registration'
      ],
      benefits: [
        'Lower energy bills',
        'Improved comfort and air quality',
        'Increased home value',
        'Latest technology features'
      ]
    },
    'Heating Repair': {
      details: [
        'Complete heating system diagnosis',
        'Heat exchanger inspection',
        'Ignition system testing',
        'Thermostat troubleshooting',
        'Safety control verification',
        '24/7 emergency heating repair'
      ],
      benefits: [
        'Restore warm, comfortable temperatures',
        'Ensure safe operation',
        'Improve heating efficiency',
        'Prevent carbon monoxide risks'
      ]
    },
    'Winter Maintenance': {
      details: [
        'Furnace safety inspection',
        'Filter replacement',
        'Blower motor cleaning',
        'Gas pressure testing',
        'Venting system inspection',
        'Thermostat calibration'
      ],
      benefits: [
        'Reliable heating all winter',
        'Lower heating costs',
        'Safer operation',
        'Extended equipment life'
      ]
    },
    'Furnace Installation': {
      details: [
        'Home heating assessment',
        'High-efficiency unit selection',
        'Professional installation',
        'Ductwork evaluation',
        'System commissioning',
        'Operating instructions'
      ],
      benefits: [
        'Dramatically lower energy bills',
        'Consistent, comfortable heating',
        'Improved air quality',
        'Smart thermostat compatibility'
      ]
    }
  };

  const currentDetails = serviceDetails[service.title as keyof typeof serviceDetails] || {
    details: ['Professional service', 'Expert technicians', 'Quality guarantee'],
    benefits: ['Improved performance', 'Cost savings', 'Peace of mind']
  };

  const colors = {
    primary: serviceType === 'cooling' ? 'blue' : 'red',
    bg: serviceType === 'cooling' ? 'bg-blue-600' : 'bg-red-600',
    text: serviceType === 'cooling' ? 'text-blue-600' : 'text-red-600',
    bgLight: serviceType === 'cooling' ? 'bg-blue-50' : 'bg-red-50',
    border: serviceType === 'cooling' ? 'border-blue-200' : 'border-red-200'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`${colors.bg} text-white p-6 rounded-t-xl`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <div className="text-white">
                  {service.icon}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{service.title}</h2>
                <p className="text-lg opacity-90">{company.name}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Service Information */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">What's Included</h3>
              <ul className="space-y-3 mb-6">
                {(isMobile && !showAllDetails ? currentDetails.details.slice(0, 3) : currentDetails.details).map((detail, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <svg className={`w-5 h-5 ${colors.text} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{detail}</span>
                  </li>
                ))}
              </ul>
              {isMobile && currentDetails.details.length > 3 && (
                <button
                  onClick={() => setShowAllDetails(!showAllDetails)}
                  className={`text-sm ${colors.text} hover:underline mb-6 font-medium`}
                >
                  {showAllDetails ? 'Show Less' : `Show All ${currentDetails.details.length} Features`}
                </button>
              )}

              <h3 className="text-xl font-bold mb-4 text-gray-800">Benefits</h3>
              <ul className="space-y-3 mb-4">
                {(isMobile && !showAllBenefits ? currentDetails.benefits.slice(0, 2) : currentDetails.benefits).map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              {isMobile && currentDetails.benefits.length > 2 && (
                <button
                  onClick={() => setShowAllBenefits(!showAllBenefits)}
                  className={`text-sm ${colors.text} hover:underline font-medium`}
                >
                  {showAllBenefits ? 'Show Less' : `Show All ${currentDetails.benefits.length} Benefits`}
                </button>
              )}
            </div>

            {/* Contact Form */}
            <div className={`${colors.bgLight} p-6 rounded-lg border ${colors.border}`}>
              {submitted ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Request Submitted!</h3>
                  <p className="text-gray-600">We'll contact you within 24 hours to schedule your consultation.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Get Free Consultation</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input 
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input 
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea 
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`w-full ${colors.bg} text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity`}
                    >
                      Request Free Consultation
                    </button>
                  </form>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-2">Prefer to call directly?</p>
                    <a 
                      href={`tel:${company.phone}`}
                      className={`${colors.text} font-bold text-lg hover:underline`}
                    >
                      {company.phone}
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;