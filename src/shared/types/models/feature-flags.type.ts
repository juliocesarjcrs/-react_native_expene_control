export type FeatureFlag = {
  id: number;
  featureKey: string;
  featureName: string;
  description: string | null;
  isEnabled: number;
  requiresRole: number | null;
  defaultForUsers: number;
  metadata: Record<string, any> | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export type  UserFeaturePermission = {
  id: number;
  userId: number;
  featureKey: string;
  isAllowed: number;
  grantedBy: number | null;
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  feature?: FeatureFlag;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}