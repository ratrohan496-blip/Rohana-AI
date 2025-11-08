import React, { useMemo } from 'react';
import { marked } from 'marked';
import { MessageAuthor } from '../types';
import type { ChatMessage } from '../types';
import BotIcon from './icons/BotIcon';
import UserIcon from './icons/UserIcon';

interface MessageProps {
  message: ChatMessage;
  isStreaming: boolean;
}

const sanitize = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    // Remove potentially harmful tags
    Array.from(temp.querySelectorAll('script, style, link, iframe, object')).forEach(el => el.remove());
    // Remove all 'on...' event handlers
    Array.from(temp.querySelectorAll('*')).forEach(el => {
        for(const attr of Array.from(el.attributes)) {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        }
    });
    return temp.innerHTML;
}

const Message: React.FC<MessageProps> = ({ message, isStreaming }) => {
  const parsedContent = useMemo(() => {
    if (!message.content) return '';
    const rawHtml = marked.parse(message.content, { gfm: true, breaks: true }) as string;
    return sanitize(rawHtml);
  }, [message.content]);

  const isUser = message.author === MessageAuthor.USER;
  
  const proseClasses = isUser 
    ? 'prose-invert prose-p:text-white prose-li:text-white prose-headings:text-white prose-strong:text-white [&_a]:text-[var(--c-prose-user-link)] [&_a:hover]:text-white [&_code]:text-[var(--c-prose-user-code)]'
    : 'dark:prose-invert';

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <BotIcon />}
      <div className={`max-w-xl w-fit ${isUser ? 'order-1' : 'order-2'}`}>
        <div 
          className={`
            px-4 py-3 rounded-2xl shadow-md
            ${isUser 
              ? 'bg-[var(--c-solid)] text-white rounded-br-lg' 
              : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 rounded-bl-lg'
            }
          `}
        >
          {message.image && (
            <img 
              src={message.image} 
              alt="User attachment" 
              className="max-w-xs h-auto rounded-lg mb-2" 
            />
          )}
          {message.content ? (
            <div 
              className={`prose prose-sm max-w-none ${proseClasses}`}
              dangerouslySetInnerHTML={{ __html: parsedContent }} 
            />
          ) : (
            isStreaming && <div className="animate-pulse h-4 w-10 bg-slate-300/50 dark:bg-slate-600/50 rounded"></div>
          )}
          {isStreaming && !isUser && message.content.length > 0 && <span className="animate-pulse">▍</span>}
        </div>
      </div>
      {isUser && <UserIcon />}
    </div>
  );
};

export default Message;