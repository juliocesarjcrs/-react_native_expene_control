import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { FeatureFlag } from '~/shared/types/models/feature-flags.type';
import { getEnabledFeatures } from '~/services/featureFlagsService';
import { showError } from '~/utils/showError';

interface FeatureFlagsContextType {
  features: FeatureFlag[];
  loading: boolean;
  isFeatureEnabled: (key: string) => boolean;
  refreshFeatures: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const data = await getEnabledFeatures();
      setFeatures(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const isFeatureEnabled = (key: string): boolean => {
    const feature = features.find((f) => f.featureKey === key);
    return feature ? feature.isEnabled === 1 : false;
  };

  const refreshFeatures = async () => {
    await loadFeatures();
  };

  return (
    <FeatureFlagsContext.Provider value={{ features, loading, isFeatureEnabled, refreshFeatures }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags debe usarse dentro de FeatureFlagsProvider');
  }
  return context;
};