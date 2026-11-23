import { StyleSheet } from 'react-native';

/** Card estándar de la app (los colores los pone cada componente con useThemeColors). */
export const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  }
});
