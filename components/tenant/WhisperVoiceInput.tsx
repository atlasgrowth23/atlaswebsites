import { useState, useRef } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

type WhisperVoiceInputProps = {
  onTranscript: (text: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
};

export default function WhisperVoiceInput({ 
  onTranscript, 
  placeholder = "Tap to record", 
  className = '',
  compact = false
}: WhisperVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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

      const response = await fetch('/api/transcribe', {
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
      setError('Network error during transcription');
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

  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (isRecording) return compact ? '' : 'Stop Recording';
    return compact ? '' : placeholder;
  };

  const getButtonClass = () => {
    const baseClass = compact 
      ? 'p-2 rounded-full' 
      : 'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium';
    
    const sizeClass = compact ? 'h-8 w-8' : 'px-3 py-2';
    
    if (isProcessing) {
      return `${baseClass} ${sizeClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 cursor-not-allowed`;
    }
    
    if (isRecording) {
      return `${baseClass} ${sizeClass} bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 border-red-300 dark:border-red-700`;
    }
    
    return `${baseClass} ${sizeClass} bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600`;
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`${getButtonClass()} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 shadow-sm`}
        title={isRecording ? 'Stop recording' : placeholder}
      >
        {isProcessing ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : isRecording ? (
          <StopIcon className={compact ? "h-4 w-4" : "h-4 w-4 mr-2"} />
        ) : (
          <MicrophoneIcon className={compact ? "h-4 w-4" : "h-4 w-4 mr-2"} />
        )}
        {!compact && getButtonText()}
      </button>
      
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}