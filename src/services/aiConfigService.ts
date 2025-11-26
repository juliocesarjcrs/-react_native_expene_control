import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig'
import { CreateAIModelDto, getAllModelsResponse, getCurrentModelResponse, GetInteractionLogsResponse, GetModelErrorsResponse, getModelsHealthResponse, UpdateAIModelDto } from '~/shared/types/services/ai-config-service.type';
import { AIModel } from '~/shared/types/models/ai-model.type';
const PREFIX = 'chatbot/models'
const ANALYTICS_PREFIX = 'chatbot/analytics';
export const getCurrentModel = async (): Promise<getCurrentModelResponse> => {
  const response: AxiosResponse<getCurrentModelResponse> = await axios.get(`${PREFIX}/current`);
  return response.data;
};

export const getModelsHealth = async (): Promise<getModelsHealthResponse> => {
  const response: AxiosResponse<getModelsHealthResponse> = await axios.get(`${PREFIX}/health`);
  return response.data;
};

export const getAllModels = async (): Promise<getAllModelsResponse> => {
  const response: AxiosResponse<getAllModelsResponse> = await axios.get(`${PREFIX}`);
  return response.data;
};

export const reloadModels = async (): Promise<{ message: string }> => {
  const response = await axios.post(`${PREFIX}/reload`);
  return response.data;
};

export const getModelErrors = async (
  limit: number = 20
): Promise<GetModelErrorsResponse> => {
  const response = await axios.get(`${PREFIX}/errors?limit=${limit}`);
  return response.data;
};

export const getInteractionLogs = async (limit: number = 50): Promise<GetInteractionLogsResponse> => {
  const response = await axios.get(`${ANALYTICS_PREFIX}/interactions?limit=${limit}`);
  return response.data;
};

/**
 * Crear nuevo modelo de IA
 */
export const createModel = async (
  modelData: CreateAIModelDto
): Promise<AIModel> => {
  const response = await axios.post(`${PREFIX}`, modelData);
  return response.data;
};

/**
 * Actualizar modelo existente
 */
export const updateModel = async (
  modelId: number,
  updates: UpdateAIModelDto
): Promise<AIModel> => {
  const response = await axios.patch(`${PREFIX}/${modelId}`, updates);
  return response.data;
};

/**
 * Eliminar modelo (marca como inactivo)
 */
export const deleteModel = async (modelId: number): Promise<void> => {
  const response = await axios.delete(`${PREFIX}/${modelId}`);
  return response.data;
};


