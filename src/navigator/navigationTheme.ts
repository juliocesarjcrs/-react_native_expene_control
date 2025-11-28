import { DefaultTheme } from "@react-navigation/native";
import { TextStyle } from "react-native";

export const MinimalNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#FFFFFF",
    text: "#111111",
    primary: "#111111",
    card: "#FFFFFF",
    border: "transparent",
  },
};

// Header minimalista - OCULTO por defecto
export const minimalHeaderOptions = {
  headerShown: false, // Ocultamos el header del stack
  headerLargeTitle: false,
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: "600" as TextStyle["fontWeight"],
    color: "#111111",
  } as TextStyle,
  headerStyle: {
    backgroundColor: "#FFFFFF",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
};

// Solo para pantallas que necesiten el header nativo (ej: modales)
export const modalHeaderOptions = {
  ...minimalHeaderOptions,
  headerShown: true,
  presentation: 'modal' as const,
  headerLeft: () => null,
};