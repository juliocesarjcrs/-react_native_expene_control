import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { useTheme } from '~/contexts/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, rightComponent }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.CARD_BACKGROUND }]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.rightContainer}>{rightComponent}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 20,
    paddingBottom: 16
  },
  textContainer: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 4
  },
  rightContainer: {
    marginLeft: 12
  }
});
