import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

interface InfoBoxProps {
  icon?: string;
  text: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  compact?: boolean;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  icon = 'information',
  text,
  type = 'info',
  compact = false
}) => {
  const colors = useThemeColors();

  const colorMap = {
    info: colors.INFO,
    warning: colors.WARNING,
    success: colors.SUCCESS,
    error: colors.ERROR
  };

  const color = colorMap[type];

  return (
    <View style={[styles.container, compact && styles.compact, { backgroundColor: color + '15' }]}>
      <Icon type="material-community" name={icon} size={16} color={color} />
      <Text style={[styles.text, { color: colors.TEXT_PRIMARY }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  compact: {
    paddingVertical: 8,
    marginBottom: 10
  },
  text: {
    flex: 1,
    fontSize: SMALL,
    lineHeight: 18
  }
});
