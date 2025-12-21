import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig';
import { FeatureFlag, UserFeaturePermission } from '~/shared/types/models/feature-flags.type';
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
 * NUEVO: Obtener features accesibles para el usuario actual
 * Este es el endpoint principal que debe usar el frontend
 */
export const getMyFeatures = async (): Promise<FeatureFlag[]> => {
  const response: AxiosResponse<FeatureFlag[]> = await axios.get(`${PREFIX}/my-features`);
  return response.data;
};

/**
 * NUEVO: Verificar si el usuario actual puede acceder a una feature
 */
export const canAccessFeature = async (
  featureKey: string
): Promise<{ featureKey: string; canAccess: boolean }> => {
  const response = await axios.get(`${PREFIX}/${featureKey}/can-access`);
  return response.data;
};

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

// ============================================
// ENDPOINTS SOLO ADMIN (User Permissions)
// ============================================

export const getUserPermissions = async (userId: number): Promise<UserFeaturePermission[]> => {
  const response: AxiosResponse<UserFeaturePermission[]> = await axios.get(
    `${PREFIX}/permissions/user/${userId}`
  );
  return response.data;
};

export const getFeaturePermissions = async (
  featureKey: string
): Promise<UserFeaturePermission[]> => {
  const response: AxiosResponse<UserFeaturePermission[]> = await axios.get(
    `${PREFIX}/permissions/feature/${featureKey}`
  );
  return response.data;
};

export const grantUserPermission = async (data: {
  userId: number;
  featureKey: string;
  isAllowed: boolean;
  reason?: string;
  expiresAt?: string;
}): Promise<UserFeaturePermission> => {
  const response: AxiosResponse<UserFeaturePermission> = await axios.post(
    `${PREFIX}/permissions`,
    data
  );
  return response.data;
};

export const updateUserPermission = async (
  userId: number,
  featureKey: string,
  data: {
    isAllowed?: boolean;
    reason?: string;
    expiresAt?: string;
  }
): Promise<UserFeaturePermission> => {
  const response: AxiosResponse<UserFeaturePermission> = await axios.put(
    `${PREFIX}/permissions/${userId}/${featureKey}`,
    data
  );
  return response.data;
};

export const revokeUserPermission = async (
  userId: number,
  featureKey: string
): Promise<{ message: string }> => {
  const response = await axios.delete(`${PREFIX}/permissions/${userId}/${featureKey}`);
  return response.data;
};

export const bulkGrantPermissions = async (data: {
  userIds: number[];
  featureKey: string;
  isAllowed: boolean;
  reason?: string;
}): Promise<UserFeaturePermission[]> => {
  const response: AxiosResponse<UserFeaturePermission[]> = await axios.post(
    `${PREFIX}/permissions/bulk`,
    data
  );
  return response.data;
};
