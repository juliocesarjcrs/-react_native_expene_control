import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig';
import {
  GetActiveThemeResponse,
  GetActiveColorsResponse,
  GetAllThemesResponse,
  GetThemeByNameResponse,
  CreateThemeDto,
  UpdateThemeDto,
  ActivateThemeDto,
  UpdateColorsDto,
  DeleteThemeResponse,
} from '~/shared/types/services/theme-config-service.type';
import { ThemeConfig } from '~/shared/types/models/theme-config.type';

const PREFIX = 'theme-config';

// ============================================
// ENDPOINTS PÚBLICOS (sin autenticación)
// ============================================

/**
 * Obtener el tema activo completo (público)
 */
export const getActiveTheme = async (): Promise<GetActiveThemeResponse> => {
  const response: AxiosResponse<GetActiveThemeResponse> = await axios.get(`${PREFIX}/active`);
  return response.data;
};

/**
 * Obtener solo los colores del tema activo (público, ligero)
 */
export const getActiveColors = async (): Promise<GetActiveColorsResponse> => {
  const response: AxiosResponse<GetActiveColorsResponse> = await axios.get(`${PREFIX}/active/colors`);
  return response.data;
};

// ============================================
// ENDPOINTS AUTENTICADOS
// ============================================

/**
 * Obtener todos los temas (requiere auth)
 */
export const getAllThemes = async (): Promise<GetAllThemesResponse> => {
  const response: AxiosResponse<GetAllThemesResponse> = await axios.get(`${PREFIX}`);
  return response.data;
};

/**
 * Obtener un tema específico por nombre
 */
export const getThemeByName = async (themeName: string): Promise<GetThemeByNameResponse> => {
  const response: AxiosResponse<GetThemeByNameResponse> = await axios.get(`${PREFIX}/${themeName}`);
  return response.data;
};

// ============================================
// ENDPOINTS SOLO ADMIN
// ============================================

/**
 * Crear un nuevo tema (solo admin)
 */
export const createTheme = async (createData: CreateThemeDto): Promise<ThemeConfig> => {
  const response: AxiosResponse<ThemeConfig> = await axios.post(`${PREFIX}`, createData);
  return response.data;
};

/**
 * Actualizar un tema completo (solo admin)
 */
export const updateTheme = async (themeName: string, updateData: UpdateThemeDto): Promise<ThemeConfig> => {
  const response: AxiosResponse<ThemeConfig> = await axios.put(`${PREFIX}/${themeName}`, updateData);
  return response.data;
};

/**
 * Actualizar solo los colores de un tema (solo admin)
 */
export const updateThemeColors = async (
  themeName: string,
  updateColorsData: UpdateColorsDto
): Promise<ThemeConfig> => {
  const response: AxiosResponse<ThemeConfig> = await axios.put(
    `${PREFIX}/${themeName}/colors`,
    updateColorsData
  );
  return response.data;
};

/**
 * Activar un tema (solo admin)
 */
export const activateTheme = async (activateData: ActivateThemeDto): Promise<ThemeConfig> => {
  const response: AxiosResponse<ThemeConfig> = await axios.put(`${PREFIX}/activate`, activateData);
  return response.data;
};

/**
 * Eliminar un tema (solo admin)
 */
export const deleteTheme = async (themeName: string): Promise<DeleteThemeResponse> => {
  const response: AxiosResponse<DeleteThemeResponse> = await axios.delete(`${PREFIX}/${themeName}`);
  return response.data;
};