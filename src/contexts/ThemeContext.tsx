import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getActiveTheme } from '../services/themeConfigService';
import { ThemeColors } from '../shared/types/services/theme-config-service.type';
import { Errors } from '../utils/Errors';
import { ThemeConfig } from '~/shared/types/models/theme-config.type';

type ThemeContextType = {
  theme: ThemeConfig | null;
  colors: ThemeColors;
  loading: boolean;
  refreshTheme: () => Promise<void>;
  themeName: string;
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
  BORDER: '#e0e0e0',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      setLoading(true);
      const activeTheme = await getActiveTheme();
      setTheme(activeTheme);
      setColors(activeTheme.colors);
    } catch (error) {
      Errors(error);
      // En caso de error, usar colores por defecto
      setColors(DEFAULT_COLORS);
    } finally {
      setLoading(false);
    }
  };

  const refreshTheme = async () => {
    await loadTheme();
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        loading,
        refreshTheme,
        themeName: theme?.themeName || 'default',
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