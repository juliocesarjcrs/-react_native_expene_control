import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryScatter,
  VictoryArea
} from 'victory-native';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { NumberFormat } from '~/utils/Helpers';

interface CashFlowLineChartProps {
  labels: string[];
  dataExpenses: number[];
  dataIncomes: number[];
  dataSavings: number[];
}

type SeriesKey = 'incomes' | 'expenses' | 'savings';

interface ChartPoint {
  x: number;
  label: string;
  expenses: number;
  incomes: number;
  savings: number;
}

type ActivePoint = { point: ChartPoint; series: SeriesKey };

// Datos que Victory entrega al handler de eventos de un punto
type ScatterEventProps = { datum: { x: number } };

const CHART_HEIGHT = 340;
const TOOLTIP_TIMEOUT_MS = 3000;

const NO_DATA: ChartPoint[] = [{ x: 0, label: 'Sin datos', expenses: 0, incomes: 0, savings: 0 }];

const formatYAxis = (val: number): string => {
  if (Math.abs(val) >= 1000000) {
    return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (Math.abs(val) >= 1000) {
    return `${(val / 1000).toFixed(0)}K`;
  }
  return val.toFixed(0);
};

export default function CashFlowLineChart({
  labels,
  dataExpenses,
  dataIncomes,
  dataSavings
}: CashFlowLineChartProps) {
  const colors = useThemeColors();
  const [active, setActive] = useState<ActivePoint | null>(null);
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - 32;

  // Configuración de cada serie (color, ícono del tooltip y estilo de línea)
  const SERIES: {
    key: SeriesKey;
    color: string;
    icon: string;
    strokeWidth: number;
    dashed?: boolean;
  }[] = [
    { key: 'incomes', color: colors.SUCCESS, icon: '↑', strokeWidth: 3.5 },
    { key: 'expenses', color: colors.ERROR, icon: '↓', strokeWidth: 3.5 },
    { key: 'savings', color: colors.INFO, icon: '●', strokeWidth: 3, dashed: true }
  ];

  // Preparar datos para Victory Native
  const chartData: ChartPoint[] = useMemo(
    () =>
      labels.map((label, index) => ({
        x: index,
        label: label || '',
        expenses: dataExpenses[index] ?? 0,
        incomes: dataIncomes[index] ?? 0,
        savings: dataSavings[index] ?? 0
      })),
    [labels, dataExpenses, dataIncomes, dataSavings]
  );

  const safeChartData = useMemo(
    () => (chartData.some((d) => d.label !== '') ? chartData : NO_DATA),
    [chartData]
  );

  const seriesData = useMemo(
    () => ({
      incomes: safeChartData.map((d) => ({ x: d.x, y: d.incomes })),
      expenses: safeChartData.map((d) => ({ x: d.x, y: d.expenses })),
      savings: safeChartData.map((d) => ({ x: d.x, y: d.savings }))
    }),
    [safeChartData]
  );

  // Calcular dominio Y con padding
  const { yMin, yMax } = useMemo(() => {
    const yValues = safeChartData.flatMap((d) => [d.incomes, d.expenses, d.savings]);
    const minY = Math.min(...yValues, 0);
    const maxY = Math.max(...yValues, 1);
    const span = maxY - minY || Math.abs(maxY) || 1;
    const padding = span * 0.15;
    return { yMin: minY - padding, yMax: maxY + padding };
  }, [safeChartData]);

  // El tooltip se oculta solo a los 3 segundos
  useEffect(() => {
    if (!active) return;

    const timer = setTimeout(() => setActive(null), TOOLTIP_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [active]);

  const isHighlighted = (series: SeriesKey, x: number): boolean =>
    active?.series === series && active.point.x === x;

  const activeConfig = active ? SERIES.find((s) => s.key === active.series) : undefined;

  return (
    <View style={styles.container}>
      {/* Tooltip flotante minimalista */}
      {active && activeConfig && (
        <View
          style={[
            styles.floatingTooltip,
            { backgroundColor: activeConfig.color, shadowColor: activeConfig.color }
          ]}
        >
          <Text style={[styles.tooltipMonth, { color: colors.WHITE }]}>{active.point.label}</Text>
          <View style={styles.tooltipValueContainer}>
            <Text style={[styles.tooltipIcon, { color: colors.WHITE }]}>{activeConfig.icon}</Text>
            <Text style={[styles.tooltipAmount, { color: colors.WHITE }]}>
              {NumberFormat(active.point[active.series])}
            </Text>
          </View>
        </View>
      )}

      {/* Gráfico principal */}
      <View
        style={[
          styles.chartContainer,
          { backgroundColor: colors.CARD_BACKGROUND, shadowColor: colors.BLACK }
        ]}
      >
        <Pressable onPress={() => setActive(null)} style={StyleSheet.absoluteFill} />
        <VictoryChart
          width={chartWidth}
          height={CHART_HEIGHT}
          domain={{ y: [yMin, yMax] }}
          domainPadding={{ x: 20 }}
          padding={{ top: 20, bottom: 5, left: 45, right: 15 }}
        >
          {/* Eje X */}
          <VictoryAxis
            tickValues={safeChartData.map((d) => d.x)}
            tickFormat={(val: number) => {
              const item = safeChartData[Math.round(val)];
              return item ? item.label.substring(0, 3) : '';
            }}
            style={{
              axis: { stroke: colors.BORDER, strokeWidth: 1.5 },
              tickLabels: {
                fill: colors.TEXT_SECONDARY,
                fontSize: 11,
                fontWeight: '600',
                angle: -45,
                textAnchor: 'end',
                padding: 3
              },
              grid: { stroke: 'transparent' }
            }}
          />

          {/* Eje Y */}
          <VictoryAxis
            dependentAxis
            tickFormat={formatYAxis}
            style={{
              axis: { stroke: colors.BORDER, strokeWidth: 1.5 },
              tickLabels: {
                fill: colors.TEXT_SECONDARY,
                fontSize: 11,
                fontWeight: '600',
                padding: 8
              },
              grid: {
                stroke: colors.BORDER,
                strokeWidth: 0.8,
                strokeDasharray: '3,5',
                opacity: 0.25
              }
            }}
          />

          {/* Gradientes para las áreas */}
          <Defs>
            <LinearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.SUCCESS} stopOpacity="0.22" />
              <Stop offset="1" stopColor={colors.SUCCESS} stopOpacity="0.00" />
            </LinearGradient>

            <LinearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.ERROR} stopOpacity="0.20" />
              <Stop offset="1" stopColor={colors.ERROR} stopOpacity="0.00" />
            </LinearGradient>
          </Defs>

          {/* Áreas de relleno sutiles */}
          <VictoryArea
            data={seriesData.incomes}
            interpolation="monotoneX"
            style={{
              data: { fill: 'url(#incomeGradient)', fillOpacity: 0.15, stroke: 'transparent' }
            }}
          />
          <VictoryArea
            data={seriesData.expenses}
            interpolation="monotoneX"
            style={{
              data: { fill: 'url(#expenseGradient)', fillOpacity: 0.15, stroke: 'transparent' }
            }}
          />

          {/* Líneas y puntos de cada serie */}
          {SERIES.flatMap((serie) => [
            <VictoryLine
              key={`${serie.key}-line`}
              data={seriesData[serie.key]}
              interpolation="monotoneX"
              style={{
                data: {
                  stroke: serie.color,
                  strokeWidth: serie.strokeWidth,
                  strokeDasharray: serie.dashed ? '7,5' : undefined,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round'
                }
              }}
            />,
            <VictoryScatter
              key={`${serie.key}-points`}
              data={seriesData[serie.key]}
              size={({ datum }) => (isHighlighted(serie.key, datum.x) ? 11 : 6)}
              style={{
                data: {
                  fill: serie.color,
                  stroke: ({ datum }) =>
                    isHighlighted(serie.key, datum.x) ? colors.CARD_BACKGROUND : serie.color,
                  strokeWidth: ({ datum }) => (isHighlighted(serie.key, datum.x) ? 3.5 : 0)
                }
              }}
              events={[
                {
                  target: 'data',
                  eventHandlers: {
                    onPressIn: (_evt: unknown, props: ScatterEventProps) => {
                      const point = safeChartData.find((d) => d.x === props.datum.x);
                      if (point) setActive({ point, series: serie.key });
                      return [];
                    }
                  }
                }
              ]}
            />
          ])}
        </VictoryChart>

        {/* Leyenda horizontal compacta */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendCircle, { backgroundColor: colors.SUCCESS }]} />
            <Text style={[styles.legendText, { color: colors.TEXT_PRIMARY }]}>Ingresos</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendCircle, { backgroundColor: colors.ERROR }]} />
            <Text style={[styles.legendText, { color: colors.TEXT_PRIMARY }]}>Gastos</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendCircleDashed, { borderColor: colors.INFO }]} />
            <Text style={[styles.legendText, { color: colors.TEXT_PRIMARY }]}>Ahorros</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>
        Toca cualquier punto para ver su valor detallado
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8
  },
  floatingTooltip: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 1000,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  tooltipMonth: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tooltipValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  tooltipIcon: {
    fontSize: 16,
    fontWeight: '700'
  },
  tooltipAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  chartContainer: {
    minHeight: 400,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 24
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  legendCircle: {
    width: 14,
    height: 14,
    borderRadius: 7
  },
  legendCircleDashed: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderStyle: 'dashed'
  },
  legendText: {
    fontSize: 13,
    fontWeight: '600'
  },
  hint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic'
  }
});
