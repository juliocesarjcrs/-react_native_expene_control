import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEDIUM, SMALL } from '~/styles/fonts';

interface SectionHeaderProps {
  title: string;
  count?: number;
  icon?: string;
  iconColor?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, count, icon, iconColor }) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {icon && (
        <Icon
          type="material-community"
          name={icon}
          size={16}
          color={iconColor || colors.TEXT_PRIMARY}
        />
      )}
      <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>{title}</Text>
      {count !== undefined && (
        <Text style={[styles.count, { color: colors.TEXT_SECONDARY }]}>{count}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginTop: 8
  },
  title: {
    fontSize: MEDIUM,
    fontWeight: '600',
    flex: 1
  },
  count: {
    fontSize: SMALL - 1,
    fontWeight: '600'
  }
});
