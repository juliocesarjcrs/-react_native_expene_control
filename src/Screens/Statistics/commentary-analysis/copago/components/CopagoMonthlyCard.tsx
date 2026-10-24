/**
 * CopagoMonthlyCard — Gasto por mes, separado por paciente
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/components/CopagoMonthlyCard.tsx
 *
 * Una fila por mes con una barra apilada (un color por paciente). El largo de la
 * barra es proporcional al mes más caro del rango. Los meses sin gasto aparecen
 * como hueco. Siempre muestra el nombre de cada paciente en la leyenda.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import { CopagoMonthlySpending } from '~/shared/types/utils/commentaryParser/copago-analysis.types';

// Utils
import { NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface CopagoMonthlyCardProps {
  months: CopagoMonthlySpending[];
}

export default function CopagoMonthlyCard({ months }: CopagoMonthlyCardProps) {
  const colors = useThemeColors();

  if (months.length === 0) return null;

  // Pacientes ordenados por gasto total: el que más gasta toma el primer color
  const patientTotals = new Map<string, number>();
  for (const m of months) {
    for (const [patient, amount] of Object.entries(m.byPatient)) {
      patientTotals.set(patient, (patientTotals.get(patient) ?? 0) + amount);
    }
  }
  const patients = [...patientTotals.entries()].sort((a, b) => b[1] - a[1]);

  const palette = [colors.INFO, colors.WARNING, colors.SUCCESS, colors.PRIMARY];
  const colorOf = (patient: string): string => {
    const index = patients.findIndex(([name]) => name === patient);
    return palette[index % palette.length];
  };

  const maxTotal = Math.max(...months.map((m) => m.total));

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <View style={styles.header}>
        <Icon type="material-community" name="chart-bar-stacked" size={20} color={colors.INFO} />
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>Gasto por mes</Text>
      </View>

      {/* Leyenda: paciente + total del rango */}
      <View style={styles.legend}>
        {patients.map(([patient, total]) => (
          <View key={patient} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colorOf(patient) }]} />
            <Text style={[styles.legendText, { color: colors.TEXT_PRIMARY }]}>
              {patient} · {NumberFormat(total)}
            </Text>
          </View>
        ))}
      </View>

      {/* Una fila por mes */}
      {months.map((m) => {
        const widthPercent = maxTotal > 0 ? (m.total / maxTotal) * 100 : 0;
        return (
          <View key={m.month} style={styles.row}>
            <Text style={[styles.monthLabel, { color: colors.TEXT_SECONDARY }]}>{m.label}</Text>

            <View style={[styles.track, { backgroundColor: colors.BORDER + '55' }]}>
              {m.total > 0 && (
                <View style={[styles.stack, { width: `${widthPercent}%` }]}>
                  {Object.entries(m.byPatient).map(([patient, amount]) => (
                    <View
                      key={patient}
                      style={{ flex: amount, backgroundColor: colorOf(patient) }}
                    />
                  ))}
                </View>
              )}
            </View>

            <Text
              style={[
                styles.amount,
                { color: m.total > 0 ? colors.TEXT_PRIMARY : colors.TEXT_SECONDARY }
              ]}
            >
              {m.total > 0 ? NumberFormat(m.total) : '—'}
            </Text>
          </View>
        );
      })}

      <Text style={[styles.footnote, { color: colors.TEXT_SECONDARY }]}>
        El primer y el último mes pueden estar incompletos si el rango no los cubre enteros.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  title: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  legendText: {
    fontSize: SMALL - 1,
    fontWeight: '500'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  monthLabel: {
    width: 62,
    fontSize: SMALL - 1
  },
  track: {
    flex: 1,
    height: 16,
    borderRadius: 4,
    overflow: 'hidden'
  },
  stack: {
    height: 16,
    flexDirection: 'row'
  },
  amount: {
    width: 84,
    textAlign: 'right',
    fontSize: SMALL - 1,
    fontWeight: '600'
  },
  footnote: {
    fontSize: SMALL - 2,
    fontStyle: 'italic',
    marginTop: 4
  }
});
