import { ThemeColors } from '../services/theme-config-service.type';
import { ThemeConfig } from './theme-config.type';

/**
 * Preferencias de tema del usuario (raw de BD)
 */
export type UserThemePreference = {
  id: number;
  userId: number;
  themeId: number | null;
  customColors: ThemeColors | null;
  useCustomColors: boolean;
  createdAt: Date;
  updatedAt: Date;
  theme?: ThemeConfig; // Relación con tema predefinido
};
