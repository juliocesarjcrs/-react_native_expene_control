import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubcategoryTemplateConfig } from '~/shared/types/screens/settings/commentary-templates.types';
import { getDefaultTemplateConfig } from './commentaryTemplates.utils';

const TEMPLATE_KEY_PREFIX = 'template_config_';

// ============================================================
// HELPERS
// ============================================================

const buildKey = (subcategoryId: number): string => `${TEMPLATE_KEY_PREFIX}${subcategoryId}`;

// ============================================================
// LECTURA
// ============================================================

/**
 * Obtiene la configuración de plantilla para una subcategoría.
 * Orden de prioridad:
 *   1. Configuración personalizada guardada por el usuario (AsyncStorage)
 *   2. Configuración por defecto basada en el nombre de subcategoría
 */
export const getTemplateConfig = async (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): Promise<SubcategoryTemplateConfig> => {
  try {
    const raw = await AsyncStorage.getItem(buildKey(subcategoryId));
    if (raw) {
      const parsed: SubcategoryTemplateConfig = JSON.parse(raw);
      return parsed;
    }
  } catch {
    // Fallback a defaults si el JSON está corrupto
  }

  return getDefaultTemplateConfig(subcategoryId, subcategoryName, categoryName);
};

/**
 * Obtiene TODAS las configuraciones personalizadas guardadas.
 * Útil para la pantalla de gestión de plantillas.
 */
export const getAllCustomizedTemplates = async (): Promise<SubcategoryTemplateConfig[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const templateKeys = allKeys.filter((k) => k.startsWith(TEMPLATE_KEY_PREFIX));

    if (templateKeys.length === 0) return [];

    const pairs = await AsyncStorage.multiGet(templateKeys);
    return pairs
      .map(([, value]) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as SubcategoryTemplateConfig;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as SubcategoryTemplateConfig[];
  } catch {
    return [];
  }
};

// ============================================================
// ESCRITURA
// ============================================================

/**
 * Guarda una configuración personalizada de plantilla.
 * Marca isCustomized = true y actualiza updatedAt.
 */
export const saveTemplateConfig = async (config: SubcategoryTemplateConfig): Promise<void> => {
  const toSave: SubcategoryTemplateConfig = {
    ...config,
    isCustomized: true,
    updatedAt: new Date().toISOString()
  };
  await AsyncStorage.setItem(buildKey(config.subcategoryId), JSON.stringify(toSave));
};

/**
 * Restaura la configuración por defecto de una subcategoría
 * eliminando la personalización guardada.
 */
export const resetTemplateConfig = async (subcategoryId: number): Promise<void> => {
  await AsyncStorage.removeItem(buildKey(subcategoryId));
};
