import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { FeatureFlag } from '~/shared/types/models/feature-flags.type';
import {
  getMyFeatures,
  canAccessFeature as canAccessFeatureAPI
} from '~/services/featureFlagsService';
import { showError } from '~/utils/showError';

// ============================================
// TYPES
// ============================================

interface FeatureFlagsContextType {
  features: FeatureFlag[];
  loading: boolean;
  isFeatureEnabled: (key: string) => boolean;
  canAccessFeature: (key: string) => Promise<boolean>;
  refreshFeatures: () => Promise<void>;
}

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

// ============================================
// CONTEXT
// ============================================

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  /**
   * Cargar features accesibles para el usuario actual
   * Obtiene SOLO las features que el usuario puede usar según sus permisos
   */
  const loadFeatures = async () => {
    try {
      setLoading(true);
      const data = await getMyFeatures();
      setFeatures(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verificación local rápida (usa features cargadas en memoria)
   * ✅ Usa esto en la mayoría de casos (rápido, sin red)
   *
   * @param key - Feature key (ej: 'chatbot', 'invoice_scanner')
   * @returns true si la feature está habilitada y el usuario tiene acceso
   */
  const isFeatureEnabled = (key: string): boolean => {
    const feature = features.find((f) => f.featureKey === key);
    return feature ? feature.isEnabled === 1 : false;
  };

  /**
   * Verificación en servidor (hace request al backend)
   * ⚠️ Usa esto solo cuando necesites verificación en tiempo real
   *
   * @param key - Feature key (ej: 'chatbot', 'invoice_scanner')
   * @returns Promise<boolean> - true si el usuario puede acceder
   */
  const canAccessFeature = async (key: string): Promise<boolean> => {
    try {
      const result = await canAccessFeatureAPI(key);
      return result.canAccess;
    } catch (error) {
      showError(error);
      return false;
    }
  };

  /**
   * Refrescar features desde el servidor
   * Útil después de cambios de permisos
   */
  const refreshFeatures = async () => {
    await loadFeatures();
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        features,
        loading,
        isFeatureEnabled,
        canAccessFeature,
        refreshFeatures
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// ============================================
// HOOKS
// ============================================

/**
 * Hook principal para acceder al contexto completo
 *
 * @example
 * const { features, isFeatureEnabled, refreshFeatures } = useFeatureFlags();
 */
export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags debe usarse dentro de FeatureFlagsProvider');
  }
  return context;
};

/**
 * Hook simplificado para verificar UNA feature específica
 * ✅ Usa este hook en la mayoría de casos
 *
 * @param featureKey - Key de la feature (ej: 'chatbot', 'invoice_scanner')
 * @returns Objeto con { isEnabled, loading, feature }
 *
 * @example
 * const { isEnabled, loading } = useFeatureFlag('chatbot');
 * if (isEnabled) {
 *   return <ChatbotButton />;
 * }
 */
export const useFeatureFlag = (featureKey: string) => {
  const { features, loading, isFeatureEnabled } = useFeatureFlags();

  return {
    isEnabled: isFeatureEnabled(featureKey),
    loading,
    feature: features.find((f) => f.featureKey === featureKey)
  };
};

// ============================================
// EXPORT DEL CONTEXT (para casos avanzados)
// ============================================

export { FeatureFlagsContext };
