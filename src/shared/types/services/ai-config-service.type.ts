import { AIModelModel, HealthStatusModel, ModelInfoModel } from "../models/ai-model.type";

export type getCurrentModelResponse = {
  model: ModelInfoModel;
  health: HealthStatusModel;
};

export type getModelsHealthResponse = AIModelModel[];

export type getAllModelsResponse = AIModelModel[];