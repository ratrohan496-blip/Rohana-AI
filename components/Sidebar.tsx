import React from 'react';
import LogoIcon from './icons/LogoIcon';
import CloseIcon from './icons/CloseIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import ProIcon from './icons/ProIcon';
import type { Model, Persona } from '../App';
import LightbulbIcon from './icons/LightbulbIcon';
import CodeIcon from './icons/CodeIcon';
import ChatBubbleIcon from './icons/ChatBubbleIcon';

const NewChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewChat: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    model: Model;
    onModelChange: (model: Model) => void;
    persona: Persona;
    onPersonaChange: (persona: Persona) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNewChat, theme, toggleTheme, model, onModelChange, persona, onPersonaChange }) => {

    const ModelButton: React.FC<{
        label: string;
        value: Model;
        icon: React.ReactNode;
    }> = ({ label, value, icon }) => {
        const isActive = model === value;
        return (
            <button
                onClick={() => onModelChange(value)}
                className={`
                    flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all
                    ${isActive 
                        ? 'bg-[var(--c-solid)] text-white shadow' 
                        : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800'}
                `}
                aria-pressed={isActive}
            >
                {icon}
                {label}
            </button>
        )
    }

    const PersonaButton: React.FC<{
      label: string;
      value: Persona;
      icon: React.ReactNode;
    }> = ({ label, value, icon }) => {
      const isActive = persona === value;
      return (
        <button
            onClick={() => onPersonaChange(value)}
            className={`
              w-full flex items-center justify-start gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all
              ${isActive
                ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100'
                : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
              }
            `}
            aria-pressed={isActive}
        >
          <span className={`p-1.5 rounded-md ${isActive ? 'bg-gradient-to-br from-[var(--c-grad-from)] to-[var(--c-grad-to)] text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
            {icon}
          </span>
          {label}
        </button>
      )
    }
    
    const FlashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>;

    return (
        <aside className={`
            w-64 flex-shrink-0 flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/40 p-4 text-slate-700 dark:text-slate-300
            transform transition-transform duration-300 ease-in-out
            fixed md:static z-30 inset-y-2 left-2 rounded-r-2xl md:rounded-2xl
            md:h-full md:shadow-2xl
            ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-[calc(100%+0.5rem)]'}
            md:translate-x-0
        `}>
            <div className="relative flex flex-col items-center gap-2 pb-4 border-b border-white/80 dark:border-slate-800/80">
                <button 
                  className="absolute top-0 right-0 md:hidden p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  onClick={onClose}
                  aria-label="Close menu"
                >
                    <CloseIcon />
                </button>
                <LogoIcon />
                <h1 className="text-xl font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    Rohana AI
                </h1>
            </div>
            
            <button 
                onClick={() => {
                    onNewChat();
                    onClose();
                }}
                className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-gradient-to-br from-[var(--c-grad-from)] to-[var(--c-grad-to)] text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity">
                <NewChatIcon />
                <span>New Chat</span>
            </button>

            <div className="flex-1 mt-6 space-y-4 overflow-y-auto">
                <div>
                    <h2 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2 px-2">Model</h2>
                    <div className="flex items-center gap-1 bg-white/40 dark:bg-slate-800/40 p-1 rounded-lg">
                       <ModelButton label="Flash" value="gemini-2.5-flash" icon={<FlashIcon />} />
                       <ModelButton label="Pro" value="gemini-2.5-pro" icon={<ProIcon />} />
                    </div>
                </div>
                 <div>
                    <h2 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2 px-2">Persona</h2>
                    <div className="space-y-1">
                        <PersonaButton label="Default" value="default" icon={<ChatBubbleIcon />} />
                        <PersonaButton label="Creative" value="creative" icon={<LightbulbIcon />} />
                        <PersonaButton label="Code Assistant" value="code-assistant" icon={<CodeIcon />} />
                    </div>
                </div>
            </div>
            
            <div className="pt-4 border-t border-white/80 dark:border-slate-800/80 flex items-center justify-between">
                 <p className="text-xs text-slate-500 dark:text-slate-400">Created by Rohan Yadav</p>
                 <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-[var(--c-hover-bg)] transition-colors"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;