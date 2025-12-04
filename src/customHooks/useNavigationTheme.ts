import { DefaultTheme } from '@react-navigation/native';
import { useThemeColors } from './useThemeColors';

export const useNavigationTheme = () => {
  const colors = useThemeColors();

  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.BACKGROUND,
      text: colors.TEXT_PRIMARY,
      primary: colors.PRIMARY,
      card: colors.CARD_BACKGROUND,
      border: colors.BORDER,
      notification: colors.ERROR
    }
  };
};
