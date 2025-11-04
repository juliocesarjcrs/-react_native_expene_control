import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig'
import { getAllModelsResponse, getCurrentModelResponse, getModelsHealthResponse } from '~/shared/types/services/ai-config-service.type';
const PREFIX = 'chatbot/models'

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