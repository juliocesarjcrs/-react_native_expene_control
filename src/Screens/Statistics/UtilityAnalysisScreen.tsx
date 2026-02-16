import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';

// Services
import { findExpensesBySubcategories } from '~/services/expenses';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import FilterSelector, { AnalysisFilters } from './components/FilterSelector';
import { UtilitySituationDisplay } from './components/UtilitySituationDisplay';

// Types
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';
import { UtilityConsumption } from '~/shared/types/screens/Statistics/commentary-analysis.types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Icon } from 'react-native-elements';

// Utils
import { showError } from '~/utils/showError';
import { NumberFormat, DateFormat } from '~/utils/Helpers';
import {
  calculateConsumptionPerPerson,
  parseUtilityCommentary
} from '~/utils/commentaryParser/utilityParser';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';
type ScreenNavigationProp = StackNavigationProp<StatisticsStackParamList, 'utilityAnalysis'>;
type ScreenRouteProp = RouteProp<StatisticsStackParamList, 'utilityAnalysis'>;

interface ScreenProps {
  navigation?: ScreenNavigationProp;
  route?: ScreenRouteProp;
}

export default function UtilityAnalysisScreen({ navigation, route }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.utilityAnalysis;

  // Estados
  const [loading, setLoading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<UtilityConsumption[]>([]);
  const [currentFilters, setCurrentFilters] = useState<AnalysisFilters | null>(null);

  const loadData = async (filters: AnalysisFilters) => {
    if (!filters.subcategoryId) return;

    try {
      setLoading(true);
      setCurrentFilters(filters);

      const { data } = await findExpensesBySubcategories({
        subcategoriesId: [filters.subcategoryId],
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      // Parsear comentarios con nuevo parser optimizado
      const parsed = data.expenses
        .map((expense: any) =>
          parseUtilityCommentary(expense.commentary, expense.cost, expense.date)
        )
        .filter((item): item is UtilityConsumption => item !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setParsedData(parsed);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  // Calcular estadísticas mejoradas
  const stats = parsedData.length > 0 ? calculateConsumptionPerPerson(parsedData) : null;
  const avgCost =
    parsedData.length > 0
      ? parsedData.reduce((sum, item) => sum + item.cost, 0) / parsedData.length
      : 0;

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Filtros */}
          <FilterSelector type="expenses" onAnalyze={loadData} defaultDaysBack={365} />

          {/* Mensaje informativo */}
          {currentFilters && (
            <View style={[styles.infoBox, { backgroundColor: colors.INFO + '15' }]}>
              <Icon type="material-community" name="information" size={16} color={colors.INFO} />
              <Text style={[styles.infoText, { color: colors.TEXT_PRIMARY }]}>
                Analizando {currentFilters.subcategoryName} desde{' '}
                {DateFormat(currentFilters.startDate, 'DD MMM YYYY')} hasta{' '}
                {DateFormat(currentFilters.endDate, 'DD MMM YYYY')}
              </Text>
            </View>
          )}

          {/* Estadísticas generales */}
          {!loading && parsedData.length > 0 && (
            <>
              <View style={styles.statsGrid}>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.SUCCESS + '15',
                      borderColor: colors.SUCCESS
                    }
                  ]}
                >
                  <Icon
                    type="material-community"
                    name="chart-line"
                    size={20}
                    color={colors.SUCCESS}
                  />
                  <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
                    {parsedData.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                    Registros
                  </Text>
                </View>

                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.WARNING + '15',
                      borderColor: colors.WARNING
                    }
                  ]}
                >
                  <Icon type="material-community" name="cash" size={20} color={colors.WARNING} />
                  <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
                    {NumberFormat(Math.round(avgCost))}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Promedio</Text>
                </View>
              </View>

              {/* Consumo por persona - MEJORADO */}
              {stats && stats.withExtraCount > 0 && (
                <View
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: colors.INFO + '15',
                      borderLeftColor: colors.INFO
                    }
                  ]}
                >
                  <Text style={[styles.insightTitle, { color: colors.TEXT_PRIMARY }]}>
                    📊 Análisis de Consumo
                  </Text>

                  <View style={styles.insightRow}>
                    <Text style={[styles.insightLabel, { color: colors.TEXT_SECONDARY }]}>
                      Solos ({stats.aloneCount} registros):
                    </Text>
                    <Text style={[styles.insightValue, { color: colors.TEXT_PRIMARY }]}>
                      {stats.alone} {parsedData[0]?.unit || 'unidades'}
                    </Text>
                  </View>

                  <View style={styles.insightRow}>
                    <Text style={[styles.insightLabel, { color: colors.TEXT_SECONDARY }]}>
                      Con persona adicional ({stats.withExtraCount} registros):
                    </Text>
                    <Text style={[styles.insightValue, { color: colors.TEXT_PRIMARY }]}>
                      {stats.withExtra} {parsedData[0]?.unit || 'unidades'}
                    </Text>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />

                  <View style={styles.insightRow}>
                    <Text style={[styles.insightLabel, { color: colors.SUCCESS }]}>
                      Diferencia:
                    </Text>
                    <Text
                      style={[styles.insightValue, { color: colors.SUCCESS, fontWeight: '700' }]}
                    >
                      +{stats.difference} {parsedData[0]?.unit || 'unidades'} (+
                      {stats.percentageIncrease}%)
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Lista de consumos - CON NUEVO COMPONENTE */}
          {loading ? (
            <MyLoading />
          ) : parsedData.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                Historial de Consumo
              </Text>
              {parsedData.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.consumptionCard,
                    {
                      backgroundColor: colors.CARD_BACKGROUND,
                      borderColor: colors.BORDER,
                      borderLeftColor: item.hasExtraPerson
                        ? colors.WARNING
                        : item.hasVisits
                          ? colors.INFO
                          : (item.uninhabitedDays ?? 0) > 0
                            ? colors.ERROR
                            : item.isSolo
                              ? colors.SUCCESS
                              : colors.BORDER
                    }
                  ]}
                >
                  {/* Header */}
                  <View style={styles.consumptionHeader}>
                    <Text style={[styles.consumptionPeriod, { color: colors.TEXT_PRIMARY }]}>
                      {item.periodStart} - {item.periodEnd}
                    </Text>
                    <Text style={[styles.consumptionDate, { color: colors.TEXT_SECONDARY }]}>
                      {DateFormat(item.date, 'DD MMM YYYY')}
                    </Text>
                  </View>

                  {/* Detalles */}
                  <View style={styles.consumptionDetails}>
                    <View style={styles.consumptionItem}>
                      <Icon
                        type="material-community"
                        name="flash"
                        size={16}
                        color={colors.PRIMARY}
                      />
                      <Text style={[styles.consumptionValue, { color: colors.TEXT_PRIMARY }]}>
                        {item.consumption} {item.unit}
                      </Text>
                    </View>

                    <View style={styles.consumptionItem}>
                      <Icon
                        type="material-community"
                        name="cash"
                        size={16}
                        color={colors.SUCCESS}
                      />
                      <Text style={[styles.consumptionValue, { color: colors.TEXT_PRIMARY }]}>
                        {NumberFormat(item.cost)}
                      </Text>
                    </View>
                  </View>

                  {/* NUEVO: Componente de situación con franja gris */}
                  <UtilitySituationDisplay item={item} />
                </View>
              ))}
            </View>
          ) : currentFilters ? (
            <View style={styles.emptyState}>
              <Icon
                type="material-community"
                name="file-document-outline"
                size={48}
                color={colors.TEXT_SECONDARY}
              />
              <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                No se encontraron registros con comentarios válidos
              </Text>
              <Text style={[styles.emptyHint, { color: colors.TEXT_SECONDARY }]}>
                Formato esperado: Consumo(X Kw/M3) Fecha - Fecha [Situación]
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8
  },
  infoText: {
    flex: 1,
    fontSize: SMALL,
    lineHeight: 18
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4
  },
  statValue: {
    fontSize: MEDIUM + 2,
    fontWeight: '700',
    marginTop: 4
  },
  statLabel: {
    fontSize: SMALL - 1,
    textAlign: 'center'
  },
  insightCard: {
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 20,
    gap: 8
  },
  insightTitle: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 8
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  insightLabel: {
    fontSize: SMALL,
    flex: 1
  },
  insightValue: {
    fontSize: SMALL + 1,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    marginVertical: 4
  },
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 12
  },
  consumptionCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 12,
    gap: 8
  },
  consumptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  consumptionPeriod: {
    fontSize: SMALL + 1,
    fontWeight: '600',
    flex: 1
  },
  consumptionDate: {
    fontSize: SMALL - 1
  },
  consumptionDetails: {
    flexDirection: 'row',
    gap: 16
  },
  consumptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  consumptionValue: {
    fontSize: SMALL,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12
  },
  emptyText: {
    fontSize: SMALL + 1,
    textAlign: 'center'
  },
  emptyHint: {
    fontSize: SMALL - 1,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20
  }
});
