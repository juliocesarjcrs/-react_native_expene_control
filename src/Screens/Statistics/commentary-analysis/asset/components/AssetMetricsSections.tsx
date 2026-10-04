/**
 * Tarjetas de resultados del bien: costo, deuda, rentabilidad, gastos y meses.
 * Ubicación: src/Screens/Statistics/commentary-analysis/asset/components/AssetMetricsSections.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { AssetCard, AssetRow } from './AssetCard';
import {
  AssetMetrics,
  OpexBucket
} from '~/shared/types/utils/commentaryParser/asset-metrics.types';
import {
  formatMonth,
  formatPercent,
  formatYears,
  OPEX_LABELS
} from '~/shared/types/utils/commentaryParser/assetFormat.utils';
import { NumberFormat } from '~/utils/Helpers';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { SMALL } from '~/styles/fonts';

interface Props {
  metrics: AssetMetrics;
  /** El bien tiene una categoría de ingreso vinculada */
  hasIncomeLink: boolean;
  /** Falló la carga de ingresos */
  incomesFailed: boolean;
}

export default function AssetMetricsSections({ metrics, hasIncomeLink, incomesFailed }: Props) {
  const colors = useThemeColors();
  const { cost, debt, equity, annual, yields, payback, window } = metrics;

  const buckets = (Object.keys(annual.opexByBucket) as OpexBucket[])
    .filter((b) => Math.abs(annual.opexByBucket[b]) >= 1)
    .sort((a, b) => annual.opexByBucket[b] - annual.opexByBucket[a]);

  const gap = cost.purchaseGap;
  const lastMonths = [...metrics.monthly].slice(-12).reverse();

  return (
    <>
      {/* 1. Costo */}
      <AssetCard title="Costo del bien" icon="cash-multiple" accentKey="PRIMARY">
        <AssetRow label="Compra (promesa, abonos, saldo)" value={NumberFormat(cost.purchase)} />
        <AssetRow label="Escrituración y 4x1000" value={NumberFormat(cost.acquisitionCosts)} />
        {cost.improvements > 0 && (
          <AssetRow label="Mejoras" value={NumberFormat(cost.improvements)} />
        )}
        {cost.unclassified > 0 && (
          <AssetRow
            label="Sin formato (cuenta como costo)"
            value={NumberFormat(cost.unclassified)}
            hint="Comentarios viejos marcados como inversión"
          />
        )}
        <AssetRow label="Costo total" value={NumberFormat(cost.total)} emphasis />
        {cost.deedValue !== null && (
          <AssetRow label="Valor de la escritura" value={NumberFormat(cost.deedValue)} />
        )}
        {gap !== null && gap !== 0 && (
          <AssetRow
            label={gap > 0 ? 'Falta registrar de la compra' : 'Pagado de más sobre la escritura'}
            value={NumberFormat(Math.abs(gap))}
            valueColorKey="WARNING"
          />
        )}
      </AssetCard>

      {/* 2. Deuda */}
      {debt.hasLoan && (
        <AssetCard title="Préstamo y capital propio" icon="bank" accentKey="WARNING">
          <AssetRow
            label="Deuda actual"
            value={debt.balance === null ? 'Sin saldo registrado' : NumberFormat(debt.balance)}
            hint={debt.asOfDate ? `Según el último saldo (${debt.asOfDate})` : undefined}
            valueColorKey={debt.balance === null ? 'WARNING' : undefined}
          />
          <AssetRow label="Intereses pagados" value={NumberFormat(debt.interestPaid)} />
          <AssetRow label="Abonos a capital" value={NumberFormat(debt.principalPaid)} />
          <AssetRow
            label="Tu capital en el bien"
            value={equity === null ? '—' : NumberFormat(equity)}
            emphasis
            hint="Costo total menos deuda actual"
          />
        </AssetCard>
      )}

      {/* 3. Rentabilidad */}
      {yields.gross === null ? (
        <AssetCard title="Rentabilidad" icon="chart-line" accentKey="SUCCESS">
          <Text style={[styles.note, { color: colors.TEXT_SECONDARY }]}>
            {incomesFailed
              ? 'No se pudieron cargar los ingresos, por eso no hay rentabilidad.'
              : hasIncomeLink
                ? 'Aún no hay arriendos registrados en el rango elegido.'
                : 'Sin arriendo vinculado: solo se muestran costo, deuda y gastos.'}
          </Text>
        </AssetCard>
      ) : (
        <AssetCard title="Rentabilidad y recuperación" icon="chart-line" accentKey="SUCCESS">
          <AssetRow label="Arriendo anual" value={NumberFormat(annual.rent)} />
          <AssetRow label="Gastos anuales (sin intereses)" value={NumberFormat(annual.opex)} />
          <AssetRow label="Ganancia neta anual" value={NumberFormat(annual.net)} emphasis />
          <AssetRow
            label="Ganancia neta mensual (promedio)"
            value={NumberFormat(annual.averageMonthlyNet)}
            emphasis
          />
          {debt.hasLoan && (
            <AssetRow
              label="Neta anual después de intereses"
              value={NumberFormat(annual.netAfterInterest)}
            />
          )}
          <AssetRow label="Rentabilidad bruta" value={formatPercent(yields.gross)} />
          <AssetRow label="Rentabilidad neta" value={formatPercent(yields.net)} />
          {debt.hasLoan && (
            <>
              <AssetRow
                label="Neta después de intereses"
                value={formatPercent(yields.netAfterInterest)}
              />
              <AssetRow label="Sobre tu capital" value={formatPercent(yields.onEquity)} />
            </>
          )}
          <AssetRow
            label="Recuperar el costo con arriendo"
            value={formatYears(payback.years)}
            emphasis
          />
          {debt.hasLoan && (
            <AssetRow label="Recuperar tu capital" value={formatYears(payback.equityYears)} />
          )}
          <Text style={[styles.note, { color: colors.TEXT_SECONDARY }]}>
            {window.annualized
              ? `Basado en ${window.months} ${window.months === 1 ? 'mes' : 'meses'} con arriendo, proyectado a 12.`
              : 'Basado en los últimos 12 meses completos.'}
          </Text>
        </AssetCard>
      )}

      {/* 4. Gastos por tipo */}
      {(buckets.length > 0 || annual.interest >= 1) && (
        <AssetCard title="Gastos por tipo (anual)" icon="receipt" accentKey="ERROR">
          {buckets.map((b) => (
            <AssetRow key={b} label={OPEX_LABELS[b]} value={NumberFormat(annual.opexByBucket[b])} />
          ))}
          {annual.interest >= 1 && (
            <AssetRow label="Intereses del préstamo" value={NumberFormat(annual.interest)} />
          )}
        </AssetCard>
      )}

      {/* 5. Últimos meses */}
      {lastMonths.length > 0 && (
        <AssetCard title="Últimos meses" icon="calendar-month" accentKey="INFO">
          {lastMonths.map((row) => (
            <View key={row.month} style={styles.monthRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.monthLabel, { color: colors.TEXT_PRIMARY }]}>
                  {formatMonth(row.month)}
                </Text>
                <Text style={[styles.monthSub, { color: colors.TEXT_SECONDARY }]}>
                  Arriendo {NumberFormat(row.rent)} · Gastos{' '}
                  {NumberFormat(row.opexTotal + row.interest)}
                </Text>
              </View>
              <Text
                style={[
                  styles.monthNet,
                  { color: row.netAfterInterest < 0 ? colors.ERROR : colors.SUCCESS }
                ]}
              >
                {NumberFormat(row.netAfterInterest)}
              </Text>
            </View>
          ))}
        </AssetCard>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: SMALL, lineHeight: 18 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  monthLabel: { fontSize: SMALL + 1, fontWeight: '600' },
  monthSub: { fontSize: SMALL - 1 },
  monthNet: { fontSize: SMALL + 1, fontWeight: '700' }
});
