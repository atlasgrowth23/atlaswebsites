import React, { useState, useEffect } from 'react';
import ButtonPicker from './ButtonPicker';
import LeadForm from './LeadForm';

interface WidgetProps {
  companySlug: string;
  primaryColor: string;
  accentColor: string;
}

const Widget: React.FC<WidgetProps> = ({ companySlug, primaryColor, accentColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [cssVarsApplied, setCssVarsApplied] = useState(false);

  // Apply CSS variables dynamically
  useEffect(() => {
    // Convert hex to HSL for better CSS variable usage
    const applyColorVariables = () => {
      const root = document.documentElement;
      
      // Set color variables
      root.style.setProperty('--widget-primary', primaryColor);
      root.style.setProperty('--widget-accent', accentColor);
      
      setCssVarsApplied(true);
    };
    
    applyColorVariables();
  }, [primaryColor, accentColor]);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  const handleButtonSelect = (buttonType: string) => {
    setSelectedButton(buttonType);
  };

  // Reset form when closing
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSelectedButton(null);
    }, 300); // Wait for closing animation
  };

  if (!cssVarsApplied) {
    return null; // Don't render until CSS vars are applied
  }

  return (
    <div className="hvac-widget-container fixed bottom-4 right-4 z-50 font-sans">
      {/* Floating Action Button */}
      <button
        onClick={toggleWidget}
        className="hvac-widget-fab flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300"
        style={{ 
          backgroundColor: primaryColor,
          color: 'white'
        }}
      >
        {isOpen ? (
          <span className="text-2xl">&times;</span>
        ) : (
          <span className="text-2xl">?</span>
        )}
      </button>

      {/* Widget Content */}
      <div 
        className={`hvac-widget-content bg-white rounded-lg shadow-xl p-4 mt-4 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        style={{ 
          width: '350px',
          maxWidth: 'calc(100vw - 32px)',
          borderTop: `3px solid ${primaryColor}`
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">How can we help you?</h3>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        {!selectedButton ? (
          <ButtonPicker onSelectButton={handleButtonSelect} />
        ) : (
          <LeadForm 
            companySlug={companySlug} 
            buttonType={selectedButton}
            onBack={() => setSelectedButton(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default Widget;