export type ConversationLogModel = {
  id: number;
  conversationId: number;
  userId: number;
  aiModelId: number | null;
  model_name: string | null;
  user_query: string;
  detected_intent: string | null;
  extracted_parameters: Record<string, any> | null;
  tool_result: Record<string, any> | null;
  response_time: number;
  createdAt: Date;
};
