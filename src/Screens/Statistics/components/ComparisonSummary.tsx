import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons, Card } from 'react-native-paper';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { ComparePeriodsResponse } from '~/shared/types/services/expense-service.type';

interface ComparisonSummaryProps {
  data: ComparePeriodsResponse;
}

export default function ComparisonSummary({ data }: ComparisonSummaryProps) {
  const colors = useThemeColors();
  const [viewMode, setViewMode] = useState('both');
  const { periodA, periodB, comparison } = data;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increase':
        return colors.ERROR;
      case 'decrease':
        return colors.SUCCESS;
      default:
        return colors.INFO;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increase':
        return '📈';
      case 'decrease':
        return '📉';
      default:
        return '➖';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.mainTitle, { color: colors.TEXT_PRIMARY }]}>
        Análisis Comparativo
      </Text>

      {/* Selector de vista */}
      <SegmentedButtons
        value={viewMode}
        onValueChange={setViewMode}
        buttons={[
          { value: 'both', label: 'Ambos' },
          { value: 'total', label: 'Total' },
          { value: 'monthly', label: 'Mensual' },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* Periodos */}
      <View style={styles.periodsRow}>
        <Card style={[styles.periodCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <Card.Content>
            <Text style={[styles.periodLabel, { color: colors.TEXT_SECONDARY }]}>
              Periodo A ({periodA.months} {periodA.months === 1 ? 'mes' : 'meses'})
            </Text>
            <Text style={[styles.periodTotal, { color: colors.TEXT_PRIMARY }]}>
              {formatCurrency(periodA.total)}
            </Text>
            <Text style={[styles.periodAverage, { color: colors.TEXT_SECONDARY }]}>
              Promedio: {formatCurrency(periodA.averageMonthly)}/mes
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.periodCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <Card.Content>
            <Text style={[styles.periodLabel, { color: colors.TEXT_SECONDARY }]}>
              Periodo B ({periodB.months} {periodB.months === 1 ? 'mes' : 'meses'})
            </Text>
            <Text style={[styles.periodTotal, { color: colors.TEXT_PRIMARY }]}>
              {formatCurrency(periodB.total)}
            </Text>
            <Text style={[styles.periodAverage, { color: colors.TEXT_SECONDARY }]}>
              Promedio: {formatCurrency(periodB.averageMonthly)}/mes
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Comparación Total */}
      {(viewMode === 'both' || viewMode === 'total') && (
        <Card style={[styles.comparisonCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <Card.Content>
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonIcon}>
                {getTrendIcon(comparison.total.trend)}
              </Text>
              <Text style={[styles.comparisonTitle, { color: colors.TEXT_PRIMARY }]}>
                Total Acumulado
              </Text>
            </View>
            <Text
              style={[
                styles.comparisonDifference,
                { color: getTrendColor(comparison.total.trend) },
              ]}
            >
              {comparison.total.difference > 0 ? '+' : ''}
              {formatCurrency(comparison.total.difference)}
            </Text>
            <Text
              style={[
                styles.comparisonPercentage,
                { color: getTrendColor(comparison.total.trend) },
              ]}
            >
              {comparison.total.percentageChange}%
            </Text>
            <Text style={[styles.comparisonDescription, { color: colors.TEXT_SECONDARY }]}>
              Compara el gasto total de ambos periodos completos
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Comparación Mensual */}
      {(viewMode === 'both' || viewMode === 'monthly') && (
        <Card style={[styles.comparisonCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
          <Card.Content>
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonIcon}>
                {getTrendIcon(comparison.monthlyAverage.trend)}
              </Text>
              <Text style={[styles.comparisonTitle, { color: colors.TEXT_PRIMARY }]}>
                Promedio Mensual
              </Text>
            </View>
            <Text
              style={[
                styles.comparisonDifference,
                { color: getTrendColor(comparison.monthlyAverage.trend) },
              ]}
            >
              {comparison.monthlyAverage.difference > 0 ? '+' : ''}
              {formatCurrency(comparison.monthlyAverage.difference)}
            </Text>
            <Text
              style={[
                styles.comparisonPercentage,
                { color: getTrendColor(comparison.monthlyAverage.trend) },
              ]}
            >
              {comparison.monthlyAverage.percentageChange}%
            </Text>
            <Text style={[styles.comparisonDescription, { color: colors.TEXT_SECONDARY }]}>
              Compara la intensidad del gasto mensual promedio
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Explicación */}
      <Card style={[styles.explanationCard, { backgroundColor: colors.INFO + '20' }]}>
        <Card.Content>
          <Text style={[styles.explanationTitle, { color: colors.INFO }]}>
            💡 Interpretación
          </Text>
          <Text style={[styles.explanationText, { color: colors.TEXT_PRIMARY }]}>
            {comparison.explanation}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  periodsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  periodCard: {
    flex: 1,
    elevation: 2,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  periodTotal: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  periodAverage: {
    fontSize: 11,
  },
  comparisonCard: {
    marginBottom: 12,
    elevation: 2,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  comparisonDifference: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  comparisonPercentage: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  comparisonDescription: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  explanationCard: {
    elevation: 1,
    marginTop: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
  },
});