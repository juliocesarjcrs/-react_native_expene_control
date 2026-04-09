import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubcategoryTemplateConfig } from '~/shared/types/screens/settings/commentary-templates.types';
import { getDefaultTemplateConfig } from './commentaryTemplates.utils';

const TEMPLATE_KEY_PREFIX = 'template_config_';

// ============================================================
// VERSIONADO DE CACHE
//
// Incrementar CONFIG_VERSION cuando se cambie la estructura
// de chips o parserType de alguna subcategoría.
// Cualquier config guardada con versión anterior se descarta
// y se regenera desde getDefaultTemplateConfig.
//
// Historial:
//   v1 — inicial (sin versión)
//   v2 — copago estructurado, vacaciones, fix isMortgage/isCopago
// ============================================================

const CONFIG_VERSION = 2;

// ============================================================
// HELPERS
// ============================================================

const buildKey = (subcategoryId: number): string => `${TEMPLATE_KEY_PREFIX}${subcategoryId}`;

/**
 * Verifica si una config guardada sigue siendo válida.
 * Retorna false si:
 *   - No tiene configVersion (es antigua)
 *   - Su configVersion es menor a la actual
 *   - Sus chips están vacíos pero el parserType no es 'none' ni 'custom'
 *     (indica que se guardó antes de que se definieran los chips)
 */
const isConfigStale = (config: SubcategoryTemplateConfig & { configVersion?: number }): boolean => {
  // Sin versión → es cache vieja pre-versionado
  if (!config.configVersion || config.configVersion < CONFIG_VERSION) return true;

  // Chips vacíos en subcategoría que debería tenerlos
  const shouldHaveChips = ['utility', 'product', 'retention', 'copago', 'vacation'].includes(
    config.parserType
  );
  if (shouldHaveChips && config.chips.length === 0) return true;

  return false;
};

// ============================================================
// LECTURA
// ============================================================

/**
 * Obtiene la configuración de plantilla para una subcategoría.
 * Orden de prioridad:
 *   1. Configuración personalizada guardada por el usuario (isCustomized: true)
 *      — solo si su configVersion está actualizada
 *   2. Configuración por defecto basada en el nombre de subcategoría
 *
 * Si la config guardada es stale (versión antigua), se descarta
 * automáticamente y se reescribe con el default actualizado.
 */
export const getTemplateConfig = async (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): Promise<SubcategoryTemplateConfig> => {
  try {
    const raw = await AsyncStorage.getItem(buildKey(subcategoryId));

    if (raw) {
      const parsed = JSON.parse(raw) as SubcategoryTemplateConfig & { configVersion?: number };

      if (isConfigStale(parsed)) {
        // Config obsoleta — regenerar desde default y persistir versión actualizada
        const fresh = getDefaultTemplateConfig(subcategoryId, subcategoryName, categoryName);
        const toSave = {
          ...fresh,
          // Conservar personalización del usuario si la había marcado así
          isCustomized: parsed.isCustomized ?? false,
          configVersion: CONFIG_VERSION,
        };
        // No await — persistir en background para no bloquear el render
        AsyncStorage.setItem(buildKey(subcategoryId), JSON.stringify(toSave)).catch(() => {});
        return fresh;
      }

      // Config vigente y válida — retornar tal cual
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
 * Siempre incluye configVersion actualizada.
 */
export const saveTemplateConfig = async (config: SubcategoryTemplateConfig): Promise<void> => {
  const toSave = {
    ...config,
    isCustomized: true,
    configVersion: CONFIG_VERSION,
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

/**
 * Limpia TODAS las configs guardadas — útil para debug o migración forzada.
 * No afecta el historial de comentarios.
 */
export const clearAllTemplateConfigs = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const templateKeys = allKeys.filter((k) => k.startsWith(TEMPLATE_KEY_PREFIX));
    if (templateKeys.length > 0) {
      await AsyncStorage.multiRemove(templateKeys);
    }
  } catch {
    // silenciar errores
  }
};