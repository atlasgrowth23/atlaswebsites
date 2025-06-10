import { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, XMarkIcon } from '@heroicons/react/24/solid';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

type AtlasVoiceMicProps = {
  onVoiceCommand?: (result: { transcript: string; intent: string; success: boolean }) => void;
  className?: string;
};

export default function AtlasVoiceMic({ onVoiceCommand, className = '' }: AtlasVoiceMicProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      setVoiceState('listening');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processAudio();
      };

      mediaRecorderRef.current.start();

      // Auto-stop after 10 seconds for mobile battery/UX
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Microphone access denied');
      setVoiceState('error');
      
      setTimeout(() => {
        if (voiceState === 'error') {
          setVoiceState('idle');
          setError(null);
        }
      }, 3000);
    }
  };

  const stopRecording = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const getUserLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      // Check cache first (30 min expiry)
      const cached = localStorage.getItem('lastLatLng');
      if (cached) {
        const { lat, lng, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30 * 60 * 1000) { // 30 minutes
          resolve({ lat, lng });
          return;
        }
      }

      // Get fresh location
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Cache for 30 minutes
          localStorage.setItem('lastLatLng', JSON.stringify({
            ...location,
            timestamp: Date.now()
          }));
          
          resolve(location);
        },
        () => resolve(null),
        { timeout: 5000, maximumAge: 30 * 60 * 1000 }
      );
    });
  };

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      setVoiceState('idle');
      return;
    }

    setVoiceState('processing');

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      
      // Get user location in parallel with audio processing
      const [userLocation] = await Promise.all([
        getUserLocation()
      ]);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Add location if available
      if (userLocation) {
        formData.append('user_lat', userLocation.lat.toString());
        formData.append('user_lng', userLocation.lng.toString());
      }

      const startTime = Date.now();
      
      const response = await fetch('/api/voice/atlas', {
        method: 'POST',
        body: formData,
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      setTranscript(result.transcript || 'Could not understand audio');
      
      if (result.success && result.response) {
        // Speak the response
        await speakResponse(result.response);
        setVoiceState('idle');
        
        onVoiceCommand?.({
          transcript: result.transcript,
          intent: result.intent,
          success: true
        });
      } else {
        setError(result.error || 'Command not recognized');
        setVoiceState('error');
        
        setTimeout(() => {
          setVoiceState('idle');
          setError(null);
        }, 3000);
        
        onVoiceCommand?.({
          transcript: result.transcript,
          intent: result.intent || 'unknown',
          success: false
        });
      }

      console.log(`Atlas Voice: ${responseTime}ms response time`);

    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process voice command');
      setVoiceState('error');
      
      setTimeout(() => {
        setVoiceState('idle');
        setError(null);
      }, 3000);
      
      onVoiceCommand?.({
        transcript: transcript || 'Error',
        intent: 'error',
        success: false
      });
    }
  };

  const speakResponse = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        resolve();
        return;
      }

      setVoiceState('speaking');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onend = () => {
        setVoiceState('idle');
        resolve();
      };

      utterance.onerror = () => {
        setVoiceState('idle');
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const handleClick = () => {
    if (voiceState === 'idle') {
      startRecording();
    } else if (voiceState === 'listening') {
      stopRecording();
    }
  };

  const getButtonClass = () => {
    // Position above mobile nav on small screens (mobile nav is ~60px tall)
    const baseClass = 'fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-50 focus:outline-none focus:ring-4 focus:ring-offset-2';
    
    switch (voiceState) {
      case 'listening':
        return `${baseClass} bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white animate-pulse focus:ring-red-300 dark:focus:ring-red-800`;
      case 'processing':
        return `${baseClass} bg-yellow-500 dark:bg-yellow-600 text-white cursor-not-allowed focus:ring-yellow-300 dark:focus:ring-yellow-800`;
      case 'speaking':
        return `${baseClass} bg-green-500 dark:bg-green-600 text-white cursor-not-allowed animate-pulse focus:ring-green-300 dark:focus:ring-green-800`;
      case 'error':
        return `${baseClass} bg-red-700 dark:bg-red-800 text-white cursor-not-allowed focus:ring-red-300 dark:focus:ring-red-900`;
      default:
        return `${baseClass} bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white focus:ring-blue-300 dark:focus:ring-blue-800`;
    }
  };

  const getIcon = () => {
    if (voiceState === 'listening') {
      return <XMarkIcon className="h-6 w-6" />;
    }
    return <MicrophoneIcon className="h-6 w-6" />;
  };

  const getTooltipText = () => {
    switch (voiceState) {
      case 'listening':
        return 'Tap to stop recording';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking response';
      case 'error':
        return error || 'Error occurred';
      default:
        return 'Tap and speak: "Add contact..." or "How far is..."';
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={voiceState === 'processing' || voiceState === 'speaking'}
        className={`${getButtonClass()} ${className}`}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {getIcon()}
      </button>

      {/* Status overlay for mobile */}
      {voiceState !== 'idle' && (
        <div className="fixed bottom-36 right-4 md:bottom-24 md:right-6 bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-40 max-w-xs">
          {voiceState === 'listening' && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Listening...</span>
            </div>
          )}
          {voiceState === 'processing' && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
              <span>Processing...</span>
            </div>
          )}
          {voiceState === 'speaking' && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Speaking...</span>
            </div>
          )}
          {voiceState === 'error' && (
            <div className="text-red-300">
              {error || 'Error occurred'}
            </div>
          )}
          {transcript && voiceState === 'processing' && (
            <div className="text-gray-300 text-xs mt-1 italic">
              "{transcript}"
            </div>
          )}
        </div>
      )}
    </>
  );
}