import { ThemeConfig } from "../models/theme-config.type";

export type ThemeColors = {
  PRIMARY: string;
  PRIMARY_BLACK: string;
  SECONDARY: string;
  GREEN_BLUE: string;
  HEADER_GRAY: string;
  RED: string;
  WHITE: string;
  BLACK: string;
  GRAY: string;
  LIGHT_GRAY: string;
  DARK_GRAY: string;
  SUCCESS: string;
  WARNING: string;
  INFO: string;
  ERROR: string;
  BACKGROUND: string;
  CARD_BACKGROUND: string;
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  BORDER: string;
};


export type CreateThemeDto = {
  themeName: string;
  colors: ThemeColors;
  isActive?: boolean;
};

export type UpdateThemeDto = {
  themeName?: string;
  colors?: Partial<ThemeColors>;
  isActive?: boolean;
};

export type ActivateThemeDto = {
  themeName: string;
};

export type UpdateColorsDto = {
  colors: Partial<ThemeColors>;
};

export type DeleteThemeResponse = {
  message: string;
};

// Response types
export type GetActiveThemeResponse = ThemeConfig;
export type GetActiveColorsResponse = ThemeColors;
export type GetAllThemesResponse = ThemeConfig[];
export type GetThemeByNameResponse = ThemeConfig;