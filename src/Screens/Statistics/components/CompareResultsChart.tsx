import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import {
  VictoryBar,
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryTooltip,
} from 'victory-native';
import { VictoryGroup, VictoryLabel } from 'victory-native';

import { useThemeColors } from '~/customHooks/useThemeColors';
import { ComparePeriodsResponse } from '~/shared/types/services/expense-service.type';

interface CompareResultsChartProps {
  data: ComparePeriodsResponse;
}

export default function CompareResultsChart({ data }: CompareResultsChartProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const [chartType, setChartType] = useState('comparison');
  // tooltip toggle state is handled by Victory internal label active flag via events

  const { periodA, periodB, chartData } = data;

  const baseWidth = Math.max(width - 40, 300);

  const convertToVictoryData = (labels: string[], values: number[]) =>
    labels.map((label, index) => ({
      label,
      value: values[index],
    }));

  const formatCurrency = (v: number) => ` $${v.toLocaleString()}`;

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

      {/* Legend for periods */}
      {chartData && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.legendLabel, { color: colors.TEXT_PRIMARY }]}>Periodo A</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text style={[styles.legendLabel, { color: colors.TEXT_PRIMARY }]}>Periodo B</Text>
          </View>
        </View>
      )}

      {/* ------------------------------- */}
      {/* COMPARACIÓN DE TOTALES */}
      {/* ------------------------------- */}
      {chartType === 'comparison' && (
        <View style={styles.chartWrapper}>
          <Text style={[styles.chartLabel, { color: colors.TEXT_SECONDARY }]}>
            Comparación de Totales Acumulados
          </Text>

          <ScrollView horizontal>
            <VictoryChart
              width={baseWidth}
              height={250}
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 70, left: 80, right: 40 }}
              domainPadding={{ x: 50 }}
            >
              <VictoryAxis
                style={{
                  tickLabels: { fill: colors.TEXT_PRIMARY, fontSize: 12 },
                }}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={(t) => formatCurrency(t as number)}
                style={{
                  tickLabels: { fill: colors.TEXT_PRIMARY, fontSize: 12 },
                }}
              />

              <VictoryBar
                barWidth={40}
                style={{ data: { fill: colors.PRIMARY } }}
                data={[
                  { label: 'Periodo A', value: periodA.total },
                  { label: 'Periodo B', value: periodB.total },
                ]}
                x="label"
                y="value"
                labels={({ datum }) => `${datum.label}: ${formatCurrency(datum.value)}`}
                labelComponent={
                  <VictoryTooltip
                    flyoutStyle={{ fill: colors.CARD_BACKGROUND }}
                    flyoutPadding={{ top: 8, bottom: 8, left: 10, right: 10 }}
                    style={{ fontSize: 12 }}
                    renderInPortal={false}
                  />
                }
                events={[
                  {
                    target: 'data',
                    eventHandlers: {
                      onPress: () => [
                        {
                          target: 'labels',
                          mutation: (props) => ({ active: !props.active }),
                        },
                      ],
                    },
                  },
                ]}
              />
            </VictoryChart>
          </ScrollView>
        </View>
      )}

      {/* ------------------------------- */}
      {/* COMPARACIÓN DE PROMEDIOS */}
      {/* ------------------------------- */}
      {chartType === 'average' && (
        <View style={styles.chartWrapper}>
          <Text style={[styles.chartLabel, { color: colors.TEXT_SECONDARY }]}>
            Comparación de Promedios Mensuales
          </Text>

          <ScrollView horizontal>
            <VictoryChart width={baseWidth} height={250} padding={{ top: 20, bottom: 70, left: 80, right: 40 }}>
              <VictoryAxis
                style={{
                  tickLabels: { fill: colors.TEXT_PRIMARY, fontSize: 12 },
                }}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={(t) => formatCurrency(t as number)}
                style={{
                  tickLabels: { fill: colors.TEXT_PRIMARY, fontSize: 12 },
                }}
              />

              <VictoryBar
                barWidth={40}
                style={{ data: { fill: colors.PRIMARY } }}
                data={[
                  { label: 'Promedio A', value: periodA.averageMonthly },
                  { label: 'Promedio B', value: periodB.averageMonthly },
                ]}
                x="label"
                y="value"
                labels={({ datum }) => `${datum.label}: ${formatCurrency(datum.value)}`}
                labelComponent={<VictoryTooltip flyoutStyle={{ fill: colors.CARD_BACKGROUND }} flyoutPadding={{ top: 8, bottom: 8, left: 10, right: 10 }} style={{ fontSize: 12 }} renderInPortal={false} />}
                events={[
                  {
                    target: 'data',
                    eventHandlers: {
                      onPress: () => [
                        {
                          target: 'labels',
                          mutation: (props) => ({ active: !props.active }),
                        },
                      ],
                    },
                  },
                ]}
              />
            </VictoryChart>
          </ScrollView>
        </View>
      )}

      {/* ------------------------------- */}
      {/* COMPARACIÓN POR CATEGORÍAS */}
      {/* ------------------------------- */}
      {chartType === 'categories' && chartData && (
        <View style={styles.chartWrapper}>
          <Text style={[styles.chartLabel, { color: colors.TEXT_SECONDARY }]}> 
            Gastos por Subcategoría - Comparación
          </Text>

          <ScrollView horizontal>
            <VictoryChart
              width={Math.max(chartData.labels.length * 60, 400)}
              height={300}
              padding={{ top: 20, bottom: 120, left: 90, right: 40 }}
              domainPadding={{ x: 20 }}
            >
              <VictoryAxis
                tickFormat={(t) => (typeof t === 'string' && t.length > 10 ? t.slice(0, 10) + '...' : t)}
                tickLabelComponent={<VictoryLabel angle={-45} dy={10} />}
                style={{
                  tickLabels: { fill: colors.TEXT_PRIMARY, fontSize: 10 },
                }}
              />

              <VictoryAxis
                dependentAxis
                tickFormat={(t) => formatCurrency(t as number)}
                style={{
                  tickLabels: { fill: colors.TEXT_PRIMARY, fontSize: 12 },
                }}
              />

              <VictoryGroup offset={18} colorScale={["#4CAF50", "#2196F3"]}>
                <VictoryBar
                  barWidth={14}
                  data={convertToVictoryData(chartData.labels, chartData.datasets[0]?.data || [])}
                  x="label"
                  y="value"
                  labels={({ datum }) => `${datum.label}: ${formatCurrency(datum.value)}`}
                  labelComponent={<VictoryTooltip flyoutStyle={{ fill: colors.CARD_BACKGROUND }} flyoutPadding={{ top: 8, bottom: 8, left: 10, right: 10 }} style={{ fontSize: 11 }} renderInPortal={false} />}
                  events={[
                    {
                      target: 'data',
                      eventHandlers: {
                        onPress: () => [
                          {
                            target: 'labels',
                            mutation: (props) => ({ active: !props.active }),
                          },
                        ],
                      },
                    },
                  ]}
                />

                <VictoryBar
                  barWidth={14}
                  data={convertToVictoryData(chartData.labels, chartData.datasets[1]?.data || [])}
                  x="label"
                  y="value"
                  labels={({ datum }) => `${datum.label}: ${formatCurrency(datum.value)}`}
                  labelComponent={<VictoryTooltip flyoutStyle={{ fill: colors.CARD_BACKGROUND }} flyoutPadding={{ top: 8, bottom: 8, left: 10, right: 10 }} style={{ fontSize: 11 }} renderInPortal={false} />}
                  events={[
                    {
                      target: 'data',
                      eventHandlers: {
                        onPress: () => [
                          {
                            target: 'labels',
                            mutation: (props) => ({ active: !props.active }),
                          },
                        ],
                      },
                    },
                  ]}
                />
              </VictoryGroup>
            </VictoryChart>
          </ScrollView>

          <Text style={[styles.note, { color: colors.TEXT_SECONDARY }]}> 
            Toca una barra para ver subcategoría y monto. Rotar etiquetas si es necesario.
          </Text>
        </View>
      )}
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
    marginBottom: 20,
  },
  chartLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  periodsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  periodChart: {
    marginRight: 20,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  periodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  periodChartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  separator: {
    width: 20,
  },
  note: {
    marginTop: 8,
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
  },
});
