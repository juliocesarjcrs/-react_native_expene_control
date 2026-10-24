/**
 * CopagoPendingCard — Cuánto falta por pagar en las terapias abiertas
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/components/CopagoPendingCard.tsx
 *
 * Estimación = sesiones restantes × último copago pagado del ciclo.
 * Solo ciclos de terapia con /Total. Siempre muestra el paciente.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Types
import { CopagoPendingSummary } from '~/shared/types/utils/commentaryParser/copago-analysis.types';

// Utils
import { NumberFormat } from '~/utils/Helpers';
import { getCopagoGroupIcon } from '~/utils/commentaryParser';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface CopagoPendingCardProps {
  summary: CopagoPendingSummary;
}

export default function CopagoPendingCard({ summary }: CopagoPendingCardProps) {
  const colors = useThemeColors();

  if (summary.cycles.length === 0) return null;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }]}
    >
      <View style={styles.header}>
        <Icon type="material-community" name="cash-clock" size={20} color={colors.WARNING} />
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
          Pendiente en terapias abiertas
        </Text>
      </View>

      {/* Total estimado */}
      <View style={[styles.totalRow, { borderBottomColor: colors.BORDER }]}>
        <View>
          <Text style={[styles.totalValue, { color: colors.TEXT_PRIMARY }]}>
            ≈ {NumberFormat(summary.totalEstimatedCost)}
          </Text>
          <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
            {summary.totalRemainingSessions}{' '}
            {summary.totalRemainingSessions === 1 ? 'sesión restante' : 'sesiones restantes'}
          </Text>
        </View>
      </View>

      {/* Un ciclo por fila */}
      {summary.cycles.map((c) => (
        <View key={`${c.patient}-${c.specialtyKey}`} style={styles.row}>
          <Icon
            type="material-community"
            name={getCopagoGroupIcon(c.specialtyKey)}
            size={16}
            color={colors.INFO}
          />
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.TEXT_PRIMARY }]}>
              {c.specialtyLabel} · {c.patient}
            </Text>
            <Text style={[styles.detail, { color: colors.TEXT_SECONDARY }]}>
              Sesión {c.lastNumber}/{c.totalSessions} · faltan {c.remainingSessions} ×{' '}
              {NumberFormat(c.lastCost)}
            </Text>
          </View>
          <Text style={[styles.rowCost, { color: colors.TEXT_PRIMARY }]}>
            {NumberFormat(c.estimatedCost)}
          </Text>
        </View>
      ))}

      <Text style={[styles.footnote, { color: colors.TEXT_SECONDARY }]}>
        Estimado con el último copago pagado de cada ciclo y los registros del rango elegido.
        {summary.openWithoutTotal > 0
          ? ` ${summary.openWithoutTotal} ${
              summary.openWithoutTotal === 1 ? 'terapia abierta' : 'terapias abiertas'
            } sin /Total (ej. psicología) no se incluye${summary.openWithoutTotal === 1 ? '' : 'n'}.`
          : ''}
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
  totalRow: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1
  },
  totalValue: {
    fontSize: MEDIUM + 2,
    fontWeight: '700'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6
  },
  rowText: {
    flex: 1
  },
  rowTitle: {
    fontSize: SMALL + 1,
    fontWeight: '500'
  },
  rowCost: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  },
  detail: {
    fontSize: SMALL - 1
  },
  footnote: {
    fontSize: SMALL - 2,
    fontStyle: 'italic',
    marginTop: 8
  }
});
