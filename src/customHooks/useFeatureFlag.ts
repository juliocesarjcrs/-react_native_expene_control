import { useFeatureFlags } from '../contexts/FeatureFlagsContext';

/**
 * Hook para verificar si una feature está habilitada
 * @param featureKey - Key de la feature (ej: 'chatbot', 'reports')
 * @returns Objeto con isEnabled y loading
 */
export const useFeatureFlag = (featureKey: string) => {
  const { features, loading, isFeatureEnabled } = useFeatureFlags();

  return {
    isEnabled: isFeatureEnabled(featureKey),
    loading,
    feature: features.find((f) => f.featureKey === featureKey)
  };
};
