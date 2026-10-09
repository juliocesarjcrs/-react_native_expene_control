import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';
import dayjs from 'dayjs';

// Utils
import { DateFormat, NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface SummaryCardProps {
  total: number;
  monthlyAverage: number;
  months: number;
  startDate: string;
  endDate: string;
  /** Describe los filtros activos (ej: "Tipo de gasto: Operativo") */
  filterText: string;
}

interface InfoLineProps {
  icon: string;
  text: string;
}

const InfoLine = ({ icon, text }: InfoLineProps) => {
  const colors = useThemeColors();

  return (
    <View style={styles.infoLine}>
      <Icon type="material-community" name={icon} size={16} color={colors.INFO} />
      <Text style={[styles.infoText, { color: colors.TEXT_SECONDARY }]}>{text}</Text>
    </View>
  );
};

export default function SummaryCard({
  total,
  monthlyAverage,
  months,
  startDate,
  endDate,
  filterText
}: SummaryCardProps) {
  const colors = useThemeColors();
  const periodText = `${DateFormat(dayjs(startDate).toDate(), 'MMM YYYY')} - ${DateFormat(
    dayjs(endDate).toDate(),
    'MMM YYYY'
  )}`;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <View style={styles.infoLines}>
        <InfoLine
          icon="calendar-range"
          text={`${months} ${months === 1 ? 'mes' : 'meses'} (${periodText})`}
        />
        <InfoLine icon="filter-variant" text={filterText} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Total</Text>
          <Text style={[styles.statValue, { color: colors.PRIMARY }]}>
            {NumberFormat(Math.round(total))}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Promedio mensual</Text>
          <Text style={[styles.statValue, { color: colors.PRIMARY }]}>
            {NumberFormat(Math.round(monthlyAverage))}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  infoLines: {
    gap: 8,
    marginBottom: 12
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  infoText: {
    fontSize: SMALL,
    fontWeight: '500',
    flex: 1
  },
  statsRow: {
    flexDirection: 'row'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: SMALL - 1,
    fontWeight: '600',
    marginBottom: 4
  },
  statValue: {
    fontSize: MEDIUM + 4,
    fontWeight: '700'
  },
  divider: {
    width: 1,
    marginHorizontal: 16
  }
});
