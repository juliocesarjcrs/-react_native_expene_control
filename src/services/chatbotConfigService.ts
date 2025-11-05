import axios from '../plugins/axiosConfig';
import {
  ChatbotConfig,
  ChatbotConfigHistory,
  CreateChatbotConfigDto,
} from '~/shared/types/models/chatbot-config.type';
import {
  GetAllConfigsResponse,
  GetConfigResponse,
  CreateConfigResponse,
  UpdateConfigResponse,
  ToggleChatbotConfigResponse,
  DeleteChatbotConfigResponse,
  GetConfigHistoryResponse,
  RevertConfigResponse,
  InvalidateCacheResponse,
  ExportConfigsResponse,
  ImportConfigsResponse,
} from '~/shared/types/services/chatbot-config-services.types';

const PREFIX = 'chatbot/config';

/**
 * Obtener todas las configuraciones
 */
export const getAllChatbotConfigs = async (
  includeInactive: boolean = false
): Promise<ChatbotConfig[]> => {
  const response = await axios.get<GetAllConfigsResponse>(
    `${PREFIX}?includeInactive=${includeInactive}`
  );
  return response.data.data;
};

/**
 * Obtener una configuración específica por key
 */
export const getChatbotConfig = async (configKey: string): Promise<ChatbotConfig> => {
  const response = await axios.get<GetConfigResponse>(`${PREFIX}/${configKey}`);
  return response.data.data;
};

/**
 * Crear nueva configuración
 */
export const createChatbotConfig = async (
  configDto: CreateChatbotConfigDto
): Promise<ChatbotConfig> => {
  const response = await axios.post<CreateConfigResponse>(`${PREFIX}`, configDto);
  return response.data.data;
};

/**
 * Actualizar valor de configuración
 */
export const updateChatbotConfig = async (
  configKey: string,
  configValue: any,
  changeReason?: string,
): Promise<ChatbotConfig> => {
  const response = await axios.patch<UpdateConfigResponse>(`${PREFIX}/${configKey}`, {
    config_value: configValue,
    change_reason: changeReason,
  });
  return response.data.data;
};

/**
 * Activar/Desactivar configuración
 */
export const toggleChatbotConfig = async (
  configKey: string,
  isActive: boolean,
): Promise<ChatbotConfig> => {
  const response = await axios.patch<ToggleChatbotConfigResponse>(
    `${PREFIX}/${configKey}/toggle`,
    { is_active: isActive },
  );
  return response.data.data;
};

/**
 * Eliminar una configuración (soft delete)
 */
export const deleteChatbotConfig = async (
  configKey: string,
): Promise<DeleteChatbotConfigResponse> => {
  const response = await axios.delete<DeleteChatbotConfigResponse>(`${PREFIX}/${configKey}`);
  return response.data;
};

/**
 * Obtener historial de cambios de una configuración
 */
export const getChatbotConfigHistory = async (
  configKey: string,
  limit: number = 10,
): Promise<ChatbotConfigHistory[]> => {
  const response = await axios.get<GetConfigHistoryResponse>(
    `${PREFIX}/${configKey}/history?limit=${limit}`
  );
  return response.data.data;
};

/**
 * Revertir a una versión anterior
 */
export const revertChatbotConfig = async (
  configKey: string,
  historyId: number,
): Promise<ChatbotConfig> => {
  const response = await axios.post<RevertConfigResponse>(
    `${PREFIX}/${configKey}/revert/${historyId}`
  );
  return response.data.data;
};

/**
 * Invalidar cache manualmente
 */
export const invalidateConfigCache = async (): Promise<InvalidateCacheResponse> => {
  const response = await axios.post<InvalidateCacheResponse>(`${PREFIX}/cache/invalidate`);
  return response.data;
};

/**
 * Exportar todas las configuraciones
 */
export const exportChatbotConfigs = async (): Promise<ExportConfigsResponse> => {
  const response = await axios.get<ExportConfigsResponse>(`${PREFIX}/export/all`);
  return response.data;
};

/**
 * Importar configuraciones desde backup
 */
export const importChatbotConfigs = async (
  configs: any[]
): Promise<ImportConfigsResponse> => {
  const response = await axios.post<ImportConfigsResponse>(`${PREFIX}/import`, configs);
  return response.data;
};