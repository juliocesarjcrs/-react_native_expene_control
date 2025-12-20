export type ToggleFeatureDto = {
  isEnabled: boolean;
};

export type FeatureStatusResponse = {
  featureKey: string;
  isEnabled: boolean;
};

export type DeleteFeatureResponse = {
  message: string;
};

export type CreateFeatureDto = {
  featureKey: string;
  featureName: string;
  description?: string;
  isEnabled?: boolean;
  defaultForUsers?: boolean;
  requiresRole?: number | null;
  metadata?: Record<string, any>;
};

export type UpdateFeatureDto = {
  featureName?: string;
  description?: string;
  isEnabled?: boolean;
  defaultForUsers?: boolean;
  requiresRole?: number | null;
  metadata?: Record<string, any>;
};
