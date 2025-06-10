import { useState, useRef } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

type VoiceMicButtonProps = {
  onTranscript: (text: string) => void;
  field: string; // Context for the API
  className?: string;
};

export default function VoiceMicButton({ 
  onTranscript, 
  field,
  className = '' 
}: VoiceMicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 15 seconds (Whisper limit)
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 15000);

    } catch (err) {
      setError('Microphone access denied');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('field', field);

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.text) {
        onTranscript(result.text);
      } else {
        setError(result.error || 'Transcription failed');
      }
    } catch (err) {
      setError('Network error');
      console.error('Transcription error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getButtonClass = () => {
    const baseClass = 'touch-target rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors flex items-center justify-center';
    
    if (isProcessing) {
      return `${baseClass} bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300 cursor-not-allowed`;
    }
    
    if (isRecording) {
      return `${baseClass} bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 animate-pulse`;
    }
    
    return `${baseClass} bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleRecording}
        disabled={isProcessing}
        className={getButtonClass()}
        title={isRecording ? 'Stop recording' : `Record ${field}`}
      >
        {isProcessing ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : isRecording ? (
          <StopIcon className="h-4 w-4" />
        ) : (
          <MicrophoneIcon className="h-4 w-4" />
        )}
      </button>
      
      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded shadow-lg z-10 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}