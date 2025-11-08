import { useState, useEffect, useRef } from 'react';

interface VoiceRecognitionOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: any) => void;
}

const getSpeechRecognition = () => {
  if (typeof window !== 'undefined') {
    // FIX: Cast window to `any` to access browser-specific SpeechRecognition APIs.
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }
  return null;
};
const SpeechRecognition = getSpeechRecognition();

export const useVoiceRecognition = (options: VoiceRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.error('Speech Recognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript);
      if (options.onResult && finalTranscript) {
          options.onResult(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (options.onError) {
        options.onError(event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    
    return () => {
        recognition.stop();
    }
  }, [options.onResult, options.onError]);

  const start = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stop = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    start,
    stop,
    isSupported: !!SpeechRecognition,
  };
};
