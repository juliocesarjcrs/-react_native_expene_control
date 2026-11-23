import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Types
import { MonthlySummary } from '~/utils/commentaryParser/restaurantAnalysis';

// Utils
import { NumberFormat } from '~/utils/Helpers';
import { formatSignedPercent, pluralize } from '../utils/formatters';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';
import { cardStyles } from './cardStyles';

interface MonthCardProps {
  month: MonthlySummary;
}

export function MonthCard({ month }: MonthCardProps): React.JSX.Element {
  const colors = useThemeColors();
  const { changePercent, daysChange } = month;

  // Gastar más es lo malo: sube en rojo, baja en verde
  const changeColor =
    changePercent === null || changePercent === 0
      ? colors.TEXT_SECONDARY
      : changePercent > 0
        ? colors.ERROR
        : colors.SUCCESS;

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
      <View style={styles.main}>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
          {month.label}
          {month.isPartial ? ' (parcial)' : ''}
        </Text>
        <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
          {month.days} {pluralize(month.days, 'día', 'días')} · {month.visits}{' '}
          {pluralize(month.visits, 'registro', 'registros')}
        </Text>
        <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
          {NumberFormat(Math.round(month.total))}
          {month.days > 0 ? ` · ${NumberFormat(month.avgPerDay)} por día` : ''}
        </Text>
      </View>

      {changePercent !== null && (
        <View style={styles.change}>
          <Text style={[styles.changeValue, { color: changeColor }]}>
            {formatSignedPercent(changePercent)}
          </Text>
          {daysChange !== null && (
            <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
              {daysChange > 0 ? '+' : ''}
              {daysChange} {pluralize(Math.abs(daysChange), 'día', 'días')}
            </Text>
          )}
          <Text style={[styles.caption, { color: colors.TEXT_SECONDARY }]}>vs mes anterior</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  main: { flex: 1 },
  title: { fontSize: MEDIUM, fontWeight: '600', marginBottom: 4 },
  detail: { fontSize: SMALL, lineHeight: 20 },
  change: { alignItems: 'flex-end', marginLeft: 12 },
  changeValue: { fontSize: MEDIUM, fontWeight: '700' },
  caption: { fontSize: SMALL - 1, marginTop: 4 }
});
