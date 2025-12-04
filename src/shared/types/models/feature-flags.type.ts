export type FeatureFlag = {
  id: number;
  featureKey: string;
  featureName: string;
  description: string | null;
  isEnabled: number;
  requiresRole: number | null;
  metadata: Record<string, any> | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
};
