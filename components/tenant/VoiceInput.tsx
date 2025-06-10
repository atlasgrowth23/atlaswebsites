import { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

type VoiceInputProps = {
  onTranscript: (text: string) => void;
  className?: string;
};

export default function VoiceInput({ onTranscript, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setIsSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`
        inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium
        ${isListening 
          ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-300 dark:text-red-400 dark:bg-red-900 dark:hover:bg-red-800 dark:border-red-700' 
          : 'text-gray-700 bg-white hover:bg-gray-50 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900
        ${className}
      `}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening ? (
        <>
          <StopIcon className="h-4 w-4 mr-2" />
          Stop Recording
        </>
      ) : (
        <>
          <MicrophoneIcon className="h-4 w-4 mr-2" />
          Voice Input
        </>
      )}
    </button>
  );
}