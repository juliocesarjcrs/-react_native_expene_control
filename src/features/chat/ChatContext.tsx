import { AxiosError } from 'axios';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { chatbotService } from '~/services/chatbot';
import {
  ChatMessage,
  Conversation,
  GetConversationsQuery,
  ChatContextType as BaseChatContextType
} from '~/shared/types/services/chatbot-services.type';

// Extendemos el tipo para agregar clearError
interface ChatContextType extends BaseChatContextType {
  clearError: () => void;
}

type BackendErrorBody = {
  message?: string | string[];
  error?: string | string[];
};

const ERROR_TIMEOUT_MS = 5000;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Historial de una conversación sin los mensajes del sistema
const fetchHistory = async (conversationId: number): Promise<ChatMessage[]> => {
  const response = await chatbotService.getConversationHistory(conversationId);
  return response.data.data.filter((msg: ChatMessage) => msg.role !== 'system');
};

// Mensaje amigable para el cuadro rojo del chat
const getSendErrorMessage = (err: unknown): string => {
  if (!(err instanceof AxiosError)) return 'No se pudo enviar el mensaje.';

  const body = err.response?.data as BackendErrorBody | undefined;
  const backendMsg = body?.message || body?.error;

  if (backendMsg) return Array.isArray(backendMsg) ? backendMsg[0] : backendMsg;
  if (!err.response) return 'Sin conexión al servidor.';
  if (err.response.status === 400) return 'El modelo de IA no está disponible. Intenta de nuevo.';

  return 'No se pudo enviar el mensaje.';
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  // Carga inicial: trae las conversaciones y abre la más reciente
  // (se asume que vienen ordenadas por fecha descendente)
  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      let list: Conversation[];

      try {
        const response = await chatbotService.getConversations();
        list = response.data.data;
        if (!isMounted) return;
        setConversations(list);
      } catch {
        if (isMounted) setError('No se pudieron cargar las conversaciones.');
        return;
      }

      if (list.length === 0) return;

      try {
        setIsLoading(true);
        const history = await fetchHistory(list[0].id);
        if (!isMounted) return;
        setMessages(history);
        setCurrentConversationId(list[0].id);
      } catch {
        if (isMounted) setError('No se pudo cargar la conversación.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
    };
  }, []);

  // Limpiar error automáticamente después de 5 segundos
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => setError(null), ERROR_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [error]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadConversations = useCallback(async (params?: GetConversationsQuery) => {
    try {
      setError(null);
      const response = await chatbotService.getConversations(params);

      // response.data.data contiene el array de Conversation
      setConversations(response.data.data);
    } catch {
      setError('No se pudieron cargar las conversaciones.');
    }
  }, []);

  const selectConversation = useCallback(async (conversationId: number) => {
    try {
      setIsLoading(true);
      setError(null); // Limpiar error al cambiar de conversación

      setMessages(await fetchHistory(conversationId));
      setCurrentConversationId(conversationId);
    } catch {
      setError('No se pudo cargar la conversación.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setIsLoading(true);
        setError(null); // Limpiar error previo al enviar nuevo mensaje

        // Si no hay conversación activa, crear una nueva
        let conversationId = currentConversationId;
        if (conversationId === null) {
          const newConversationResponse = await chatbotService.createConversation();
          conversationId = newConversationResponse.data.id;
          setCurrentConversationId(conversationId);
          // Recargar lista de conversaciones para incluir la nueva
          await loadConversations();
        }

        // Agregar mensaje del usuario inmediatamente (optimistic update)
        const userMessage: ChatMessage = {
          id: Date.now(), // Temporal
          content,
          role: 'user',
          createdAt: new Date().toISOString()
        };
        setMessages((prev) => [...prev, userMessage]);

        // response.data.data contiene el mensaje del asistente
        const response = await chatbotService.sendMessage(content, conversationId);
        const assistantMessage: ChatMessage = response.data.data;
        setMessages((prev) => [...prev, assistantMessage]);

        // Actualizar lista de conversaciones después de enviar mensaje
        await loadConversations();
      } catch (err) {
        setError(getSendErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversationId, loadConversations]
  );

  const startNewConversation = useCallback(async () => {
    setMessages([]);
    setCurrentConversationId(null);
    setError(null);
    await loadConversations();
  }, [loadConversations]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setError(null);
  }, []);

  const deleteConversation = useCallback(
    async (conversationId: number) => {
      try {
        setError(null);
        await chatbotService.deleteConversation(conversationId);

        // Si es la conversación actual, limpiar
        if (currentConversationId === conversationId) {
          setMessages([]);
          setCurrentConversationId(null);
        }

        await loadConversations();
      } catch {
        setError('No se pudo eliminar la conversación.');
      }
    },
    [currentConversationId, loadConversations]
  );

  const value = useMemo<ChatContextType>(
    () => ({
      messages,
      conversations,
      isLoading,
      error,
      currentConversationId,
      sendMessage,
      selectConversation,
      startNewConversation,
      clearChat,
      loadConversations,
      deleteConversation,
      clearError
    }),
    [
      messages,
      conversations,
      isLoading,
      error,
      currentConversationId,
      sendMessage,
      selectConversation,
      startNewConversation,
      clearChat,
      loadConversations,
      deleteConversation,
      clearError
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
