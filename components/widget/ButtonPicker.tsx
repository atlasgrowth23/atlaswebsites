import React from 'react';

interface ButtonPickerProps {
  onSelectButton: (buttonType: string) => void;
}

const ButtonPicker: React.FC<ButtonPickerProps> = ({ onSelectButton }) => {
  const buttons = [
    {
      id: 'service',
      label: 'Schedule Service',
      icon: '🔧', // Using emoji as icon for simplicity
      description: 'Request a service appointment'
    },
    {
      id: 'quote',
      label: 'Free Quote',
      icon: '💰',
      description: 'Get a free estimate for installation'
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: '🚨',
      description: 'Need help right away?'
    },
    {
      id: 'question',
      label: 'Ask a Question',
      icon: '❓',
      description: 'Get answers from our experts'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {buttons.map(button => (
        <button
          key={button.id}
          onClick={() => onSelectButton(button.id)}
          className="flex flex-col items-center justify-center p-3 border rounded-lg transition-all hover:shadow-md text-center"
          style={{ 
            borderColor: 'var(--widget-primary)',
            backgroundColor: 'white',
          }}
        >
          <span className="text-2xl mb-1">{button.icon}</span>
          <span className="font-medium text-sm" style={{ color: 'var(--widget-primary)' }}>
            {button.label}
          </span>
          <span className="text-xs text-gray-500 mt-1">{button.description}</span>
        </button>
      ))}
    </div>
  );
};

export default ButtonPicker;