import { DefaultTheme } from '@react-navigation/native';
import { TextStyle } from 'react-native';

// Theme por defecto (fallback)
export const MinimalNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
    text: '#111111',
    primary: '#111111',
    card: '#FFFFFF',
    border: 'transparent'
  }
};

// Header minimalista - OCULTO por defecto
export const minimalHeaderOptions = {
  headerShown: false,
  headerLargeTitle: false,
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight']
  } as TextStyle,
  headerStyle: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0
  }
};

export const modalHeaderOptions = {
  ...minimalHeaderOptions,
  headerShown: true,
  presentation: 'modal' as const,
  headerLeft: () => null
};
