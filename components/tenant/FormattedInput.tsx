import { useState, useEffect } from 'react';
import { useAutoFormat } from '../../lib/formatters';
import VoiceMicButton from './VoiceMicButton';

type FormattedInputProps = {
  type: 'phone' | 'serial' | 'model' | 'filter' | 'address';
  value: string;
  onChange: (value: string) => void;
  onVoiceTranscript?: (text: string) => void;
  showVoiceInput?: boolean;
  placeholder?: string;
  className?: string;
  inputType?: string;
  disabled?: boolean;
  required?: boolean;
};

export default function FormattedInput({
  type,
  value,
  onChange,
  onVoiceTranscript,
  showVoiceInput = true,
  placeholder,
  className = '',
  inputType = 'text',
  disabled = false,
  required = false
}: FormattedInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const { formatValue } = useAutoFormat(type);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setLocalValue(rawValue);
    
    // Format on blur or when user stops typing
    const formatted = formatValue(rawValue);
    onChange(formatted);
  };

  const handleBlur = () => {
    const formatted = formatValue(localValue);
    setLocalValue(formatted);
    onChange(formatted);
  };

  const handleVoiceInput = (transcript: string) => {
    const formatted = formatValue(transcript);
    setLocalValue(formatted);
    onChange(formatted);
    onVoiceTranscript?.(formatted);
  };

  const getInputType = () => {
    if (inputType !== 'text') return inputType;
    switch (type) {
      case 'phone':
        return 'tel';
      default:
        return 'text';
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (type) {
      case 'phone':
        return '(555) 123-4567';
      case 'serial':
        return 'AB-12345';
      case 'model':
        return 'TRANE-XR15';
      case 'filter':
        return '16x25x1';
      default:
        return '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type={getInputType()}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={getPlaceholder()}
        disabled={disabled}
        required={required}
        className={`input-base block w-full border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
          showVoiceInput ? 'pr-12' : 'pr-4'
        }`}
      />
      {showVoiceInput && !disabled && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <VoiceMicButton
            onTranscript={handleVoiceInput}
            field={type}
          />
        </div>
      )}
    </div>
  );
}