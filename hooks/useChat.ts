import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { MessageAuthor } from '../types';
import { geminiAI } from '../services/geminiService';
import type { Chat, Part } from '@google/genai';
import type { Model, Persona } from '../App';

const personaSystemInstructions: Record<Persona, string> = {
    'default': 'You are Rohana, a friendly and insightful AI assistant. Welcome your users warmly and assist them with creativity and kindness. Use markdown for formatting when it helps clarify things.',
    'creative': 'You are Rohana, an AI muse for creativity. Your purpose is to inspire, brainstorm, and help users explore artistic and imaginative ideas. Speak with a poetic and encouraging tone. Use markdown to structure your creative outputs.',
    'code-assistant': 'You are Rohana, a specialized AI Code Assistant. Provide clear, efficient, and well-documented code solutions. Explain technical concepts precisely. Use markdown code blocks for all code snippets.',
};

export const useChat = (model: Model, persona: Persona) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatRef = useRef<Chat | null>(null);

  const initializeChat = useCallback((modelToInit: Model, personaToInit: Persona) => {
    try {
        chatRef.current = geminiAI.chats.create({
            model: modelToInit,
            config: {
                systemInstruction: personaSystemInstructions[personaToInit],
            },
        });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to initialize AI.';
        setError(errorMessage);
    }
  }, []);
  
  const startNewChat = useCallback(() => {
    setError(null);
    setMessages([]);
    initializeChat(model, persona);
  }, [initializeChat, model, persona]);

  useEffect(() => {
    startNewChat();
  }, [model, persona, startNewChat]);


  const sendMessage = async (userInput: string, image?: { data: string; mimeType: string }) => {
    if ((!userInput.trim() && !image) || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      author: MessageAuthor.USER,
      content: userInput,
      image: image ? `data:${image.mimeType};base64,${image.data}` : undefined,
    };
    
    setMessages((prevMessages) => [
        ...prevMessages, 
        userMessage,
        { id: (Date.now() + 1).toString(), author: MessageAuthor.BOT, content: '' }
    ]);

    try {
        if (!chatRef.current) {
            throw new Error("Chat not initialized. Please check your API key.");
        }
        
        const messageParts: Part[] = [{ text: userInput }];
        if (image) {
            messageParts.push({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType,
                }
            });
        }
        
        const stream = await chatRef.current.sendMessageStream({ message: messageParts });

        let fullResponse = "";
        for await (const chunk of stream) {
            fullResponse += chunk.text;
            setMessages((prevMessages) => {
                const newMessages = [...prevMessages];
                newMessages[newMessages.length - 1].content = fullResponse;
                return newMessages;
            });
        }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
       setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if(lastMessage.author === MessageAuthor.BOT) {
             lastMessage.content = `Sorry, I encountered an error: ${errorMessage}`;
          }
          return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, error, sendMessage, startNewChat };
};