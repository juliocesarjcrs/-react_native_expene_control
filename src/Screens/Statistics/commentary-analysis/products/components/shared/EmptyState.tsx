import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  hint?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, hint }) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Icon type="material-community" name={icon} size={48} color={colors.TEXT_SECONDARY} />
      <Text style={[styles.title, { color: colors.TEXT_SECONDARY }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.TEXT_SECONDARY }]}>{message}</Text>
      {hint && <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12
  },
  title: {
    fontSize: SMALL + 1,
    fontWeight: '600',
    textAlign: 'center'
  },
  message: {
    fontSize: SMALL,
    textAlign: 'center'
  },
  hint: {
    fontSize: SMALL - 1,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    lineHeight: 20
  }
});
