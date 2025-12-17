import { ThemeConfig } from '../models/theme-config.type';
import { ThemeColors } from './theme-config-service.type';

/**
 * Configuración efectiva del tema para un usuario específico
 */
export type UserThemeConfig = {
  userId: number;
  themeName: string;
  colors: ThemeColors;
  isCustom: boolean;
  themeId: number | null;
};

/**
 * Preferencias de tema del usuario (raw de BD)
 */
export type UserThemePreference = {
  id: number;
  userId: number;
  themeId: number | null;
  customColors: ThemeColors | null;
  useCustomColors: boolean;
  createdAt: string;
  updatedAt: string;
  theme?: ThemeConfig;
};

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * DTO para seleccionar un tema predefinido
 */
export type SelectThemeDto = {
  themeId: number;
};

/**
 * DTO para establecer colores personalizados completos
 */
export type SetCustomColorsDto = {
  customColors: Partial<ThemeColors>;
};

/**
 * DTO para actualizar colores personalizados (merge)
 */
export type UpdateColorsDto = {
  colors: Partial<ThemeColors>;
};

/**
 * DTO para actualizar preferencias completas
 */
export type UpdateUserThemePreferenceDto = {
  themeId?: number;
  customColors?: Partial<ThemeColors>;
  useCustomColors?: boolean;
};

// ============================================================================
// Response Types
// ============================================================================

/**
 * Respuesta al obtener el tema del usuario
 */
export type GetMyThemeResponse = UserThemeConfig;

/**
 * Respuesta al obtener solo los colores
 */
export type GetMyColorsResponse = ThemeColors;

/**
 * Respuesta al obtener temas disponibles
 */
export type GetAvailableThemesResponse = ThemeConfig[];

/**
 * Respuesta al obtener las preferencias raw del usuario
 */
export type GetMyPreferenceResponse = UserThemePreference | null;

/**
 * Respuesta genérica con mensaje y tema actualizado
 */
export type ThemeActionResponse = {
  message: string;
  theme: UserThemeConfig;
};

/**
 * Respuesta al resetear tema
 */
export type ResetThemeResponse = {
  message: string;
  theme: UserThemeConfig;
};

// ============================================================================
// Legacy Types (para compatibilidad con tema global)
// ============================================================================

/**
 * @deprecated Usar GetMyThemeResponse en su lugar
 * Respuesta al obtener el tema activo global
 */
export type GetActiveThemeResponse = ThemeConfig;

/**
 * @deprecated Usar GetMyColorsResponse en su lugar
 * Respuesta al obtener colores del tema activo global
 */
export type GetActiveColorsResponse = ThemeColors;
