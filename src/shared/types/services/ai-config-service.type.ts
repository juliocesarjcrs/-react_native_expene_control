import { AIModel, HealthStatusModel, ModelInfoModel } from "../models/ai-model.type";
import { ConversationLogModel } from "../models/conversation-log.type";

export type getCurrentModelResponse = {
  model: ModelInfoModel;
  health: HealthStatusModel;
};

export type getModelsHealthResponse = AIModel[];

export type getAllModelsResponse = AIModel[];

export type ToolCallAnalysisModel = {
  modelName: string;
  prompt: string;
  toolCalls: number;
  timestamp: string;
  responseTime?: number; // si existiera, opcional
};

export type GetInteractionLogsResponse = ConversationLogModel[];

export type ModelErrorModel = {
  modelName: string;
  error: string;
  responseTime: number;
  timestamp: string;
  iteration: number;
  supportsTools: string;
  tokenCount: number;
  finishReason: string;
};

export type GetModelErrorsResponse = ModelErrorModel[];


export type CreateAIModelDto = {
  provider_type: 'openrouter' | 'openai' | 'custom';
  model_name: string;
  api_endpoint: string;
  api_key_ref: string;
  priority: number;
  is_active?: boolean;
  max_tokens?: number;
  temperature?: number;
  supports_tools?: boolean;
  metadata?: Record<string, any>;
}

export type UpdateAIModelDto = {
  provider_type?: 'openrouter' | 'openai' | 'custom';
  model_name?: string;
  api_endpoint?: string;
  api_key_ref?: string;
  priority?: number;
  is_active?: boolean;
  max_tokens?: number;
  temperature?: number;
  supports_tools?: boolean;
  metadata?: Record<string, any>;
}