import React, { useState, useEffect, useRef } from 'react';
// FIX: Remove non-exported LiveSession type
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAI_Blob } from '@google/genai';
import CloseIcon from './icons/CloseIcon';
import { geminiAI } from '../services/geminiService';

// --- Audio Helper Functions ---

// Decode base64 string to Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Encode Uint8Array to base64 string
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decode raw PCM data to an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Create a GenAI Blob from raw audio data
function createBlob(data: Float32Array): GenAI_Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Component ---

interface LiveTalkProps {
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'IDLE' | 'CONNECTING' | 'LISTENING' | 'SPEAKING' | 'ERROR';

const LiveTalk: React.FC<LiveTalkProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<Status>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  
  // FIX: Infer the session promise type from the geminiAI client
  const sessionPromiseRef = useRef<ReturnType<typeof geminiAI.live.connect> | null>(null);
  const audioContextsRef = useRef<{ input: AudioContext | null, output: AudioContext | null }>({ input: null, output: null });
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      endSession();
    }

    return () => {
      endSession();
    };
  }, [isOpen]);

  const startSession = async () => {
    if (status !== 'IDLE' || sessionPromiseRef.current) return;
    setStatus('CONNECTING');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      audioContextsRef.current.input = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextsRef.current.output = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      sessionPromiseRef.current = geminiAI.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('LISTENING');
            const inputCtx = audioContextsRef.current.input;
            if (!inputCtx || !audioStreamRef.current) return;

            const source = inputCtx.createMediaStreamSource(audioStreamRef.current);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            audioProcessorRef.current = scriptProcessor;
          },
          onmessage: async (message: LiveServerMessage) => {
            setStatus('SPEAKING');
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const outputCtx = audioContextsRef.current.output;
              if (!outputCtx) return;
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              
              source.addEventListener('ended', () => {
                  audioSourcesRef.current.delete(source);
                  if (audioSourcesRef.current.size === 0) {
                      setStatus('LISTENING');
                  }
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
               for (const source of audioSourcesRef.current.values()) {
                  source.stop();
                  audioSourcesRef.current.delete(source);
               }
               nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            setStatus('ERROR');
            setErrorMessage(e.message || 'An unknown error occurred.');
            console.error('Live session error:', e);
          },
          onclose: () => {
             // Handled by endSession
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
      });
    } catch (err) {
      setStatus('ERROR');
      setErrorMessage('Failed to get microphone permissions.');
      console.error(err);
    }
  };
  
  const endSession = () => {
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;
    
    audioStreamRef.current?.getTracks().forEach(track => track.stop());
    audioStreamRef.current = null;
    
    audioProcessorRef.current?.disconnect();
    audioProcessorRef.current = null;
    
    audioContextsRef.current.input?.close();
    audioContextsRef.current.output?.close();
    audioContextsRef.current = { input: null, output: null };

    for (const source of audioSourcesRef.current.values()) {
      source.stop();
    }
    audioSourcesRef.current.clear();
    
    setStatus('IDLE');
  };

  if (!isOpen) return null;

  const getStatusText = () => {
    switch(status) {
        case 'CONNECTING': return "Connecting...";
        case 'LISTENING': return "Listening...";
        case 'SPEAKING': return "Speaking...";
        case 'ERROR': return `Error: ${errorMessage}`;
        default: return "Ready";
    }
  }
  
  const VisualizerBar: React.FC<{ delay: string }> = ({ delay }) => (
    <div 
        className={`w-1 h-8 rounded-full bg-[var(--c-visualizer)] transition-all duration-300 ease-in-out ${status === 'SPEAKING' ? 'animate-pulse' : ''}`}
        style={{ animationDelay: delay }}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="relative flex flex-col items-center justify-center w-[90vw] max-w-md h-80 gap-8 p-8 rounded-3xl
                   bg-slate-100/70 dark:bg-slate-900/70 backdrop-blur-2xl
                   border border-white/40 dark:border-slate-700/40 shadow-2xl
                   animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          aria-label="Close live talk"
        >
          <CloseIcon />
        </button>
        
        <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Live Conversation</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{getStatusText()}</p>
        </div>

        <div className="flex items-center justify-center gap-2 h-10">
           {status === 'SPEAKING' ? (
                <>
                    <VisualizerBar delay="0ms" />
                    <VisualizerBar delay="100ms" />
                    <VisualizerBar delay="200ms" />
                    <VisualizerBar delay="150ms" />
                    <VisualizerBar delay="50ms" />
                </>
           ) : (
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center
                    ${status === 'LISTENING' ? 'border-[var(--c-active)] animate-pulse' : 'border-slate-400/50'}`}>
                    <div className={`w-8 h-8 rounded-full
                        ${status === 'LISTENING' ? 'bg-[var(--c-active)]' : 'bg-slate-400/50'}`}>
                    </div>
                </div>
           )}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Click outside or press the close button to end the session.
        </p>

        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }

          @keyframes pulse {
            0%, 100% { transform: scaleY(0.5); }
            50% { transform: scaleY(1); }
          }
          .animate-pulse { animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        `}</style>
      </div>
    </div>
  );
};

export default LiveTalk;
