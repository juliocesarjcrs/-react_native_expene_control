/**
 * Primitivas de tarjeta para la pantalla de bienes.
 * Ubicación: src/Screens/Statistics/commentary-analysis/asset/components/AssetCard.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

import { useThemeColors } from '~/customHooks/useThemeColors';
import { ThemeColors } from '~/shared/types/services/theme-config-service.type';
import { MEDIUM, SMALL } from '~/styles/fonts';

interface AssetCardProps {
  title: string;
  icon: string;
  accentKey?: keyof ThemeColors;
  children: React.ReactNode;
}

export function AssetCard({ title, icon, accentKey = 'INFO', children }: AssetCardProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <View style={styles.header}>
        <Icon type="material-community" name={icon} size={20} color={colors[accentKey]} />
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

interface AssetRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
  valueColorKey?: keyof ThemeColors;
  hint?: string;
}

export function AssetRow({ label, value, emphasis, valueColorKey, hint }: AssetRowProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.rowWrap}>
      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: emphasis ? colors.TEXT_PRIMARY : colors.TEXT_SECONDARY },
            emphasis && styles.bold
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.value,
            { color: valueColorKey ? colors[valueColorKey] : colors.TEXT_PRIMARY },
            emphasis && styles.bold
          ]}
        >
          {value}
        </Text>
      </View>
      {hint ? <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: MEDIUM, fontWeight: '600' },
  rowWrap: { gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { fontSize: SMALL + 1, flex: 1 },
  value: { fontSize: SMALL + 1, textAlign: 'right' },
  bold: { fontWeight: '700' },
  hint: { fontSize: SMALL - 1 }
});
