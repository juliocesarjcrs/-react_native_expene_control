/**
 * DestinationSummaryCard — Resumen de gastos agrupados por destino
 * Ubicación: src/Screens/Statistics/commentary-analysis/vacation/components/DestinationSummaryCard.tsx
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import { VacationDestinationSummary } from '~/shared/types/utils/commentaryParser/vacation-analysis.types';

// Utils
import { NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface DestinationSummaryCardProps {
  summaries: VacationDestinationSummary[];
  totalCost: number;
}

export default function DestinationSummaryCard({
  summaries,
  totalCost
}: DestinationSummaryCardProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (summaries.length === 0) return null;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <View style={styles.header}>
        <Icon
          type="material-community"
          name="map-marker-multiple"
          size={20}
          color={colors.SUCCESS}
        />
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>Total por destino</Text>
      </View>

      {/* Total general */}
      <View style={[styles.totalRow, { borderBottomColor: colors.BORDER }]}>
        <Text style={[styles.totalLabel, { color: colors.TEXT_SECONDARY }]}>Total período</Text>
        <Text style={[styles.totalValue, { color: colors.TEXT_PRIMARY }]}>
          {NumberFormat(totalCost)}
        </Text>
      </View>

      {summaries.map((summary) => {
        const isExpanded = expanded === summary.destination;
        const percent = totalCost > 0 ? Math.round((summary.totalCost / totalCost) * 100) : 0;

        return (
          <View key={summary.destination}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setExpanded(isExpanded ? null : summary.destination)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.SUCCESS + '15' }]}>
                  <Icon
                    type="material-community"
                    name="map-marker"
                    size={16}
                    color={colors.SUCCESS}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.destination, { color: colors.TEXT_PRIMARY }]}>
                    {summary.destination}
                  </Text>
                  <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
                    {[
                      summary.lodgingCount > 0 &&
                        `${summary.lodgingCount} alojamiento${summary.lodgingCount > 1 ? 's' : ''}`,
                      summary.flightCount > 0 &&
                        `${summary.flightCount} tiquete${summary.flightCount > 1 ? 's' : ''}`,
                      summary.expenseCount > 0 &&
                        `${summary.expenseCount} gasto${summary.expenseCount > 1 ? 's' : ''}`
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.cost, { color: colors.TEXT_PRIMARY }]}>
                  {NumberFormat(summary.totalCost)}
                </Text>
                <View style={styles.rowRightBottom}>
                  <Text style={[styles.percent, { color: colors.TEXT_SECONDARY }]}>{percent}%</Text>
                  <Icon
                    type="material-community"
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.TEXT_SECONDARY}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {/* Desglose expandible por tipo y categoría */}
            {isExpanded && (
              <View
                style={[
                  styles.breakdown,
                  { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER }
                ]}
              >
                {summary.lodgingCost > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.TEXT_SECONDARY }]}>
                      🛏 Alojamiento
                    </Text>
                    <Text style={[styles.breakdownValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(summary.lodgingCost)}
                    </Text>
                  </View>
                )}
                {summary.flightCost > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.TEXT_SECONDARY }]}>
                      ✈️ Tiquetes
                    </Text>
                    <Text style={[styles.breakdownValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(summary.flightCost)}
                    </Text>
                  </View>
                )}
                {summary.expenseByCategory.comida > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.TEXT_SECONDARY }]}>
                      🍽 Comida
                    </Text>
                    <Text style={[styles.breakdownValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(summary.expenseByCategory.comida)}
                    </Text>
                  </View>
                )}
                {summary.expenseByCategory.transporte > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.TEXT_SECONDARY }]}>
                      🚌 Transporte
                    </Text>
                    <Text style={[styles.breakdownValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(summary.expenseByCategory.transporte)}
                    </Text>
                  </View>
                )}
                {summary.expenseByCategory.atraccion > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.TEXT_SECONDARY }]}>
                      🎡 Atracciones
                    </Text>
                    <Text style={[styles.breakdownValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(summary.expenseByCategory.atraccion)}
                    </Text>
                  </View>
                )}
                {summary.expenseByCategory.otro > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.TEXT_SECONDARY }]}>
                      📦 Otros
                    </Text>
                    <Text style={[styles.breakdownValue, { color: colors.TEXT_PRIMARY }]}>
                      {NumberFormat(summary.expenseByCategory.otro)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: MEDIUM, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1
  },
  totalLabel: { fontSize: SMALL },
  totalValue: { fontSize: MEDIUM, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowText: { flex: 1 },
  destination: { fontSize: SMALL + 1, fontWeight: '500' },
  detail: { fontSize: SMALL - 1, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowRightBottom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cost: { fontSize: SMALL + 1, fontWeight: '600' },
  percent: { fontSize: SMALL - 1 },
  breakdown: {
    marginLeft: 42,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 6
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: SMALL },
  breakdownValue: { fontSize: SMALL, fontWeight: '600' }
});
