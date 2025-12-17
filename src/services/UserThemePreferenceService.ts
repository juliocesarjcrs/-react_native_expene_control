import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig';
import {
  GetAvailableThemesResponse,
  GetMyColorsResponse,
  GetMyPreferenceResponse,
  GetMyThemeResponse,
  ResetThemeResponse,
  SelectThemeDto,
  SetCustomColorsDto,
  ThemeActionResponse,
  UpdateColorsDto,
  UpdateUserThemePreferenceDto
} from '~/shared/types/services/user-theme-preference-service.type';

const PREFIX = 'user-theme';

// ============================================================================
// Endpoints principales de usuario
// ============================================================================

/**
 * GET /user-theme/my-theme
 * Obtener la configuración completa del tema del usuario actual
 * Esta es la función principal que reemplaza getActiveTheme()
 */
export const getMyTheme = async (): Promise<GetMyThemeResponse> => {
  const response: AxiosResponse<GetMyThemeResponse> = await axios.get(`${PREFIX}/my-theme`);
  return response.data;
};

/**
 * GET /user-theme/my-colors
 * Obtener solo los colores del tema del usuario (endpoint ligero)
 * Útil para actualizaciones rápidas sin cargar toda la configuración
 */
export const getMyColors = async (): Promise<GetMyColorsResponse> => {
  const response: AxiosResponse<GetMyColorsResponse> = await axios.get(`${PREFIX}/my-colors`);
  return response.data;
};

/**
 * GET /user-theme/available
 * Listar todos los temas predefinidos disponibles para elegir
 * Usado en el selector de temas para mostrar las opciones
 */
export const getAvailableThemes = async (): Promise<GetAvailableThemesResponse> => {
  const response: AxiosResponse<GetAvailableThemesResponse> = await axios.get(
    `${PREFIX}/available`
  );
  return response.data;
};

/**
 * GET /user-theme/my-preference
 * Obtener las preferencias raw del usuario (sin procesar)
 * Útil para debugging o configuración avanzada
 */
export const getMyPreference = async (): Promise<GetMyPreferenceResponse> => {
  const response: AxiosResponse<GetMyPreferenceResponse> = await axios.get(
    `${PREFIX}/my-preference`
  );
  return response.data;
};

// ============================================================================
// Endpoints de modificación
// ============================================================================

/**
 * POST /user-theme/select-theme
 * Seleccionar un tema predefinido
 * El usuario elige uno de los temas creados por los administradores
 *
 * @param dto - { themeId: number }
 * @returns Mensaje de éxito y configuración del tema aplicado
 */
export const selectTheme = async (dto: SelectThemeDto): Promise<ThemeActionResponse> => {
  const response: AxiosResponse<ThemeActionResponse> = await axios.post(
    `${PREFIX}/select-theme`,
    dto
  );
  return response.data;
};

/**
 * POST /user-theme/custom-colors
 * Establecer colores personalizados completos
 * Reemplaza todos los colores personalizados del usuario
 *
 * @param dto - { customColors: Partial<ThemeColors> }
 * @returns Mensaje de éxito y configuración del tema con los nuevos colores
 */
export const setCustomColors = async (dto: SetCustomColorsDto): Promise<ThemeActionResponse> => {
  const response: AxiosResponse<ThemeActionResponse> = await axios.post(
    `${PREFIX}/custom-colors`,
    dto
  );
  return response.data;
};

/**
 * PUT /user-theme/update-colors
 * Actualizar algunos colores personalizados (merge con existentes)
 * Solo modifica los colores especificados, manteniendo el resto
 *
 * @param dto - { colors: Partial<ThemeColors> }
 * @returns Mensaje de éxito y configuración del tema actualizado
 *
 * @example
 * // Solo cambiar el color primario
 * await updateColors({ colors: { PRIMARY: '#ff0000' } });
 */
export const updateColors = async (dto: UpdateColorsDto): Promise<ThemeActionResponse> => {
  const response: AxiosResponse<ThemeActionResponse> = await axios.put(
    `${PREFIX}/update-colors`,
    dto
  );
  return response.data;
};

/**
 * PUT /user-theme/preference
 * Actualizar preferencias completas del usuario
 * Permite modificar cualquier aspecto de las preferencias
 *
 * @param dto - { themeId?, customColors?, useCustomColors? }
 * @returns Mensaje de éxito y configuración del tema actualizado
 */
export const updatePreference = async (
  dto: UpdateUserThemePreferenceDto
): Promise<ThemeActionResponse> => {
  const response: AxiosResponse<ThemeActionResponse> = await axios.put(`${PREFIX}/preference`, dto);
  return response.data;
};

/**
 * DELETE /user-theme/reset
 * Resetear al tema global (eliminar todas las preferencias personales)
 * El usuario volverá a usar el tema activo global configurado por admin
 *
 * @returns Mensaje de éxito y configuración del tema global aplicado
 */
export const resetThemeToGlobal = async (): Promise<ResetThemeResponse> => {
  const response: AxiosResponse<ResetThemeResponse> = await axios.delete(`${PREFIX}/reset`);
  return response.data;
};

// ============================================================================
// Funciones de conveniencia (wrappers)
// ============================================================================

/**
 * Seleccionar un tema por ID de forma directa
 * Wrapper simplificado de selectTheme()
 *
 * @param themeId - ID del tema a seleccionar
 */
export const selectThemeById = async (themeId: number): Promise<ThemeActionResponse> => {
  return selectTheme({ themeId });
};

/**
 * Actualizar un solo color del tema
 * Wrapper para casos donde solo se necesita cambiar un color
 *
 * @param colorKey - Nombre del color (ej: 'PRIMARY')
 * @param colorValue - Valor hexadecimal del color (ej: '#ff0000')
 */
export const updateSingleColor = async (
  colorKey: keyof GetMyColorsResponse,
  colorValue: string
): Promise<ThemeActionResponse> => {
  return updateColors({ colors: { [colorKey]: colorValue } });
};

/**
 * Verificar si el usuario tiene preferencias personalizadas
 * Útil para mostrar badges o indicadores de personalización
 *
 * @returns true si el usuario tiene preferencias, false si usa tema global
 */
export const hasCustomPreferences = async (): Promise<boolean> => {
  const preference = await getMyPreference();
  return preference !== null;
};

/**
 * Verificar si el usuario está usando colores personalizados
 *
 * @returns true si usa colores custom, false si usa tema predefinido
 */
export const isUsingCustomColors = async (): Promise<boolean> => {
  const theme = await getMyTheme();
  return theme.isCustom;
};

// ============================================================================
// Exports por defecto (para imports nombrados o default)
// ============================================================================

export default {
  // Principales
  getMyTheme,
  getMyColors,
  getAvailableThemes,
  getMyPreference,

  // Modificación
  selectTheme,
  setCustomColors,
  updateColors,
  updatePreference,
  resetThemeToGlobal,

  // Conveniencia
  selectThemeById,
  updateSingleColor,
  hasCustomPreferences,
  isUsingCustomColors
};
