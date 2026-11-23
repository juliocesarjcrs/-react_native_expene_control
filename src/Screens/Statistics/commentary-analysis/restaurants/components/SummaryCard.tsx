import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Utils
import { NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';
import { cardStyles } from './cardStyles';

interface SummaryCardProps {
  visits: number;
  totalCost: number;
  restaurants: number;
}

interface KpiProps {
  label: string;
  value: string;
}

function Kpi({ label, value }: KpiProps): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <View style={styles.kpi}>
      <Text style={[styles.value, { color: colors.PRIMARY }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.TEXT_SECONDARY }]}>{label}</Text>
    </View>
  );
}

export function SummaryCard({
  visits,
  totalCost,
  restaurants
}: SummaryCardProps): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <View
      style={[
        cardStyles.card,
        styles.row,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER,
          shadowColor: colors.BLACK
        }
      ]}
    >
      <Kpi label="Visitas" value={String(visits)} />
      <Kpi label="Gasto" value={NumberFormat(Math.round(totalCost))} />
      <Kpi label="Restaurantes" value={String(restaurants)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  kpi: { alignItems: 'center', flex: 1 },
  value: { fontSize: MEDIUM + 4, fontWeight: '700' },
  label: { fontSize: SMALL, marginTop: 4 }
});
