import { ThemeColors } from '../services/theme-config-service.type';

export type ThemeConfig = {
  id: number;
  themeName: string;
  isActive: number;
  colors: ThemeColors;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
};
