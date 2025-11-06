import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../shared/types/services/theme-config-service.type';

/**
 * Hook simplificado para obtener solo los colores del tema
 * @returns Colores del tema activo
 */
export const useThemeColors = (): ThemeColors => {
  const { colors } = useTheme();
  return colors;
};