
/**
 * Configuración del Chatbot
 */
export type ChatbotConfig = {
  id: number;
  created_at: string;
  updated_at: string;
  config_key: string;
  config_value: SystemPromptConfig | ToolsConfig | ResponseStyleConfig | any;
  description: string | null;
  is_active: boolean;
  version: number;
  updated_by: number | null;
  updatedByUser?: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * Historial de cambios de configuración
 */
export type ChatbotConfigHistory = {
  id: number;
  createdAt: string;
  config_id: number;
  config_key: string;
  previous_value: any;
  new_value: any;
  changed_by: number;
  change_reason: string | null;
  changedByUser?: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * Estructura del System Prompt
 */
export type SystemPromptConfig = {
  template: string;
  variables: {
    currentDate: 'auto' | string;
    userName?: 'optional' | string;
    userContext?: 'optional' | string;
  };
  sections?: {
    temporal_context?: string;
    app_context?: string;
    data_access_rules?: string;
    communication_style?: string;
    restrictions?: string;
  };
  active_sections?: string[];
  active: boolean;
}

/**
 * Estructura de configuración de Tools
 */
export type ToolsConfig = {
  tools: ToolConfig[];
}

export type ToolConfig = {
  name: string;
  is_active: boolean;
  priority: number;
  description?: string;
  executor: string;
  cache_ttl_seconds?: number;
  parameters?: Record<string, any>;
}

/**
 * Estructura de estilo de respuesta
 */
export type ResponseStyleConfig = {
  tone: 'friendly' | 'professional' | 'casual';
  emoji_usage: 'none' | 'minimal' | 'moderate' | 'frequent';
  max_response_length: number;
  bullet_points_preference: boolean;
  contextual_comparisons: boolean;
  language: 'es' | 'en';
}

/**
 * DTO para crear configuración
 */
export type CreateChatbotConfigDto = {
  config_key: string;
  config_value: any;
  description?: string;
  is_active?: boolean;
}

/**
 * DTO para actualizar configuración
 */
export type UpdateChatbotConfigDto = {
  config_value: any;
  change_reason?: string;
}