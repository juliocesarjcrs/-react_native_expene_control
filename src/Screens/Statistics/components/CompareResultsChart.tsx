import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { ComparePeriodsResponse } from '~/shared/types/services/expense-service.type';
import { SegmentedButtons, Text } from 'react-native-paper';

interface CompareResultsChartProps {
  data: ComparePeriodsResponse;
}

export default function CompareResultsChart({ data }: CompareResultsChartProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const [chartType, setChartType] = useState('comparison');

  const { periodA, periodB, comparison, chartData } = data;

  // Función helper para convertir hex a rgba
  const hexToRgba = (hex: string, opacity = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Gráfico de comparación de totales
  const totalComparisonData = {
    labels: ['Periodo A', 'Periodo B'],
    datasets: [
      {
        data: [periodA.total, periodB.total],
      },
    ],
  };

  // Gráfico de promedios mensuales
  const averageComparisonData = {
    labels: ['Promedio A', 'Promedio B'],
    datasets: [
      {
        data: [periodA.averageMonthly, periodB.averageMonthly],
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.CARD_BACKGROUND,
    backgroundGradientTo: colors.CARD_BACKGROUND,
    color: (opacity = 1) => {
      const primaryHex = colors.PRIMARY;
      return hexToRgba(primaryHex, opacity);
    },
    labelColor: () => colors.TEXT_PRIMARY,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.CARD_BACKGROUND }]}>
      <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
        Visualización Gráfica
      </Text>

      <SegmentedButtons
        value={chartType}
        onValueChange={setChartType}
        buttons={[
          { value: 'comparison', label: 'Totales' },
          { value: 'average', label: 'Promedios' },
          ...(chartData ? [{ value: 'categories', label: 'Categorías' }] : []),
        ]}
        style={{ marginBottom: 16 }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {chartType === 'comparison' && (
          <View style={styles.chartWrapper}>
            <Text style={[styles.chartLabel, { color: colors.TEXT_SECONDARY }]}>
              Comparación de Totales Acumulados
            </Text>
            <BarChart
              data={totalComparisonData}
              width={Math.max(width - 40, 300)}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              fromZero
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </View>
        )}

        {chartType === 'average' && (
          <View style={styles.chartWrapper}>
            <Text style={[styles.chartLabel, { color: colors.TEXT_SECONDARY }]}>
              Comparación de Promedios Mensuales
            </Text>
            <BarChart
              data={averageComparisonData}
              width={Math.max(width - 40, 300)}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              fromZero
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </View>
        )}

        {chartType === 'categories' && chartData && (
          <View style={styles.chartWrapper}>
            <Text style={[styles.chartLabel, { color: colors.TEXT_SECONDARY }]}>
              Gastos por Subcategoría - Comparación
            </Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.categoriesScroll}
            >
              <View style={styles.periodsContainer}>
                {/* Periodo A */}
                <View style={styles.periodChart}>
                  <View style={styles.periodHeader}>
                    <View style={[styles.periodDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={[styles.periodChartTitle, { color: colors.TEXT_PRIMARY }]}>
                      Periodo A
                    </Text>
                  </View>
                  <BarChart
                    data={{
                      labels: chartData.labels.map(l => 
                        l.length > 8 ? l.substring(0, 8) + '...' : l
                      ),
                      datasets: [{ data: chartData.datasets[0]?.data || [] }],
                    }}
                    width={Math.max(chartData.labels.length * 60, 280)}
                    height={220}
                    yAxisLabel="$"
                    yAxisSuffix=""
                    fromZero
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => hexToRgba('#4CAF50', opacity),
                      barPercentage: 0.7,
                    }}
                    style={styles.chart}
                  />
                </View>

                {/* Separador */}
                <View style={styles.separator} />

                {/* Periodo B */}
                <View style={styles.periodChart}>
                  <View style={styles.periodHeader}>
                    <View style={[styles.periodDot, { backgroundColor: '#2196F3' }]} />
                    <Text style={[styles.periodChartTitle, { color: colors.TEXT_PRIMARY }]}>
                      Periodo B
                    </Text>
                  </View>
                  <BarChart
                    data={{
                      labels: chartData.labels.map(l => 
                        l.length > 8 ? l.substring(0, 8) + '...' : l
                      ),
                      datasets: [{ data: chartData.datasets[1]?.data || [] }],
                    }}
                    width={Math.max(chartData.labels.length * 60, 280)}
                    height={220}
                    yAxisLabel="$"
                    yAxisSuffix=""
                    fromZero
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => hexToRgba('#2196F3', opacity),
                      barPercentage: 0.7,
                    }}
                    style={styles.chart}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Nota explicativa */}
            <Text style={[styles.note, { color: colors.TEXT_SECONDARY }]}>
              Desliza horizontalmente para comparar gastos por subcategoría
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chartLabel: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  categoriesScroll: {
    marginVertical: 8,
  },
  periodsContainer: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 8,
  },
  periodChart: {
    alignItems: 'center',
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  periodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  periodChartTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  separator: {
    width: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  note: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
});