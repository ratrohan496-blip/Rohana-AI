import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import HamburgerIcon from './components/icons/HamburgerIcon';
import HeadsetIcon from './components/icons/HeadsetIcon';
import LiveTalk from './components/LiveTalk';
import { useChat } from './hooks/useChat';
import { useTheme } from './hooks/useTheme';

export type Model = 'gemini-2.5-flash' | 'gemini-2.5-pro';
export type Persona = 'default' | 'creative' | 'code-assistant';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiveTalkOpen, setIsLiveTalkOpen] = useState(false);
  const [model, setModel] = useState<Model>('gemini-2.5-flash');
  const [persona, setPersona] = useState<Persona>('default');
  const { messages, isLoading, error, sendMessage, startNewChat } = useChat(model, persona);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-full h-full text-slate-800 dark:text-slate-200 font-sans flex p-2 md:p-4">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={startNewChat}
        theme={theme}
        toggleTheme={toggleTheme}
        model={model}
        onModelChange={setModel}
        persona={persona}
        onPersonaChange={setPersona}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 h-full md:pl-4 relative">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-10 md:hidden p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-[var(--c-focus-border)]"
          aria-label="Open menu"
        >
          <HamburgerIcon />
        </button>
        <button
          onClick={() => setIsLiveTalkOpen(true)}
          className="absolute top-4 right-4 z-10 md:hidden p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-[var(--c-focus-border)]"
          aria-label="Start live talk"
        >
          <HeadsetIcon />
        </button>
        <ChatInterface 
          messages={messages}
          isLoading={isLoading}
          error={error}
          sendMessage={sendMessage}
          model={model}
          onLiveTalkClick={() => setIsLiveTalkOpen(true)}
        />
      </main>
      
      <LiveTalk isOpen={isLiveTalkOpen} onClose={() => setIsLiveTalkOpen(false)} />
    </div>
  );
}

export default App;