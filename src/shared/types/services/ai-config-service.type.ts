import { AIModelModel, HealthStatusModel, ModelInfoModel } from "../models/ai-model.type";
import { ConversationLogModel } from "../models/conversation-log.type";

export type getCurrentModelResponse = {
  model: ModelInfoModel;
  health: HealthStatusModel;
};

export type getModelsHealthResponse = AIModelModel[];

export type getAllModelsResponse = AIModelModel[];

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