export type ChatMessage = {
  id: number;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
}

export type ChatResponse = {
  data: ChatMessage;
}

export type ConversationHistoryResponse = {
  data: ChatMessage[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type Conversation = {
  id: number;
  createdAt: string;
  lastMessage: string;
  messageCount: number;
}

export type ConversationsResponse = {
  data: Conversation[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type NewConversation = {
  provider: string;
  userId: number;
  id: number;
  createdAt: string;
};

export type GetConversationsQuery = {
  limit?: number;
  page?: number;
};

export type ChatContextType = {
  messages: ChatMessage[];
  conversations: Conversation[];
  currentConversationId: number | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  loadConversations: (params?: GetConversationsQuery) => Promise<void>;
  startNewConversation: () => Promise<void>;
  selectConversation: (conversationId: number) => Promise<void>;
  deleteConversation: (conversationId: number) => Promise<void>;
  clearError: () => void;
};