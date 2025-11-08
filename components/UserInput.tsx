import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import SendIcon from './icons/SendIcon';
import AttachmentIcon from './icons/AttachmentIcon';
import MicIcon from './icons/MicIcon';
import StopIcon from './icons/StopIcon';
import CloseIcon from './icons/CloseIcon';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface UserInputProps {
  onSubmit: (input: string, image?: { data: string; mimeType: string }) => void;
  isLoading: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onSubmit, isLoading }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<{ file: File, preview: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, transcript, start, stop } = useVoiceRecognition();
  
  useEffect(() => {
    if (transcript) {
        setInput(prev => prev + transcript);
    }
  }, [transcript]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove "data:mimeType;base64," prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
  }

  const handleSubmit = async () => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && !attachment) || isLoading) return;

    let imagePayload;
    if (attachment) {
        const base64Data = await fileToBase64(attachment.file);
        imagePayload = { data: base64Data, mimeType: attachment.file.type };
    }

    onSubmit(trimmedInput, imagePayload);
    setInput('');
    setAttachment(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setAttachment({ file, preview });
    }
  }

  const canSubmit = !isLoading && (!!input.trim() || !!attachment);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-2">
       {attachment && (
        <div className="relative w-24 h-24 bg-white/50 dark:bg-slate-800/50 p-1 border border-[var(--c-solid)]/50 rounded-lg">
          <img src={attachment.preview} alt="Attachment preview" className="w-full h-full object-cover rounded-md" />
          <button 
            onClick={() => {
                setAttachment(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="absolute -top-2 -right-2 bg-slate-600 hover:bg-slate-800 text-white rounded-full p-0.5"
            aria-label="Remove attachment"
            >
                <CloseIcon />
            </button>
        </div>
       )}
      <div className="flex items-end bg-white dark:bg-slate-800 rounded-xl p-2 shadow-md border border-gray-200 dark:border-slate-700 focus-within:border-[var(--c-focus-border)] focus-within:ring-2 focus-within:ring-[var(--c-focus-ring)] transition-all duration-300">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isListening}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-[var(--c-text-hover)] dark:hover:text-[var(--c-text-hover)] disabled:opacity-50"
            aria-label="Attach file"
        >
            <AttachmentIcon />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Message Rohana AI..."}
          className="flex-1 bg-transparent text-gray-800 dark:text-slate-200 placeholder-gray-500/80 dark:placeholder-slate-400/80 focus:outline-none resize-none px-2 py-2 max-h-48"
          rows={1}
          disabled={isLoading || isListening}
          aria-label="Chat input"
        />
        <button
            onClick={isListening ? stop : start}
            disabled={isLoading}
            className={`p-2 transition-colors disabled:opacity-50 ${isListening ? 'text-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-[var(--c-text-hover)] dark:hover:text-[var(--c-text-hover)]'}`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
            {isListening ? <StopIcon /> : <MicIcon />}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`ml-2 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out text-white disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--c-focus-ring)] ${
            canSubmit ? 'bg-gradient-to-br from-[var(--c-grad-from)] to-[var(--c-grad-to)] hover:opacity-90' : 'bg-gray-300 dark:bg-slate-600'
          }`}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default UserInput;