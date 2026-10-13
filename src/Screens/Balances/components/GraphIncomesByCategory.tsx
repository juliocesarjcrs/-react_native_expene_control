import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter
} from 'victory-native';
import type { StackNavigationProp } from '@react-navigation/stack';

// Services
import { findLastIncomesMonthsFromOnlyCategory } from '~/services/incomes';

// Components
import SelectOnlyCategory from '~/components/dropDown/SelectOnlyCategory';
import CheckBoxOptions from '~/components/checbox/CheckBoxOptions';
import MyLoading from '~/components/loading/MyLoading';

// Types
import type { DropDownSelectFormat } from '~/shared/types/components';
import type { BalanceStackParamList } from '~/shared/types';

// Utils
import { NumberFormat } from '~/utils/Helpers';
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

interface CategoryResult {
  key: string;
  categoryLabel: string;
  labels: string[];
  dataIncomes: number[];
  average: number;
  previousAverage: number;
  sum: number;
}

interface ActivePointState {
  resultKey: string;
  point: ChartDataPoint;
}

const DEFAULT_MONTHS = 3;
const TOOLTIP_TIMEOUT_MS = 3000;
const LANDSCAPE_CHART_HEIGHT = 280;
const PORTRAIT_CHART_HEIGHT = 300;
const CHART_HORIZONTAL_MARGIN = 32;
const Y_PADDING_RATIO = 0.15;
const MILLION = 1000000;
const THOUSAND = 1000;
const SHADOW_COLOR = '#000';
const TOOLTIP_TEXT_COLOR = '#FFFFFF';

const EMPTY_RESULT: CategoryResult = {
  key: '',
  categoryLabel: '',
  labels: [''],
  dataIncomes: [0],
  average: 0,
  previousAverage: 0,
  sum: 0
};

const formatYAxis = (val: number): string => {
  if (Math.abs(val) >= MILLION) {
    return `${(val / MILLION).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (Math.abs(val) >= THOUSAND) {
    return `${(val / THOUSAND).toFixed(0)}K`;
  }
  return val.toFixed(0);
};

export default function GraphIncomesByCategory({ navigation }: GraphIncomesByCategoryProps) {
  const colors = useThemeColors();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [dataCategory, setDataCategory] = useState<DropDownSelectFormat>();
  const [numMonths, setNumMonths] = useState<number>(DEFAULT_MONTHS);
  const [result, setResult] = useState<CategoryResult | null>(null);
  const [activePointState, setActivePointState] = useState<ActivePointState | null>(null);

  // `loading` se deriva: hay carga mientras el resultado guardado no corresponda
  // a la categoría y meses actuales (sin setState síncrono en el efecto).
  const requestKey = dataCategory ? `${dataCategory.id}|${numMonths}` : null;
  const loading = requestKey !== null && result?.key !== requestKey;

  const { categoryLabel, labels, dataIncomes, average, previousAverage, sum } =
    result ?? EMPTY_RESULT;

  // El punto activo solo es válido para el resultado con el que se tocó
  const activePoint = activePointState?.resultKey === result?.key ? activePointState?.point : null;

  // Responsive: ajustar según orientación
  const isLandscape = windowWidth > windowHeight;
  const chartWidth = windowWidth - CHART_HORIZONTAL_MARGIN;
  const chartHeight = isLandscape ? LANDSCAPE_CHART_HEIGHT : PORTRAIT_CHART_HEIGHT;

  // Preparar datos para Victory
  const chartData: ChartDataPoint[] = labels.map((label, index) => ({
    x: index,
    y: dataIncomes[index] ?? 0,
    label
  }));

  const hasValidData = chartData.length > 0 && chartData.some((d) => d.y > 0);
  const safeChartData: ChartDataPoint[] = hasValidData
    ? chartData
    : [{ x: 0, y: 0, label: 'Sin datos' }];

  // Calcular dominio Y
  const yValues = safeChartData.map((d) => d.y);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues, 1);
  const yPadding = (maxY - minY) * Y_PADDING_RATIO;

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: { backgroundColor: colors.BACKGROUND },
        headerTitle: { color: colors.TEXT_PRIMARY },
        headerSubtitle: { color: colors.TEXT_SECONDARY },
        card: { backgroundColor: colors.CARD_BACKGROUND },
        categoryName: { color: colors.SUCCESS },
        statLabel: { color: colors.TEXT_SECONDARY },
        statValue: { color: colors.TEXT_PRIMARY },
        tooltip: { backgroundColor: colors.SUCCESS },
        legendDot: { backgroundColor: colors.SUCCESS },
        legendText: { color: colors.TEXT_PRIMARY },
        hint: { color: colors.TEXT_SECONDARY }
      }),
    [colors]
  );

  const chartStyles = useMemo(
    () => ({
      xAxis: {
        axis: { stroke: colors.BORDER, strokeWidth: 1.5 },
        tickLabels: {
          fill: colors.TEXT_SECONDARY,
          fontSize: 10,
          fontWeight: '600' as const,
          angle: -45,
          textAnchor: 'end' as const,
          padding: 3
        },
        grid: { stroke: 'transparent' }
      },
      yAxis: {
        axis: { stroke: colors.BORDER, strokeWidth: 1.5 },
        tickLabels: {
          fill: colors.TEXT_SECONDARY,
          fontSize: 10,
          fontWeight: '600' as const,
          padding: 8
        },
        grid: {
          stroke: colors.BORDER,
          strokeWidth: 0.8,
          strokeDasharray: '3,5',
          opacity: 0.25
        }
      },
      area: {
        data: {
          fill: colors.SUCCESS,
          fillOpacity: 0.15,
          stroke: 'transparent'
        }
      },
      line: {
        data: {
          stroke: colors.SUCCESS,
          strokeWidth: 3,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const
        }
      }
    }),
    [colors]
  );

  // Cargar datos al cambiar categoría o número de meses
  useEffect(() => {
    if (!dataCategory) {
      return undefined;
    }

    let cancelled = false;
    const key = `${dataCategory.id}|${numMonths}`;

    const loadCategory = async (): Promise<void> => {
      try {
        const { data } = await findLastIncomesMonthsFromOnlyCategory(dataCategory.id, {
          numMonths
        });

        if (!cancelled) {
          setResult({
            key,
            categoryLabel: dataCategory.label,
            labels: data.labels,
            dataIncomes: data.graph.length > 0 ? data.graph : [0],
            average: data.average,
            previousAverage: data.previosAverage,
            sum: data.sum
          });
        }
      } catch (error) {
        if (!cancelled) {
          setResult({ ...EMPTY_RESULT, key });
          showError(error);
        }
      }
    };

    void loadCategory();

    return () => {
      cancelled = true;
    };
  }, [dataCategory, numMonths]);

  // Ocultar el tooltip después de unos segundos
  useEffect(() => {
    if (activePointState === null) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setActivePointState(null);
    }, TOOLTIP_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [activePointState]);

  const handleCategoryChange = (foundCategory: DropDownSelectFormat): void => {
    setDataCategory(foundCategory);
  };

  const updateNum = (val: number): void => {
    setNumMonths(val);
  };

  const handlePointPress = (datumX: number): void => {
    const point = safeChartData.find((d) => d.x === datumX);
    if (point && result) {
      setActivePointState({ resultKey: result.key, point });
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>
            Evolución por categorías
          </Text>
          <Text style={[styles.headerSubtitle, dynamicStyles.headerSubtitle]}>
            Ingresos en los últimos {numMonths} meses
          </Text>
        </View>
        <CheckBoxOptions navigation={navigation} updateNum={updateNum} />
      </View>

      {/* Selector */}
      <SelectOnlyCategory searchType={1} handleCategoryChange={handleCategoryChange} />

      {loading ? (
        <MyLoading />
      ) : (
        <View>
          {/* Stats Cards */}
          {categoryLabel !== '' && (
            <View style={[styles.statsContainer, dynamicStyles.card]}>
              <Text style={[styles.categoryName, dynamicStyles.categoryName]} numberOfLines={1}>
                {categoryLabel}
              </Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Promedio</Text>
                  <Text
                    style={[styles.statValue, dynamicStyles.statValue]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {NumberFormat(average)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Anterior</Text>
                  <Text
                    style={[styles.statValue, dynamicStyles.statValue]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {NumberFormat(previousAverage)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Total</Text>
                  <Text
                    style={[styles.statValue, dynamicStyles.statValue]}
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
          <View style={[styles.chartContainer, dynamicStyles.card]}>
            {/* Tooltip dentro del contenedor del gráfico */}
            {activePoint && (
              <View style={[styles.tooltip, dynamicStyles.tooltip]}>
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
                tickFormat={(val: number) => {
                  const item = safeChartData[Math.round(val)];
                  return item ? item.label.substring(0, 3) : '';
                }}
                style={chartStyles.xAxis}
              />

              <VictoryAxis dependentAxis tickFormat={formatYAxis} style={chartStyles.yAxis} />

              {/* Área de relleno */}
              <VictoryArea
                data={safeChartData}
                interpolation="monotoneX"
                style={chartStyles.area}
              />

              {/* Línea */}
              <VictoryLine
                data={safeChartData}
                interpolation="monotoneX"
                style={chartStyles.line}
              />

              {/* Puntos sin labels */}
              <VictoryScatter
                data={safeChartData}
                size={({ datum }) => (activePoint?.x === datum.x ? 10 : 5)}
                style={{
                  data: {
                    fill: colors.SUCCESS,
                    stroke: ({ datum }) =>
                      activePoint?.x === datum.x ? colors.CARD_BACKGROUND : colors.SUCCESS,
                    strokeWidth: ({ datum }) => (activePoint?.x === datum.x ? 3 : 0)
                  }
                }}
                events={[
                  {
                    target: 'data',
                    eventHandlers: {
                      onPressIn: (_evt: unknown, props: { datum: ChartDataPoint }) => {
                        handlePointPress(props.datum.x);
                        return [];
                      }
                    }
                  }
                ]}
              />
            </VictoryChart>

            {/* Leyenda compacta */}
            <View style={styles.legendContainer}>
              <View style={[styles.legendDot, dynamicStyles.legendDot]} />
              <Text style={[styles.legendText, dynamicStyles.legendText]}>Ingresos</Text>
            </View>
          </View>

          <Text style={[styles.hint, dynamicStyles.hint]}>Toca los puntos para ver valores</Text>
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
  headerText: {
    flex: 1
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
    shadowColor: SHADOW_COLOR,
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
    shadowColor: SHADOW_COLOR,
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
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  tooltipValue: {
    color: TOOLTIP_TEXT_COLOR,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  tooltipMonth: {
    color: TOOLTIP_TEXT_COLOR,
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
