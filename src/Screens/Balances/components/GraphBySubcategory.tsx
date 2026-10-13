import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryScatter,
  VictoryArea
} from 'victory-native';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import {
  findLastMonthsFromOnlyCategory,
  getExpensesLastMonthsFromSubcategory
} from '../../../services/expenses';

// Components
import SelectJoinCategory, {
  SelectJoinCategoryHandle
} from '../../../components/dropDown/SelectJoinCategory';
import CheckBoxOptions from '../../../components/checbox/CheckBoxOptions';
import MyLoading from '../../../components/loading/MyLoading';

// Types
import { BalanceStackParamList } from '../../../shared/types';
import {
  SubcategorySelection,
  CategorySelection
} from '../../../shared/types/components/dropDown/SelectJoinCategory.type';

// Utils
import { cutText, NumberFormat } from '../../../utils/Helpers';
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

type GraphBySubcategoryNavigationProp = StackNavigationProp<BalanceStackParamList, 'cashFlow'>;

interface GraphBySubcategoryProps {
  navigation: GraphBySubcategoryNavigationProp;
}

interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
}

// Datos del gráfico (sin la clave de la petición)
type GraphResult = {
  labels: string[];
  graph: number[];
  categoryLabel: string;
  average: number;
  previousAverage: number;
  sum: number;
};

// Resultado junto con la petición para la que se cargó
type FetchedResult = GraphResult & { key: string };

// Punto activo junto con la petición en la que se tocó
type ActivePoint = { key: string; point: ChartDataPoint };

// Datos que Victory entrega al handler de eventos de un punto
type ScatterEventProps = { datum: { x: number } };

const DEFAULT_NUM_MONTHS = 3;
const TOOLTIP_TIMEOUT_MS = 3000;

const EMPTY_RESULT: GraphResult = {
  labels: [''],
  graph: [0],
  categoryLabel: '',
  average: 0,
  previousAverage: 0,
  sum: 0
};

const NO_DATA: ChartDataPoint[] = [{ x: 0, y: 0, label: 'Sin datos' }];

const formatYAxis = (val: number): string => {
  if (Math.abs(val) >= 1000000) {
    return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (Math.abs(val) >= 1000) {
    return `${(val / 1000).toFixed(0)}K`;
  }
  return val.toFixed(0);
};

const fetchSubcategoryResult = async (
  subcategory: SubcategorySelection,
  numMonths: number
): Promise<GraphResult> => {
  const { data } = await getExpensesLastMonthsFromSubcategory(subcategory.value, { numMonths });
  return {
    labels: data.labels,
    graph: data.graph.length > 0 ? data.graph : [0],
    categoryLabel: subcategory.label,
    average: data.average,
    previousAverage: 0,
    sum: data.sum
  };
};

const fetchCategoryResult = async (
  category: CategorySelection,
  numMonths: number
): Promise<GraphResult> => {
  if (!category.id) return EMPTY_RESULT;

  const { data } = await findLastMonthsFromOnlyCategory(category.id, { numMonths });
  return {
    labels: data.labels,
    graph: data.graph.length > 0 ? data.graph : [0],
    categoryLabel: category.label,
    average: data.average,
    previousAverage: data.previosAverage,
    sum: 0
  };
};

export default function GraphBySubcategory({ navigation }: GraphBySubcategoryProps) {
  const colors = useThemeColors();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const selectJoinCategoryRef = useRef<SelectJoinCategoryHandle>(null);

  const [category, setCategory] = useState<CategorySelection>();
  const [subcategory, setSubcategory] = useState<SubcategorySelection | null>(null);
  const [numMonths, setNumMonths] = useState(DEFAULT_NUM_MONTHS);
  const [fetched, setFetched] = useState<FetchedResult | null>(null);
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);

  // Identifica la petición actual (null si aún no hay nada seleccionado)
  let requestKey: string | null = null;
  if (subcategory) requestKey = `sub-${subcategory.value}-${numMonths}`;
  else if (category) requestKey = `cat-${category.id}-${numMonths}`;

  // Hay carga mientras los datos no correspondan a la petición actual
  const loading = requestKey !== null && fetched?.key !== requestKey;
  const result: GraphResult = fetched && fetched.key === requestKey ? fetched : EMPTY_RESULT;

  // El tooltip solo vale para la petición en la que se abrió
  const activeDatum = activePoint?.key === requestKey ? activePoint.point : null;

  // Responsive: ajustar según orientación
  const isLandscape = windowWidth > windowHeight;
  const chartWidth = windowWidth - 32;
  const chartHeight = isLandscape ? 280 : 300;

  // Carga al cambiar la selección o el número de meses
  useEffect(() => {
    if (!requestKey) return;

    let active = true;

    const load = async (): Promise<void> => {
      try {
        const data = subcategory
          ? await fetchSubcategoryResult(subcategory, numMonths)
          : await fetchCategoryResult(category as CategorySelection, numMonths);
        if (active) setFetched({ key: requestKey, ...data });
      } catch (e) {
        if (!active) return;
        showError(e);
        setFetched({ key: requestKey, ...EMPTY_RESULT });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [requestKey, category, subcategory, numMonths]);

  // El tooltip se oculta solo a los 3 segundos
  useEffect(() => {
    if (!activePoint) return;

    const timeout = setTimeout(() => setActivePoint(null), TOOLTIP_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [activePoint]);

  // Preparar datos para Victory
  const safeChartData = useMemo(() => {
    const chartData: ChartDataPoint[] = result.labels.map((label, index) => ({
      x: index,
      y: result.graph[index] ?? 0,
      label
    }));
    return chartData.some((d) => d.y > 0) ? chartData : NO_DATA;
  }, [result]);

  // Calcular dominio Y
  const { minY, maxY, yPadding } = useMemo(() => {
    const yValues = safeChartData.map((d) => d.y);
    const min = Math.min(...yValues, 0);
    const max = Math.max(...yValues, 1);
    return { minY: min, maxY: max, yPadding: (max - min) * 0.15 };
  }, [safeChartData]);

  const isHighlighted = (x: number): boolean => activeDatum?.x === x;

  const fetchExpensesSubcategory = (foundSubcategory: SubcategorySelection) => {
    setSubcategory(foundSubcategory);
  };

  const fetchExpensesOnlyCategory = (foundCategory: CategorySelection) => {
    setCategory(foundCategory);
    setSubcategory(null);
  };

  const updateNum = (val: number) => {
    selectJoinCategoryRef.current?.resetSubcategory();
    setSubcategory(null);
    setNumMonths(val);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.TEXT_PRIMARY }]}>
            Evolución por categorías
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.TEXT_SECONDARY }]}>
            Gastos en los últimos {numMonths} meses
          </Text>
        </View>
        <CheckBoxOptions navigation={navigation} updateNum={updateNum} />
      </View>

      {/* Selector */}
      <SelectJoinCategory
        fetchExpensesSubcategory={fetchExpensesSubcategory}
        fetchExpensesOnlyCategory={fetchExpensesOnlyCategory}
        ref={selectJoinCategoryRef}
      />

      {loading ? (
        <MyLoading />
      ) : (
        <View>
          {/* Stats Cards */}
          {result.categoryLabel ? (
            <View
              style={[
                styles.statsContainer,
                { backgroundColor: colors.CARD_BACKGROUND, shadowColor: colors.BLACK }
              ]}
            >
              <Text style={[styles.categoryName, { color: colors.PRIMARY }]} numberOfLines={1}>
                {cutText(result.categoryLabel, 30)}
              </Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Promedio</Text>
                  <Text
                    style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {NumberFormat(result.average)}
                  </Text>
                </View>

                {result.previousAverage > 0 && (
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                      Anterior
                    </Text>
                    <Text
                      style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {NumberFormat(result.previousAverage)}
                    </Text>
                  </View>
                )}

                {result.sum > 0 && (
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Total</Text>
                    <Text
                      style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {NumberFormat(result.sum)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : null}

          {/* Gráfico con tooltip integrado */}
          <View
            style={[
              styles.chartContainer,
              { backgroundColor: colors.CARD_BACKGROUND, shadowColor: colors.BLACK }
            ]}
          >
            {/* Tooltip dentro del contenedor del gráfico */}
            {activeDatum && (
              <View
                style={[
                  styles.tooltip,
                  { backgroundColor: colors.ERROR, shadowColor: colors.BLACK }
                ]}
              >
                <Text style={[styles.tooltipMonth, { color: colors.WHITE }]}>
                  {activeDatum.label}
                </Text>
                <Text style={[styles.tooltipValue, { color: colors.WHITE }]}>
                  {NumberFormat(activeDatum.y)}
                </Text>
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
                    fill: colors.ERROR,
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
                    stroke: colors.ERROR,
                    strokeWidth: 3,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round'
                  }
                }}
              />

              {/* Puntos sin labels */}
              <VictoryScatter
                data={safeChartData}
                size={({ datum }) => (isHighlighted(datum.x) ? 10 : 5)}
                style={{
                  data: {
                    fill: colors.ERROR,
                    stroke: ({ datum }) =>
                      isHighlighted(datum.x) ? colors.CARD_BACKGROUND : colors.ERROR,
                    strokeWidth: ({ datum }) => (isHighlighted(datum.x) ? 3 : 0)
                  }
                }}
                events={[
                  {
                    target: 'data',
                    eventHandlers: {
                      onPressIn: (_evt: unknown, props: ScatterEventProps) => {
                        const point = safeChartData.find((d) => d.x === props.datum.x);
                        if (point && requestKey) setActivePoint({ key: requestKey, point });
                        return [];
                      }
                    }
                  }
                ]}
              />
            </VictoryChart>

            {/* Leyenda compacta */}
            <View style={styles.legendContainer}>
              <View style={[styles.legendDot, { backgroundColor: colors.ERROR }]} />
              <Text style={[styles.legendText, { color: colors.TEXT_PRIMARY }]}>Gastos</Text>
            </View>
          </View>

          <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>
            Toca los puntos para ver valores
          </Text>
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
  headerInfo: {
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  tooltipMonth: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tooltipValue: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
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
