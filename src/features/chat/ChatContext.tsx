import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { chatbotService } from '~/services/chatbot';
import { ChatMessage, Conversation } from '~/shared/types/services/chatbot-services.type';

import { ChatContextType } from '~/shared/types/services/chatbot-services.type';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (params?: { limit?: number; page?: number }) => {
    try {
      const response = await chatbotService.getConversations(params);
      setConversations(response.data.data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    try {
      const response = await chatbotService.createConversation();
      setCurrentConversationId(response.data.id);
      setMessages([]);
      // Actualizar la lista de conversaciones
      await loadConversations();
    } catch (err: any) {
      setError(err.message);
    }
  }, [loadConversations]);

  const selectConversation = useCallback(async (conversationId: number) => {
    try {
      console.log('[ChatContext] selectConversation: ', conversationId);
      const { data } = await chatbotService.getConversationHistory(conversationId);
      const filteredMessages = data.data.filter((msg) => msg.role !== 'system');
      setMessages(filteredMessages);
      setCurrentConversationId(conversationId);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentConversationId) {
        await startNewConversation();
      }

      setIsLoading(true);
      setError(null);
      console.log('[ChatContext] sendMessage: ', content);
      const userMessage: ChatMessage = {
        id: Date.now(),
        content,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      console.log('[ChatContext] userMessage: ', userMessage);
      setMessages((prev) => [...prev, userMessage]);

      try {
        if (currentConversationId) {
          console.log('[ChatContext] currentConversationId: ', currentConversationId);
          const response = await chatbotService.sendMessage(content, currentConversationId);
          setMessages((prev) => [...prev, response.data.data]);
          // Actualizar la lista de conversaciones para reflejar el último mensaje
          await loadConversations();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversationId, startNewConversation, loadConversations]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Cargar conversaciones al montar el componente
  // useEffect(() => {
  //   loadConversations();
  // }, [loadConversations]);
  useEffect(() => {
    loadConversations();
    const initializeChat = async () => {
      try {
        const response = await chatbotService.getConversations({ limit: 1 });
        if (response.data.data.length > 0) {
          const lastConversation = response.data.data[0];
          await selectConversation(lastConversation.id);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    initializeChat();
  }, [selectConversation]);

  const deleteConversation = useCallback(
    async (conversationId: number) => {
      try {
        await chatbotService.deleteConversation(conversationId);
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
          setMessages([]);
        }
        await loadConversations();
      } catch (err: any) {
        setError(err.message);
      }
    },
    [currentConversationId, loadConversations]
  );

  return (
    <ChatContext.Provider
      value={{
        messages,
        conversations,
        currentConversationId,
        isLoading,
        error,
        sendMessage,
        clearChat,
        loadConversations,
        startNewConversation,
        selectConversation,
        deleteConversation
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
