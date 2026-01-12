import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Icon } from 'react-native-elements';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { getSavingsPeriodAnalysis } from '~/services/savings';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MonthRangePicker from '~/components/pickers/MonthRangePicker';
import MyLoading from '~/components/loading/MyLoading';

// Types
import { BalanceStackParamList } from '~/shared/types';
import { SavingsPeriodAnalysisResponse } from '~/shared/types/services';

// Hooks & Utils
import { useThemeColors } from '~/customHooks/useThemeColors';
import { NumberFormat } from '~/utils/Helpers';
import { showError } from '~/utils/showError';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type SavingsAnalysisScreenNavigationProp = StackNavigationProp<
  BalanceStackParamList,
  'savingsAnalysis'
>;

interface SavingsAnalysisScreenProps {
  navigation: SavingsAnalysisScreenNavigationProp;
}

export default function SavingsAnalysisScreen({ navigation }: SavingsAnalysisScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.savingsAnalysis;

  // Estados
  const [loading, setLoading] = useState<boolean>(false);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 3))
  );
  const [endDate, setEndDate] = useState(new Date());
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  const [analysisData, setAnalysisData] = useState<SavingsPeriodAnalysisResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleAnalyze = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data } = await getSavingsPeriodAnalysis({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        compareWithPrevious
      });
      setAnalysisData(data);
      setHasSearched(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  const getTrendIcon = () => {
    if (!analysisData) return 'minus';
    switch (analysisData.trend.direction) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'trending-neutral';
    }
  };

  const getTrendColor = () => {
    if (!analysisData) return colors.TEXT_SECONDARY;
    switch (analysisData.trend.direction) {
      case 'up':
        return colors.SUCCESS;
      case 'down':
        return colors.ERROR;
      default:
        return colors.WARNING;
    }
  };

  const renderMetricCard = (
    title: string,
    value: string,
    icon: string,
    color: string,
    subtitle?: string
  ) => (
    <View style={[styles.metricCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
      <View style={[styles.metricIconContainer, { backgroundColor: color + '15' }]}>
        <Icon type="material-community" name={icon} size={24} color={color} />
      </View>
      <View style={styles.metricContent}>
        <Text style={[styles.metricTitle, { color: colors.TEXT_SECONDARY }]}>{title}</Text>
        <Text style={[styles.metricValue, { color: colors.TEXT_PRIMARY }]}>{value}</Text>
        {subtitle && (
          <Text style={[styles.metricSubtitle, { color: colors.TEXT_SECONDARY }]}>{subtitle}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Sección de Filtros */}
          <View style={[styles.filterSection, { backgroundColor: colors.CARD_BACKGROUND }]}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
              Configuración del Análisis
            </Text>

            {/* Selector de rango de meses */}
            <MonthRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              label="Período de Análisis"
            />

            {/* Switch para comparación */}
            <View style={styles.switchContainer}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.TEXT_PRIMARY }]}>
                  Comparar con período anterior
                </Text>
                <Text style={[styles.switchDescription, { color: colors.TEXT_SECONDARY }]}>
                  Muestra diferencias con el período previo
                </Text>
              </View>
              <Switch
                value={compareWithPrevious}
                onValueChange={setCompareWithPrevious}
                trackColor={{ false: colors.GRAY, true: colors.PRIMARY + '80' }}
                thumbColor={compareWithPrevious ? colors.PRIMARY : colors.WHITE}
              />
            </View>

            {/* Botón Analizar */}
            <TouchableOpacity
              style={[styles.analyzeButton, { backgroundColor: colors.PRIMARY }]}
              onPress={handleAnalyze}
              activeOpacity={0.7}
            >
              <Icon type="material-community" name="chart-line" size={20} color={colors.WHITE} />
              <Text style={[styles.analyzeButtonText, { color: colors.WHITE }]}>
                Analizar Período
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <MyLoading />
            </View>
          )}

          {/* Resultados */}
          {!loading && hasSearched && analysisData && (
            <>
              {/* Resumen Principal */}
              <View style={styles.resultsSection}>
                <View style={styles.sectionHeader}>
                  <Icon
                    type="material-community"
                    name="chart-box-outline"
                    size={20}
                    color={colors.PRIMARY}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                    Resumen del Período
                  </Text>
                </View>

                <View style={styles.metricsGrid}>
                  {renderMetricCard(
                    'Ahorro Total',
                    NumberFormat(analysisData.periodData.totalSaving),
                    'piggy-bank',
                    colors.SUCCESS,
                    `${analysisData.periodData.monthsCount} ${analysisData.periodData.monthsCount === 1 ? 'mes' : 'meses'}`
                  )}
                  {renderMetricCard(
                    'Promedio Mensual',
                    NumberFormat(analysisData.periodData.avgMonthlySaving),
                    'calculator',
                    colors.INFO
                  )}
                  {renderMetricCard(
                    'Porcentaje de Ahorro',
                    `${analysisData.periodData.savingPercentage.toFixed(1)}%`,
                    'percent',
                    colors.PRIMARY,
                    'Del total de ingresos'
                  )}
                  {renderMetricCard(
                    'Tendencia',
                    `${analysisData.trend.percentage > 0 ? '+' : ''}${analysisData.trend.percentage.toFixed(1)}%`,
                    getTrendIcon(),
                    getTrendColor(),
                    analysisData.trend.direction === 'up'
                      ? 'Mejorando'
                      : analysisData.trend.direction === 'down'
                        ? 'Disminuyendo'
                        : 'Estable'
                  )}
                </View>

                {/* Totales adicionales */}
                <View style={[styles.totalsCard, { backgroundColor: colors.CARD_BACKGROUND }]}>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.TEXT_SECONDARY }]}>
                      Ingresos Totales
                    </Text>
                    <Text style={[styles.totalValue, { color: colors.SUCCESS }]}>
                      {NumberFormat(analysisData.periodData.totalIncome)}
                    </Text>
                  </View>
                  <View
                    style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: colors.BORDER }]}
                  >
                    <Text style={[styles.totalLabel, { color: colors.TEXT_SECONDARY }]}>
                      Gastos Totales
                    </Text>
                    <Text style={[styles.totalValue, { color: colors.ERROR }]}>
                      {NumberFormat(analysisData.periodData.totalExpense)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Comparación con Período Anterior */}
              {analysisData.comparison && (
                <View style={styles.resultsSection}>
                  <View style={styles.sectionHeader}>
                    <Icon
                      type="material-community"
                      name="compare"
                      size={20}
                      color={colors.PRIMARY}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                      Comparación con Período Anterior
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.comparisonCard,
                      { backgroundColor: colors.CARD_BACKGROUND, borderLeftColor: colors.PRIMARY }
                    ]}
                  >
                    <View style={styles.comparisonRow}>
                      <Text style={[styles.comparisonLabel, { color: colors.TEXT_SECONDARY }]}>
                        Ahorro período anterior
                      </Text>
                      <Text style={[styles.comparisonValue, { color: colors.TEXT_PRIMARY }]}>
                        {NumberFormat(analysisData.comparison.previousPeriod.totalSaving)}
                      </Text>
                    </View>

                    <View style={styles.comparisonRow}>
                      <Text style={[styles.comparisonLabel, { color: colors.TEXT_SECONDARY }]}>
                        Diferencia
                      </Text>
                      <Text
                        style={[
                          styles.comparisonValue,
                          {
                            color:
                              analysisData.comparison.difference >= 0
                                ? colors.SUCCESS
                                : colors.ERROR
                          }
                        ]}
                      >
                        {analysisData.comparison.difference >= 0 ? '+' : ''}
                        {NumberFormat(analysisData.comparison.difference)}
                      </Text>
                    </View>

                    <View style={styles.comparisonRow}>
                      <Text style={[styles.comparisonLabel, { color: colors.TEXT_SECONDARY }]}>
                        Variación
                      </Text>
                      <View style={styles.percentageContainer}>
                        <Icon
                          type="material-community"
                          name={
                            analysisData.comparison.percentageChange >= 0
                              ? 'arrow-up-bold'
                              : 'arrow-down-bold'
                          }
                          size={18}
                          color={
                            analysisData.comparison.percentageChange >= 0
                              ? colors.SUCCESS
                              : colors.ERROR
                          }
                        />
                        <Text
                          style={[
                            styles.percentageText,
                            {
                              color:
                                analysisData.comparison.percentageChange >= 0
                                  ? colors.SUCCESS
                                  : colors.ERROR
                            }
                          ]}
                        >
                          {Math.abs(analysisData.comparison.percentageChange).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Desglose Mensual */}
              <View style={styles.resultsSection}>
                <View style={styles.sectionHeader}>
                  <Icon
                    type="material-community"
                    name="calendar-month"
                    size={20}
                    color={colors.PRIMARY}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                    Desglose Mensual
                  </Text>
                </View>

                <View style={[styles.tableContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
                  {/* Header de tabla */}
                  <View style={[styles.tableHeader, { borderBottomColor: colors.BORDER }]}>
                    <Text style={[styles.tableHeaderText, { color: colors.TEXT_PRIMARY, flex: 2 }]}>
                      Mes
                    </Text>
                    <Text style={[styles.tableHeaderText, { color: colors.TEXT_PRIMARY, flex: 2 }]}>
                      Ahorro
                    </Text>
                    <Text style={[styles.tableHeaderText, { color: colors.TEXT_PRIMARY, flex: 1 }]}>
                      %
                    </Text>
                  </View>

                  {/* Filas de datos */}
                  {analysisData.monthlyBreakdown.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.tableRow,
                        index !== analysisData.monthlyBreakdown.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.BORDER
                        }
                      ]}
                    >
                      <Text style={[styles.tableCell, { color: colors.TEXT_PRIMARY, flex: 2 }]}>
                        {item.month}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          {
                            color: item.saving >= 0 ? colors.SUCCESS : colors.ERROR,
                            flex: 2,
                            fontWeight: '600'
                          }
                        ]}
                      >
                        {NumberFormat(item.saving)}
                      </Text>
                      <View style={[styles.percentageBadge, { flex: 1 }]}>
                        <Text
                          style={[
                            styles.percentageBadgeText,
                            {
                              color:
                                item.savingPercentage >= 20
                                  ? colors.SUCCESS
                                  : item.savingPercentage >= 10
                                    ? colors.WARNING
                                    : colors.ERROR
                            }
                          ]}
                        >
                          {item.savingPercentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Estado inicial */}
          {!loading && !hasSearched && (
            <View style={styles.emptyState}>
              <Icon
                type="material-community"
                name="chart-timeline-variant"
                size={64}
                color={colors.TEXT_SECONDARY}
              />
              <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                Selecciona un período y presiona &quot;Analizar Período&quot;
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.TEXT_SECONDARY }]}>
                Obtén estadísticas detalladas de tu ahorro
              </Text>
            </View>
          )}

          {/* Estado vacío cuando no hay datos */}
          {!loading && hasSearched && analysisData && analysisData.periodData.monthsCount === 0 && (
            <View style={styles.emptyState}>
              <Icon
                type="material-community"
                name="database-off"
                size={64}
                color={colors.TEXT_SECONDARY}
              />
              <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                No hay datos de ahorro en este período
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.TEXT_SECONDARY }]}>
                Intenta con un rango de fechas diferente
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 12
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingVertical: 8
  },
  switchLabel: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  },
  switchDescription: {
    fontSize: SMALL - 1,
    marginTop: 2
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8
  },
  analyzeButtonText: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  loadingContainer: {
    paddingVertical: 40
  },
  resultsSection: {
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  metricCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  metricContent: {
    gap: 4
  },
  metricTitle: {
    fontSize: SMALL - 1,
    fontWeight: '500'
  },
  metricValue: {
    fontSize: MEDIUM + 2,
    fontWeight: 'bold'
  },
  metricSubtitle: {
    fontSize: SMALL - 2,
    marginTop: 2
  },
  totalsCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10
  },
  totalLabel: {
    fontSize: SMALL + 1,
    fontWeight: '500'
  },
  totalValue: {
    fontSize: MEDIUM + 1,
    fontWeight: '700'
  },
  comparisonCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  comparisonLabel: {
    fontSize: SMALL + 1,
    fontWeight: '500'
  },
  comparisonValue: {
    fontSize: MEDIUM + 1,
    fontWeight: '700'
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  percentageText: {
    fontSize: MEDIUM + 1,
    fontWeight: '700'
  },
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2
  },
  tableHeaderText: {
    fontSize: SMALL,
    fontWeight: '700',
    textAlign: 'center'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  tableCell: {
    fontSize: SMALL,
    textAlign: 'center'
  },
  percentageBadge: {
    alignItems: 'center'
  },
  percentageBadgeText: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32
  },
  emptySubtext: {
    fontSize: SMALL,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32
  }
});
