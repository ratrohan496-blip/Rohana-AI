import React, { useRef, useEffect } from 'react';
import Message from './Message';
import UserInput from './UserInput';
import type { ChatMessage } from '../types';
import type { Model } from '../App';
import HeadsetIcon from './icons/HeadsetIcon';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (input: string, image?: { data: string; mimeType: string }) => Promise<void>;
  model: Model;
  onLiveTalkClick: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, error, sendMessage, model, onLiveTalkClick }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, messages.length > 0 ? messages[messages.length - 1].content : null]);

  const modelName = model === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash';

  return (
    <div className="flex flex-col h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-slate-700/40">
      <header className="hidden md:flex items-center justify-between p-4 border-b border-gray-200/80 dark:border-slate-800/80">
          <h1 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Rohana AI</h1>
          <button 
            onClick={onLiveTalkClick}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            aria-label="Start live talk"
          >
            <HeadsetIcon />
            <span>Live Talk</span>
          </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200">Rohana AI</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Using {modelName}. How can I help you today?</p>
            </div>
          </div>
        )}
        {messages.map((msg, index) => (
          <Message key={msg.id} message={msg} isStreaming={isLoading && index === messages.length -1} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      {error && <div className="px-4 pb-2 text-red-500 dark:text-red-400 text-center text-sm">{error}</div>}
      <div className="p-4 md:p-6 bg-transparent border-t border-gray-200/80 dark:border-slate-800/80">
        <UserInput onSubmit={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatInterface;