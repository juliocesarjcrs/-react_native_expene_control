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

interface ChartPoint {
  x: number;
  label: string;
  expenses: number;
  incomes: number;
  savings: number;
}

export default function CashFlowLineChart({
  labels,
  dataExpenses,
  dataIncomes,
  dataSavings
}: CashFlowLineChartProps) {
  const colors = useThemeColors();
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);
  const [activeSeries, setActiveSeries] = useState<'expenses' | 'incomes' | 'savings' | null>(null);

  // Preparar datos para Victory Native
  const chartData: ChartPoint[] = useMemo(() => {
    return labels.map((label, index) => ({
      x: index,
      label: label || '',
      expenses: dataExpenses[index] || 0,
      incomes: dataIncomes[index] || 0,
      savings: dataSavings[index] || 0
    }));
  }, [labels, dataExpenses, dataIncomes, dataSavings]);

  const hasValidData = chartData.length > 0 && chartData.some((d) => d.label !== '');
  const safeChartData = hasValidData
    ? chartData
    : [{ x: 0, label: 'Sin datos', expenses: 0, incomes: 0, savings: 0 }];

  const expensesSeries = safeChartData.map((d) => ({ x: d.x, y: d.expenses }));
  const incomesSeries = safeChartData.map((d) => ({ x: d.x, y: d.incomes }));
  const savingsSeries = safeChartData.map((d) => ({ x: d.x, y: d.savings }));

  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - 32;
  const chartHeight = 340;

  // Calcular dominio Y con padding
  const { yMin, yMax } = useMemo(() => {
    const yValues = safeChartData.flatMap((d) => [d.incomes, d.expenses, d.savings]);
    const minY = Math.min(...yValues, 0);
    const maxY = Math.max(...yValues, 1);
    const span = maxY - minY || Math.abs(maxY) || 1;
    const padding = span * 0.15;
    return { yMin: minY - padding, yMax: maxY + padding };
  }, [safeChartData]);

  // Formateo del eje Y
  const formatYAxis = (val: number) => {
    if (Math.abs(val) >= 1000000) {
      const m = val / 1000000;
      return `${m.toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (Math.abs(val) >= 1000) {
      const k = val / 1000;
      return `${k.toFixed(0)}K`;
    }
    return val.toFixed(0);
  };

  const isActive = activePoint !== null;

  // Determinar el color del punto según la serie activa
  const getSeriesColor = () => {
    switch (activeSeries) {
      case 'incomes':
        return colors.SUCCESS;
      case 'expenses':
        return colors.ERROR;
      case 'savings':
        return colors.INFO;
      default:
        return colors.PRIMARY;
    }
  };

  // Determinar el ícono según la serie
  const getSeriesIcon = () => {
    switch (activeSeries) {
      case 'incomes':
        return '↑';
      case 'expenses':
        return '↓';
      case 'savings':
        return '●';
      default:
        return '';
    }
  };

  useEffect(() => {
    if (activePoint) {
      const t = setTimeout(() => {
        setActivePoint(null);
        setActiveSeries(null);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [activePoint]);

  return (
    <View style={styles.container}>
      {/* Tooltip flotante minimalista */}
      {isActive && activePoint && activeSeries && (
        <View
          style={[
            styles.floatingTooltip,
            {
              backgroundColor: getSeriesColor(),
              shadowColor: getSeriesColor()
            }
          ]}
        >
          <Text style={styles.tooltipMonth}>{activePoint.label}</Text>
          <View style={styles.tooltipValueContainer}>
            <Text style={styles.tooltipIcon}>{getSeriesIcon()}</Text>
            <Text style={styles.tooltipAmount}>
              {NumberFormat(
                activeSeries === 'incomes'
                  ? activePoint.incomes
                  : activeSeries === 'expenses'
                    ? activePoint.expenses
                    : activePoint.savings
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Gráfico principal */}
      <View style={[styles.chartContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
        <Pressable
          onPress={() => {
            setActivePoint(null);
            setActiveSeries(null);
          }}
          style={StyleSheet.absoluteFill}
        />
        <VictoryChart
          width={chartWidth}
          height={chartHeight}
          domain={{ y: [yMin, yMax] }}
          domainPadding={{ x: 20 }}
          padding={{ top: 20, bottom: 5, left: 45, right: 15 }}
        >
          {/* Eje X */}
          <VictoryAxis
            tickValues={safeChartData.map((d) => d.x)}
            tickFormat={(val: any) => {
              const idx = Math.round(val);
              const item = safeChartData[idx];
              if (!item) return '';
              return item.label.substring(0, 3);
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
            data={incomesSeries}
            interpolation="monotoneX"
            style={{
              data: {
                fill: `url(#incomeGradient)`,
                fillOpacity: 0.15,
                stroke: 'transparent'
              }
            }}
          />

          <VictoryArea
            data={expensesSeries}
            interpolation="monotoneX"
            style={{
              data: {
                fill: `url(#expenseGradient)`,
                fillOpacity: 0.15,
                stroke: 'transparent'
              }
            }}
          />

          {/* Línea de Ingresos (verde) - más gruesa */}
          <VictoryLine
            data={incomesSeries}
            interpolation="monotoneX"
            style={{
              data: {
                stroke: colors.SUCCESS,
                strokeWidth: 3.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round'
              }
            }}
          />
          <VictoryScatter
            data={incomesSeries}
            size={({ datum }) =>
              isActive && activePoint?.x === datum.x && activeSeries === 'incomes' ? 11 : 6
            }
            style={{
              data: {
                fill: colors.SUCCESS,
                stroke: ({ datum }) =>
                  isActive && activePoint?.x === datum.x && activeSeries === 'incomes'
                    ? colors.CARD_BACKGROUND
                    : colors.SUCCESS,
                strokeWidth: ({ datum }) =>
                  isActive && activePoint?.x === datum.x && activeSeries === 'incomes' ? 3.5 : 0
              }
            }}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onPressIn: (_evt: any, props: any) => {
                    const point = safeChartData.find((d) => d.x === props.datum.x);
                    if (point) {
                      setActivePoint(point);
                      setActiveSeries('incomes');
                    }
                    return [];
                  }
                }
              }
            ]}
          />

          {/* Línea de Gastos (rojo) */}
          <VictoryLine
            data={expensesSeries}
            interpolation="monotoneX"
            style={{
              data: {
                stroke: colors.ERROR,
                strokeWidth: 3.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round'
              }
            }}
          />
          <VictoryScatter
            data={expensesSeries}
            size={({ datum }) =>
              isActive && activePoint?.x === datum.x && activeSeries === 'expenses' ? 11 : 6
            }
            style={{
              data: {
                fill: colors.ERROR,
                stroke: ({ datum }) =>
                  isActive && activePoint?.x === datum.x && activeSeries === 'expenses'
                    ? colors.CARD_BACKGROUND
                    : colors.ERROR,
                strokeWidth: ({ datum }) =>
                  isActive && activePoint?.x === datum.x && activeSeries === 'expenses' ? 3.5 : 0
              }
            }}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onPressIn: (_evt: any, props: any) => {
                    const point = safeChartData.find((d) => d.x === props.datum.x);
                    if (point) {
                      setActivePoint(point);
                      setActiveSeries('expenses');
                    }
                    return [];
                  }
                }
              }
            ]}
          />

          {/* Línea de Ahorros (azul punteada) */}
          <VictoryLine
            data={savingsSeries}
            interpolation="monotoneX"
            style={{
              data: {
                stroke: colors.INFO,
                strokeWidth: 3,
                strokeDasharray: '7,5',
                strokeLinecap: 'round'
              }
            }}
          />
          <VictoryScatter
            data={savingsSeries}
            size={({ datum }) =>
              isActive && activePoint?.x === datum.x && activeSeries === 'savings' ? 11 : 6
            }
            style={{
              data: {
                fill: colors.INFO,
                stroke: ({ datum }) =>
                  isActive && activePoint?.x === datum.x && activeSeries === 'savings'
                    ? colors.CARD_BACKGROUND
                    : colors.INFO,
                strokeWidth: ({ datum }) =>
                  isActive && activePoint?.x === datum.x && activeSeries === 'savings' ? 3.5 : 0
              }
            }}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onPressIn: (_evt: any, props: any) => {
                    const point = safeChartData.find((d) => d.x === props.datum.x);
                    if (point) {
                      setActivePoint(point);
                      setActiveSeries('savings');
                    }
                    return [];
                  }
                }
              }
            ]}
          />
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  tooltipAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  chartContainer: {
    minHeight: 400,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    shadowColor: '#000',
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
