import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryScatter, VictoryArea } from 'victory-native';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { findLastIncomesMonthsFromOnlyCategory } from '../../../services/incomes';

// Components
import SelectOnlyCategory from '../../../components/dropDown/SelectOnlyCategory';
import CheckBoxOptions from '../../../components/checbox/CheckBoxOptions';
import MyLoading from '../../../components/loading/MyLoading';

// Types
import { DropDownSelectFormat } from '../../../shared/types/components';
import { BalanceStackParamList } from '../../../shared/types';

// Utils
import { NumberFormat } from '../../../utils/Helpers';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

type GraphIncomesByCategoryNavigationProp = StackNavigationProp<BalanceStackParamList, 'cashFlow'>;

interface GraphIncomesByCategoryProps {
  navigation: GraphIncomesByCategoryNavigationProp;
}

interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
}

export default function GraphIncomesByCategory({ navigation }: GraphIncomesByCategoryProps) {
  const colors = useThemeColors();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const selectOnlyCategoryRef = useRef<any>(null);
  const [dataIncomes, setDataIncomes] = useState<number[]>([0]);
  const [labels, setLabels] = useState<string[]>(['']);
  const [categoryLabel, setCategoryLabel] = useState<string>('');
  const [average, setAverage] = useState<number>(0);
  const [previousAverage, setPreviousAverage] = useState<number>(0);
  const [sum, setSum] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [activePoint, setActivePoint] = useState<ChartDataPoint | null>(null);
  const [dataCategory, setDataCategory] = useState<DropDownSelectFormat>();
  const [numMonths, setNumMonths] = useState(3);

  // Responsive: ajustar según orientación
  const isLandscape = windowWidth > windowHeight;
  const chartWidth = windowWidth - 32;
  const chartHeight = isLandscape ? 280 : 300;

  // Preparar datos para Victory
  const chartData: ChartDataPoint[] = labels.map((label, index) => ({
    x: index,
    y: dataIncomes[index] || 0,
    label
  }));

  const hasValidData = chartData.length > 0 && chartData.some((d) => d.y > 0);
  const safeChartData = hasValidData ? chartData : [{ x: 0, y: 0, label: 'Sin datos' }];

  // Calcular dominio Y
  const yValues = safeChartData.map((d) => d.y);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues, 1);
  const yPadding = (maxY - minY) * 0.15;

  const formatYAxis = (val: number) => {
    if (Math.abs(val) >= 1000000) {
      return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (Math.abs(val) >= 1000) {
      return `${(val / 1000).toFixed(0)}K`;
    }
    return val.toFixed(0);
  };

  useEffect(() => {
    if (dataCategory) {
      fetchCategory();
    }
  }, [dataCategory, numMonths]);

  const fetchIncomesOnlyCategory = async (foundCategory: DropDownSelectFormat) => {
    setDataCategory(foundCategory);
  };

  const fetchCategory = async () => {
    try {
      if (!dataCategory) return;

      setActivePoint(null);
      setLoading(true);
      const params = { numMonths };
      const { data } = await findLastIncomesMonthsFromOnlyCategory(dataCategory.id, params);
      setLoading(false);

      setLabels(data.labels);
      setCategoryLabel(dataCategory.label);
      setAverage(data.average);
      setPreviousAverage(data.previosAverage);
      setSum(data.sum);

      if (data.graph.length > 0) {
        setDataIncomes(data.graph);
      } else {
        setDataIncomes([0]);
      }
    } catch (e) {
      setLoading(false);
      showError(e);
    }
  };

  const updateNum = (val: number) => {
    setNumMonths(val);
  };

  useEffect(() => {
    if (activePoint !== null) {
      const timeout = setTimeout(() => {
        setActivePoint(null);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [activePoint]);

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.TEXT_PRIMARY }]}>Evolución por categorías</Text>
          <Text style={[styles.headerSubtitle, { color: colors.TEXT_SECONDARY }]}>
            Ingresos en los últimos {numMonths} meses
          </Text>
        </View>
        <CheckBoxOptions navigation={navigation} updateNum={updateNum} />
      </View>

      {/* Selector */}
      <SelectOnlyCategory searchType={1} handleCategoryChange={fetchIncomesOnlyCategory} ref={selectOnlyCategoryRef} />

      {loading ? (
        <MyLoading />
      ) : (
        <View>
          {/* Stats Cards */}
          {categoryLabel && (
            <View style={[styles.statsContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
              <Text style={[styles.categoryName, { color: colors.SUCCESS }]} numberOfLines={1}>
                {categoryLabel}
              </Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Promedio</Text>
                  <Text
                    style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {NumberFormat(average)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Anterior</Text>
                  <Text
                    style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {NumberFormat(previousAverage)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Total</Text>
                  <Text
                    style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {NumberFormat(sum)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Gráfico con tooltip integrado */}
          <View style={[styles.chartContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
            {/* Tooltip dentro del contenedor del gráfico */}
            {activePoint && (
              <View style={[styles.tooltip, { backgroundColor: colors.SUCCESS }]}>
                <Text style={styles.tooltipMonth}>{activePoint.label}</Text>
                <Text style={styles.tooltipValue}>{NumberFormat(activePoint.y)}</Text>
              </View>
            )}

            <VictoryChart
              width={chartWidth}
              height={chartHeight}
              domain={{ y: [minY - yPadding, maxY + yPadding] }}
              domainPadding={{ x: 25 }}
              padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
            >
              <VictoryAxis
                tickValues={safeChartData.map((d) => d.x)}
                tickFormat={(val: any) => {
                  const item = safeChartData[Math.round(val)];
                  return item?.label.substring(0, 3) || '';
                }}
                style={{
                  axis: { stroke: colors.BORDER, strokeWidth: 1.5 },
                  tickLabels: {
                    fill: colors.TEXT_SECONDARY,
                    fontSize: 10,
                    fontWeight: '600',
                    angle: -45,
                    textAnchor: 'end',
                    padding: 3
                  },
                  grid: { stroke: 'transparent' }
                }}
              />

              <VictoryAxis
                dependentAxis
                tickFormat={formatYAxis}
                style={{
                  axis: { stroke: colors.BORDER, strokeWidth: 1.5 },
                  tickLabels: {
                    fill: colors.TEXT_SECONDARY,
                    fontSize: 10,
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

              {/* Área de relleno */}
              <VictoryArea
                data={safeChartData}
                interpolation="monotoneX"
                style={{
                  data: {
                    fill: colors.SUCCESS,
                    fillOpacity: 0.15,
                    stroke: 'transparent'
                  }
                }}
              />

              {/* Línea */}
              <VictoryLine
                data={safeChartData}
                interpolation="monotoneX"
                style={{
                  data: {
                    stroke: colors.SUCCESS,
                    strokeWidth: 3,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round'
                  }
                }}
              />

              {/* Puntos sin labels */}
              <VictoryScatter
                data={safeChartData}
                size={({ datum }) => (activePoint?.x === datum.x ? 10 : 5)}
                style={{
                  data: {
                    fill: colors.SUCCESS,
                    stroke: ({ datum }) => (activePoint?.x === datum.x ? colors.CARD_BACKGROUND : colors.SUCCESS),
                    strokeWidth: ({ datum }) => (activePoint?.x === datum.x ? 3 : 0)
                  }
                }}
                events={[
                  {
                    target: 'data',
                    eventHandlers: {
                      onPressIn: (_evt: any, props: any) => {
                        const point = safeChartData.find((d) => d.x === props.datum.x);
                        if (point) setActivePoint(point);
                        return [];
                      }
                    }
                  }
                ]}
              />
            </VictoryChart>

            {/* Leyenda compacta */}
            <View style={styles.legendContainer}>
              <View style={[styles.legendDot, { backgroundColor: colors.SUCCESS }]} />
              <Text style={[styles.legendText, { color: colors.TEXT_PRIMARY }]}>Ingresos</Text>
            </View>
          </View>

          <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>Toca los puntos para ver valores</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  statsContainer: {
    padding: 14,
    borderRadius: 12,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12
  },
  statItem: {
    flex: 1
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800'
  },
  chartContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative'
  },
  tooltip: {
    position: 'absolute',
    top: 35,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  tooltipValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  tooltipMonth: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    gap: 6
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600'
  },
  hint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic'
  }
});
