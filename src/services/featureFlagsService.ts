import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig';
import { FeatureFlag } from '~/shared/types/models/feature-flags.type';
import {
  CreateFeatureDto,
  DeleteFeatureResponse,
  FeatureStatusResponse,
  UpdateFeatureDto
} from '~/shared/types/services/feature-flags-service.type';

const PREFIX = 'feature-flags';

// ============================================
// ENDPOINTS PÚBLICOS (sin autenticación)
// ============================================

/**
 * Obtener todas las features habilitadas (público)
 */
export const getEnabledFeatures = async (): Promise<FeatureFlag[]> => {
  const response: AxiosResponse<FeatureFlag[]> = await axios.get(`${PREFIX}/enabled`);
  return response.data;
};

/**
 * Verificar estado del chatbot (público)
 */
export const getChatbotStatus = async (): Promise<FeatureStatusResponse> => {
  const response: AxiosResponse<FeatureStatusResponse> = await axios.get(
    `${PREFIX}/chatbot/status`
  );
  return response.data;
};

// ============================================
// ENDPOINTS AUTENTICADOS
// ============================================

/**
 * Obtener todas las features (requiere auth)
 * Admin ve todas, usuarios normales solo las activas
 */
export const getAllFeatures = async (): Promise<FeatureFlag[]> => {
  const response: AxiosResponse<FeatureFlag[]> = await axios.get(`${PREFIX}`);
  return response.data;
};

/**
 * Obtener una feature específica por su key
 */
export const getFeatureByKey = async (key: string): Promise<FeatureFlag> => {
  const response: AxiosResponse<FeatureFlag> = await axios.get(`${PREFIX}/${key}`);
  return response.data;
};

/**
 * Verificar si una feature está habilitada
 */
export const checkFeatureStatus = async (key: string): Promise<FeatureStatusResponse> => {
  const response: AxiosResponse<FeatureStatusResponse> = await axios.get(`${PREFIX}/${key}/status`);
  return response.data;
};

// ============================================
// ENDPOINTS SOLO ADMIN
// ============================================

/**
 * Toggle (activar/desactivar) una feature (solo admin)
 */
export const toggleFeature = async (key: string, isEnabled: boolean): Promise<FeatureFlag> => {
  const response: AxiosResponse<FeatureFlag> = await axios.put(`${PREFIX}/${key}/toggle`, {
    isEnabled
  });
  return response.data;
};

/**
 * Actualizar una feature (solo admin)
 */
export const updateFeature = async (
  key: string,
  updateData: UpdateFeatureDto
): Promise<FeatureFlag> => {
  const response: AxiosResponse<FeatureFlag> = await axios.put(`${PREFIX}/${key}`, updateData);
  return response.data;
};

/**
 * Crear una nueva feature (solo admin)
 */
export const createFeature = async (createData: CreateFeatureDto): Promise<FeatureFlag> => {
  const response: AxiosResponse<FeatureFlag> = await axios.post(`${PREFIX}`, createData);
  return response.data;
};

/**
 * Eliminar una feature (solo admin)
 */
export const deleteFeature = async (key: string): Promise<DeleteFeatureResponse> => {
  const response: AxiosResponse<DeleteFeatureResponse> = await axios.delete(`${PREFIX}/${key}`);
  return response.data;
};
