import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

// Services
import { findIncomesByCategoryId } from '~/services/incomes';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import FilterSelector, { AnalysisFilters } from './components/FilterSelector';

// Types
import { StackNavigationProp } from '@react-navigation/stack';
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';
import { RetentionData } from '~/shared/types/screens/Statistics/commentary-analysis.types';

// Utils
import { showError } from '~/utils/showError';
import { NumberFormat, DateFormat } from '~/utils/Helpers';
import {
  calculateTotalRetention,
  parseRetentionCommentary
} from '~/utils/commentaryParser/retentionParser';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ScreenNavigationProp = StackNavigationProp<StatisticsStackParamList, 'retentionAnalysis'>;

interface ScreenProps {
  navigation?: ScreenNavigationProp;
}

interface GroupedRetention {
  category: string;
  retentions: RetentionData[];
  totalRetention: number;
  totalIncome: number;
  count: number;
}

export default function RetentionAnalysisScreen({ navigation }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.retentionAnalysis;

  // Estados
  const [loading, setLoading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<RetentionData[]>([]);
  const [currentFilters, setCurrentFilters] = useState<AnalysisFilters | null>(null);

  const loadData = async (filters: AnalysisFilters) => {
    if (!filters.categoryId) return;

    try {
      setLoading(true);
      setCurrentFilters(filters);

      // Llamar al endpoint con filtros
      const { data } = await findIncomesByCategoryId(filters.categoryId, {
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      // Parsear comentarios
      const parsed = data.incomes
        .map((income: any) =>
          parseRetentionCommentary(
            income.commentary,
            income.amount || income.cost,
            income.date,
            income.category || filters.categoryName || 'Sin categoría'
          )
        )
        .filter((item): item is RetentionData => item !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setParsedData(parsed);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  };

  // Agrupar por categoría
  const groupedByCategory: { [key: string]: RetentionData[] } = parsedData.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as { [key: string]: RetentionData[] }
  );

  // Calcular totales por categoría
  const categoryStats: GroupedRetention[] = Object.keys(groupedByCategory).map((category) => {
    const retentions = groupedByCategory[category];
    return {
      category,
      retentions,
      totalRetention: calculateTotalRetention(retentions),
      totalIncome: retentions.reduce((sum, r) => sum + r.cost, 0),
      count: retentions.length
    };
  });

  // Totales generales
  const totalRetention = calculateTotalRetention(parsedData);
  const totalIncome = parsedData.reduce((sum, item) => sum + item.cost, 0);
  const avgRetentionRate = totalIncome > 0 ? (totalRetention / totalIncome) * 100 : 0;

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Filtros */}
          <FilterSelector type="incomes" onAnalyze={loadData} defaultDaysBack={365} />

          {/* Mensaje informativo */}
          {currentFilters && (
            <View style={[styles.infoBox, { backgroundColor: colors.INFO + '15' }]}>
              <Icon type="material-community" name="information" size={16} color={colors.INFO} />
              <Text style={[styles.infoText, { color: colors.TEXT_PRIMARY }]}>
                Analizando {currentFilters.categoryName} desde{' '}
                {DateFormat(currentFilters.startDate, 'DD MMM YYYY')} hasta{' '}
                {DateFormat(currentFilters.endDate, 'DD MMM YYYY')}
              </Text>
            </View>
          )}

          {/* Estadísticas generales */}
          {!loading && parsedData.length > 0 && (
            <>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.ERROR + '15',
                    borderColor: colors.ERROR
                  }
                ]}
              >
                <View style={styles.summaryHeader}>
                  <Icon
                    type="material-community"
                    name="cash-remove"
                    size={24}
                    color={colors.ERROR}
                  />
                  <Text style={[styles.summaryTitle, { color: colors.TEXT_PRIMARY }]}>
                    Total Retenido
                  </Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.ERROR }]}>
                  {NumberFormat(totalRetention)}
                </Text>
                <View style={styles.summaryDetails}>
                  <Text style={[styles.summaryDetail, { color: colors.TEXT_SECONDARY }]}>
                    De {NumberFormat(totalIncome)} en ingresos
                  </Text>
                  <Text style={[styles.summaryDetail, { color: colors.TEXT_SECONDARY }]}>
                    Tasa: {avgRetentionRate.toFixed(2)}%
                  </Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.INFO + '15',
                      borderColor: colors.INFO
                    }
                  ]}
                >
                  <Icon
                    type="material-community"
                    name="file-document"
                    size={20}
                    color={colors.INFO}
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
                  <Icon type="material-community" name="percent" size={20} color={colors.WARNING} />
                  <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
                    {NumberFormat(Math.round(totalRetention / parsedData.length))}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Promedio</Text>
                </View>
              </View>
            </>
          )}

          {/* Desglose por categoría */}
          {!loading && categoryStats.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                Por Categoría
              </Text>
              {categoryStats.map((stat, index) => (
                <View
                  key={index}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: colors.CARD_BACKGROUND,
                      borderColor: colors.BORDER,
                      borderLeftColor: colors.PRIMARY
                    }
                  ]}
                >
                  <View style={styles.categoryHeader}>
                    <Text style={[styles.categoryName, { color: colors.TEXT_PRIMARY }]}>
                      {stat.category}
                    </Text>
                    <View
                      style={[styles.categoryBadge, { backgroundColor: colors.PRIMARY + '15' }]}
                    >
                      <Text style={[styles.categoryBadgeText, { color: colors.PRIMARY }]}>
                        {stat.count} {stat.count === 1 ? 'ingreso' : 'ingresos'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.categoryStats}>
                    <View style={styles.categoryStatItem}>
                      <Text style={[styles.categoryStatLabel, { color: colors.TEXT_SECONDARY }]}>
                        Retención total:
                      </Text>
                      <Text style={[styles.categoryStatValue, { color: colors.ERROR }]}>
                        {NumberFormat(stat.totalRetention)}
                      </Text>
                    </View>
                    <View style={styles.categoryStatItem}>
                      <Text style={[styles.categoryStatLabel, { color: colors.TEXT_SECONDARY }]}>
                        Tasa promedio:
                      </Text>
                      <Text style={[styles.categoryStatValue, { color: colors.WARNING }]}>
                        {((stat.totalRetention / stat.totalIncome) * 100).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Historial detallado */}
          {!loading && parsedData.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                Historial de Retenciones
              </Text>
              {parsedData.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.retentionCard,
                    {
                      backgroundColor: colors.CARD_BACKGROUND,
                      borderColor: colors.BORDER
                    }
                  ]}
                >
                  <View style={styles.retentionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.retentionCategory, { color: colors.TEXT_PRIMARY }]}>
                        {item.category}
                      </Text>
                      <Text style={[styles.retentionDate, { color: colors.TEXT_SECONDARY }]}>
                        {DateFormat(item.date, 'DD MMM YYYY')}
                      </Text>
                    </View>
                    <View style={styles.retentionAmounts}>
                      <View style={styles.amountRow}>
                        <Icon
                          type="material-community"
                          name="cash-plus"
                          size={14}
                          color={colors.SUCCESS}
                        />
                        <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>
                          Ingreso:
                        </Text>
                        <Text style={[styles.amountValue, { color: colors.SUCCESS }]}>
                          {NumberFormat(item.cost)}
                        </Text>
                      </View>
                      <View style={styles.amountRow}>
                        <Icon
                          type="material-community"
                          name="cash-remove"
                          size={14}
                          color={colors.ERROR}
                        />
                        <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>
                          Retefu:
                        </Text>
                        <Text style={[styles.amountValue, { color: colors.ERROR }]}>
                          {NumberFormat(item.retention)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {item.notes && (
                    <View style={[styles.notesContainer, { backgroundColor: colors.BACKGROUND }]}>
                      <Icon
                        type="material-community"
                        name="note-text"
                        size={12}
                        color={colors.TEXT_SECONDARY}
                      />
                      <Text style={[styles.notesText, { color: colors.TEXT_SECONDARY }]}>
                        {item.notes}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Estado vacío */}
          {loading ? (
            <MyLoading />
          ) : currentFilters && parsedData.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon
                type="material-community"
                name="cash-remove"
                size={48}
                color={colors.TEXT_SECONDARY}
              />
              <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                No se encontraron registros con retenciones
              </Text>
              <Text style={[styles.emptyHint, { color: colors.TEXT_SECONDARY }]}>
                Formato sugerido: &quot;Retefu: 335000&quot;
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
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
    alignItems: 'center'
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  summaryTitle: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  summaryValue: {
    fontSize: MEDIUM + 8,
    fontWeight: '700',
    marginVertical: 8
  },
  summaryDetails: {
    alignItems: 'center',
    gap: 4
  },
  summaryDetail: {
    fontSize: SMALL
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
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 12
  },
  categoryCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 12,
    gap: 12
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  categoryName: {
    fontSize: SMALL + 2,
    fontWeight: '600',
    flex: 1
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12
  },
  categoryBadgeText: {
    fontSize: SMALL - 2,
    fontWeight: '600'
  },
  categoryStats: {
    gap: 8
  },
  categoryStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryStatLabel: {
    fontSize: SMALL
  },
  categoryStatValue: {
    fontSize: SMALL + 1,
    fontWeight: '700'
  },
  retentionCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10
  },
  retentionHeader: {
    flexDirection: 'row',
    gap: 12
  },
  retentionCategory: {
    fontSize: SMALL + 1,
    fontWeight: '600',
    marginBottom: 2
  },
  retentionDate: {
    fontSize: SMALL - 1
  },
  retentionAmounts: {
    gap: 6
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  amountLabel: {
    fontSize: SMALL - 1
  },
  amountValue: {
    fontSize: SMALL,
    fontWeight: '700'
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 8,
    borderRadius: 4
  },
  notesText: {
    flex: 1,
    fontSize: SMALL - 1,
    fontStyle: 'italic',
    lineHeight: 18
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
