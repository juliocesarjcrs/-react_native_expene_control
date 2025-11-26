export type AIModel = {
  id: number;
  provider_type: 'openrouter' | 'openai' | 'custom';
  model_name: string;
  api_endpoint: string;
  api_key_ref: string;
  priority: number;
  is_active: boolean;
  max_tokens: number;
  temperature: number;
  supports_tools: boolean;
  last_tested_at: string | null;
  health_score: number;
  error_count: number;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

export type ModelInfoModel = {
  id: number;
  name: string;
  provider: string;
  maxTokens: number;
  supportsTools: boolean;
};

export type HealthStatusModel = {
  isHealthy: boolean;
  responseTime: number;
  errorCount: number;
  healthScore: number;
  lastTestedAt: string;
};