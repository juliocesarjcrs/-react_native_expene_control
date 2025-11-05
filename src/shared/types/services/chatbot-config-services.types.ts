import { ChatbotConfig, ChatbotConfigHistory } from "../models/chatbot-config.type";

/**
 * Response al obtener todas las configs
 */
export interface GetAllConfigsResponse {
  data: ChatbotConfig[];
  count: number;
}

/**
 * Response al obtener una config específica
 */
export interface GetConfigResponse {
  data: ChatbotConfig;
}

/**
 * Response al crear una config
 */
export interface CreateConfigResponse {
  data: ChatbotConfig;
}

/**
 * Response al actualizar una config
 */
export interface UpdateConfigResponse {
  data: ChatbotConfig;
}

/**
 * Response al toggle (activar/desactivar)
 */
export interface ToggleChatbotConfigResponse {
  data: ChatbotConfig;
}

/**
 * Response al eliminar (soft delete)
 */
export interface DeleteChatbotConfigResponse {
  success: boolean;
  message: string;
}

/**
 * Response al obtener historial
 */
export interface GetConfigHistoryResponse {
  data: ChatbotConfigHistory[];
  count: number;
}

/**
 * Response al revertir a una versión
 */
export interface RevertConfigResponse {
  data: ChatbotConfig;
}

/**
 * Response al invalidar cache
 */
export interface InvalidateCacheResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * Response al exportar configs
 */
export interface ExportConfigsResponse {
  exported_at: string;
  count: number;
  configurations: Array<{
    config_key: string;
    config_value: any;
    description: string | null;
    version: number;
  }>;
}

/**
 * Response al importar configs
 */
export interface ImportConfigsResponse {
  created: number;
  updated: number;
  errors: string[];
}
