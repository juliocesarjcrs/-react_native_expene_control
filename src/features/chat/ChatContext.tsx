import { AxiosError } from 'axios';
import React, { createContext, useContext, useState, useEffect } from 'react';
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

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [hasLoadedInitialConversation, setHasLoadedInitialConversation] = useState(false);

  // Cargar conversaciones al iniciar
  useEffect(() => {
    const initializeChat = async () => {
      await loadConversations();
    };

    initializeChat();
  }, []);

  // Seleccionar la conversación más reciente cuando se cargan las conversaciones por primera vez
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId && !hasLoadedInitialConversation) {
      // La primera conversación es la más reciente (asumiendo que vienen ordenadas por fecha desc)
      const mostRecentConversation = conversations[0];
      selectConversation(mostRecentConversation.id);
      setHasLoadedInitialConversation(true);
    }
  }, [conversations, currentConversationId, hasLoadedInitialConversation]);

  // Limpiar error automáticamente después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  // Limpiar error cuando cambia la conversación
  useEffect(() => {
    setError(null);
  }, [currentConversationId]);

  const clearError = () => {
    setError(null);
  };

  const sendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      setError(null); // Limpiar error previo al enviar nuevo mensaje

      // Si no hay conversación activa, crear una nueva
      let conversationId = currentConversationId;
      if (!conversationId) {
        const newConversationResponse = await chatbotService.createConversation();
        conversationId = newConversationResponse.data.id;
        setCurrentConversationId(conversationId);
        // Recargar lista de conversaciones para incluir la nueva
        await loadConversations();
      }

      // Agregar mensaje del usuario inmediatamente (optimistic update)
      const userMessage: ChatMessage = {
        id: Date.now(), // Temporal, será reemplazado por el ID real del servidor
        content,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMessage]);

      // Enviar mensaje al servicio
      const response = await chatbotService.sendMessage(content, conversationId);

      // La respuesta contiene el mensaje del asistente
      // response.data.data contiene el ChatMessage
      const assistantMessage: ChatMessage = response.data.data;

      setMessages((prev) => [...prev, assistantMessage]);

      // Actualizar lista de conversaciones después de enviar mensaje
      await loadConversations();
    } catch (err) {
      console.error('Chat error:', err);

      // Mensaje amigable para el cuadro rojo del chat
      let errorMessage = 'No se pudo enviar el mensaje.';

      if (err instanceof AxiosError) {
        const backendMsg = err.response?.data?.message || err.response?.data?.error;

        if (backendMsg) {
          errorMessage = Array.isArray(backendMsg) ? backendMsg[0] : backendMsg;
        } else if (!err.response) {
          errorMessage = 'Sin conexión al servidor.';
        } else if (err.response.status === 400) {
          errorMessage = 'El modelo de IA no está disponible. Intenta de nuevo.';
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (conversationId: number) => {
    try {
      setIsLoading(true);
      setError(null); // Limpiar error al cambiar de conversación

      const response = await chatbotService.getConversationHistory(conversationId);

      // Filtrar mensajes del sistema y solo mostrar user y assistant
      const filteredMessages = response.data.data.filter(
        (msg: ChatMessage) => msg.role !== 'system'
      );

      setMessages(filteredMessages);
      setCurrentConversationId(conversationId);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('No se pudo cargar la conversación.');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = async () => {
    setMessages([]);
    setCurrentConversationId(null);
    setError(null); // Limpiar error al iniciar nueva conversación
    setHasLoadedInitialConversation(true); // Evitar que se recargue automáticamente
    // Recargar la lista de conversaciones
    await loadConversations();
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setError(null);
  };

  const loadConversations = async (params?: GetConversationsQuery) => {
    try {
      setError(null);
      const response = await chatbotService.getConversations(params);

      // response.data.data contiene el array de Conversation
      setConversations(response.data.data);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('No se pudieron cargar las conversaciones.');
    }
  };

  const deleteConversation = async (conversationId: number) => {
    try {
      setError(null);
      await chatbotService.deleteConversation(conversationId);

      // Si es la conversación actual, limpiar
      if (currentConversationId === conversationId) {
        setMessages([]);
        setCurrentConversationId(null);
      }

      // Recargar la lista de conversaciones
      await loadConversations();
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('No se pudo eliminar la conversación.');
    }
  };

  return (
    <ChatContext.Provider
      value={{
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
