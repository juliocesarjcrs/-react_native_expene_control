import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig';
import {
  ChatMessage,
  ChatResponse,
  ConversationsResponse,
  ConversationHistoryResponse,
  NewConversation,
  GetConversationsQuery
} from '~/shared/types/services/chatbot-services.type';

const PREFIX = "chatbot";

export const chatbotService = {
  async createConversation(): Promise<AxiosResponse<NewConversation>> {
    try {
      return await axios.post(`${PREFIX}/conversation`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error creating conversation');
    }
  },

  async getConversations(params?: GetConversationsQuery): Promise<AxiosResponse<ConversationsResponse>> {
    try {
      return await axios.get(`${PREFIX}/conversations`, { params });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error fetching conversations');
    }
  },

  async sendMessage(
    message: string,
    conversationId: number
  ): Promise<AxiosResponse<ChatResponse>> {
    try {
      return await axios.post(`${PREFIX}/message`, {
        content: message,
        conversationId
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error connecting to chatbot service');
    }
  },

  async getConversationHistory(
    conversationId: number
  ): Promise<AxiosResponse<ConversationHistoryResponse>> {
    try {
      return await axios.get(`${PREFIX}/conversations/${conversationId}/messages`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error fetching conversation history');
    }
  },

  async deleteConversation(conversationId: number): Promise<AxiosResponse<void>> {
    try {
      return await axios.delete(`${PREFIX}/conversations/${conversationId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error deleting conversation');
    }
  }
};