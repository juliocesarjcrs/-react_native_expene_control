import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ThemeColors } from '../shared/types/services/theme-config-service.type';
import { ThemeConfig } from '~/shared/types/models/theme-config.type';
import { showError } from '~/utils/showError';
import { getAvailableThemes, getMyTheme } from '~/services/UserThemePreferenceService';
import { UserThemeConfig } from '~/shared/types/services/user-theme-preference-service.type';

type ThemeContextType = {
  userTheme: UserThemeConfig | null;
  colors: ThemeColors;
  loading: boolean;
  refreshTheme: () => Promise<void>;
  themeName: string;
  isCustomTheme: boolean;
  availableThemes: ThemeConfig[];
  loadAvailableThemes: () => Promise<void>;
};

// Colores por defecto (fallback si no se puede cargar desde el backend)
const DEFAULT_COLORS: ThemeColors = {
  PRIMARY: '#9c27b0',
  PRIMARY_BLACK: '#6d1b7b',
  SECONDARY: '#f50057',
  GREEN_BLUE: '#8DE6EF',
  HEADER_GRAY: '#CAD9E3',
  RED: '#ff0000',
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: '#808080',
  LIGHT_GRAY: '#d3d3d3',
  DARK_GRAY: '#424242',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  INFO: '#2196f3',
  ERROR: '#f44336',
  BACKGROUND: '#f5f5f5',
  CARD_BACKGROUND: '#ffffff',
  TEXT_PRIMARY: '#333333',
  TEXT_SECONDARY: '#666666',
  BORDER: '#e0e0e0'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [userTheme, setUserTheme] = useState<UserThemeConfig | null>(null);
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [loading, setLoading] = useState<boolean>(true);
  const [availableThemes, setAvailableThemes] = useState<ThemeConfig[]>([]);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      setLoading(true);
      // Obtener el tema configurado para el usuario actual
      const themeConfig = await getMyTheme();
      setUserTheme(themeConfig);
      setColors(themeConfig.colors);
    } catch (error) {
      showError(error);
      // En caso de error, usar colores por defecto
      setColors(DEFAULT_COLORS);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableThemes = async () => {
    try {
      const themes = await getAvailableThemes();
      setAvailableThemes(themes);
    } catch (error) {
      showError(error);
    }
  };

  const refreshTheme = async () => {
    await loadTheme();
  };

  return (
    <ThemeContext.Provider
      value={{
        userTheme,
        colors,
        loading,
        refreshTheme,
        themeName: userTheme?.themeName || 'default',
        isCustomTheme: userTheme?.isCustom || false,
        availableThemes,
        loadAvailableThemes
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};
