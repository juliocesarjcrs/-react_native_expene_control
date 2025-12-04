import { StyleSheet, Platform, StatusBar } from 'react-native';
import { SPACING } from '~/constants/spacing';

export const commonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },

  screenContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg
  },

  screenContentWithPadding: {
    flex: 1,
    padding: SPACING.lg
  }
});
