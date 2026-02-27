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
import { RetentionData } from '~/shared/types/screens/Statistics/retention-analysis.types';

// Utils
import { showError } from '~/utils/showError';
import { NumberFormat, DateFormat } from '~/utils/Helpers';
import {
  calculateTotalRetention,
  calculateTotalRetentionWithPrimas,
  calculateIncapacidadStats,
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
  totalRetentionWithPrimas: number;
  totalIncome: number;
  count: number;
}

// Salario base inferido de los recibos más recientes
const SALARIO_BASE = 9_346_562;

export default function RetentionAnalysisScreen({ navigation }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.retentionAnalysis;

  const [loading, setLoading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<RetentionData[]>([]);
  const [currentFilters, setCurrentFilters] = useState<AnalysisFilters | null>(null);

  const loadData = async (filters: AnalysisFilters) => {
    if (!filters.categoryId) return;

    try {
      setLoading(true);
      setCurrentFilters(filters);

      const { data } = await findIncomesByCategoryId(filters.categoryId, {
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const parsed = data.incomes
        .map((income: any) =>
          parseRetentionCommentary(
            income.commentary,
            income.amount || income.cost,
            income.date,
            income.category || filters.categoryName || 'Sin categoría',
            SALARIO_BASE
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
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as { [key: string]: RetentionData[] }
  );

  const categoryStats: GroupedRetention[] = Object.keys(groupedByCategory).map((category) => {
    const retentions = groupedByCategory[category];
    return {
      category,
      retentions,
      totalRetention: calculateTotalRetention(retentions),
      totalRetentionWithPrimas: calculateTotalRetentionWithPrimas(retentions),
      totalIncome: retentions.reduce((sum, r) => sum + r.cost, 0),
      count: retentions.length
    };
  });

  // Totales generales
  const totalRetention = calculateTotalRetention(parsedData);
  const totalRetentionWithPrimas = calculateTotalRetentionWithPrimas(parsedData);
  const totalIncome = parsedData.reduce((sum, item) => sum + item.cost, 0);
  const avgRetentionRate = totalIncome > 0 ? (totalRetention / totalIncome) * 100 : 0;

  // Estadísticas de incapacidad
  const incStats = calculateIncapacidadStats(parsedData);
  const hasIncapacidad = incStats.totalDays > 0;

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

          {!loading && parsedData.length > 0 && (
            <>
              {/* ── Tarjeta principal: Retefuente ── */}
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: colors.ERROR + '15', borderColor: colors.ERROR }
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
                    Total Retefuente
                  </Text>
                </View>

                {/* Salario */}
                <View style={styles.reteLine}>
                  <Text style={[styles.reteLineLabel, { color: colors.TEXT_SECONDARY }]}>
                    Salario ordinario
                  </Text>
                  <Text style={[styles.reteLineValue, { color: colors.ERROR }]}>
                    {NumberFormat(totalRetention)}
                  </Text>
                </View>

                {/* Primas (solo si hay) */}
                {totalRetentionWithPrimas > totalRetention && (
                  <View style={styles.reteLine}>
                    <Text style={[styles.reteLineLabel, { color: colors.TEXT_SECONDARY }]}>
                      Primas y bonificaciones
                    </Text>
                    <Text style={[styles.reteLineValue, { color: colors.ERROR }]}>
                      {NumberFormat(totalRetentionWithPrimas - totalRetention)}
                    </Text>
                  </View>
                )}

                {/* Total combinado */}
                {totalRetentionWithPrimas > totalRetention && (
                  <View style={[styles.reteLine, styles.reteTotalLine]}>
                    <Text
                      style={[
                        styles.reteLineLabel,
                        { color: colors.TEXT_PRIMARY, fontWeight: '700' }
                      ]}
                    >
                      Total retenido
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.ERROR }]}>
                      {NumberFormat(totalRetentionWithPrimas)}
                    </Text>
                  </View>
                )}

                {totalRetentionWithPrimas === totalRetention && (
                  <Text style={[styles.summaryValue, { color: colors.ERROR }]}>
                    {NumberFormat(totalRetention)}
                  </Text>
                )}

                <View style={styles.summaryDetails}>
                  <Text style={[styles.summaryDetail, { color: colors.TEXT_SECONDARY }]}>
                    De {NumberFormat(totalIncome)} en ingresos
                  </Text>
                  <Text style={[styles.summaryDetail, { color: colors.TEXT_SECONDARY }]}>
                    Tasa salario: {avgRetentionRate.toFixed(2)}%
                  </Text>
                </View>
              </View>

              {/* ── Grid: registros / promedio ── */}
              <View style={styles.statsGrid}>
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: colors.INFO + '15', borderColor: colors.INFO }
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
                  <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>Nóminas</Text>
                </View>

                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: colors.WARNING + '15', borderColor: colors.WARNING }
                  ]}
                >
                  <Icon type="material-community" name="percent" size={20} color={colors.WARNING} />
                  <Text style={[styles.statValue, { color: colors.TEXT_PRIMARY }]}>
                    {NumberFormat(Math.round(totalRetention / parsedData.length))}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                    Prom./mes
                  </Text>
                </View>
              </View>

              {/* ── Tarjeta incapacidad (solo si hay) ── */}
              {hasIncapacidad && (
                <View
                  style={[
                    styles.summaryCard,
                    { backgroundColor: colors.WARNING + '10', borderColor: colors.WARNING }
                  ]}
                >
                  <View style={styles.summaryHeader}>
                    <Icon
                      type="material-community"
                      name="hospital-box-outline"
                      size={24}
                      color={colors.WARNING}
                    />
                    <Text style={[styles.summaryTitle, { color: colors.TEXT_PRIMARY }]}>
                      Incapacidades
                    </Text>
                  </View>

                  {/* Grid días */}
                  <View style={styles.incGrid}>
                    <View style={styles.incCell}>
                      <Text style={[styles.incValue, { color: colors.TEXT_PRIMARY }]}>
                        {incStats.totalDays}
                      </Text>
                      <Text style={[styles.incLabel, { color: colors.TEXT_SECONDARY }]}>
                        Días totales
                      </Text>
                    </View>
                    <View style={styles.incCell}>
                      <Text style={[styles.incValue, { color: colors.TEXT_PRIMARY }]}>
                        {incStats.totalEpsDays}
                      </Text>
                      <Text style={[styles.incLabel, { color: colors.TEXT_SECONDARY }]}>
                        Días EPS{'\n'}(con descuento)
                      </Text>
                    </View>
                    <View style={styles.incCell}>
                      <Text style={[styles.incValue, { color: colors.TEXT_PRIMARY }]}>
                        {incStats.totalPrimDays}
                      </Text>
                      <Text style={[styles.incLabel, { color: colors.TEXT_SECONDARY }]}>
                        Días empresa{'\n'}(sin descuento)
                      </Text>
                    </View>
                  </View>

                  {/* Pérdida económica */}
                  {incStats.totalDiscount > 0 && (
                    <>
                      <View style={[styles.reteLine, { marginTop: 12 }]}>
                        <Text style={[styles.reteLineLabel, { color: colors.TEXT_SECONDARY }]}>
                          Pérdida total por incapacidad
                        </Text>
                        <Text style={[styles.reteLineValue, { color: colors.WARNING }]}>
                          {NumberFormat(Math.round(incStats.totalDiscount))}
                        </Text>
                      </View>
                      <View style={styles.reteLine}>
                        <Text style={[styles.reteLineLabel, { color: colors.TEXT_SECONDARY }]}>
                          Promedio días EPS/mes
                        </Text>
                        <Text style={[styles.reteLineValue, { color: colors.TEXT_PRIMARY }]}>
                          {incStats.avgEpsDaysPerMonth.toFixed(1)} días
                        </Text>
                      </View>
                      <View style={styles.reteLine}>
                        <Text style={[styles.reteLineLabel, { color: colors.TEXT_SECONDARY }]}>
                          Meses afectados
                        </Text>
                        <Text style={[styles.reteLineValue, { color: colors.TEXT_PRIMARY }]}>
                          {incStats.monthsWithIncapacidad}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* ── Por categoría ── */}
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
                          Retefu. salario:
                        </Text>
                        <Text style={[styles.categoryStatValue, { color: colors.ERROR }]}>
                          {NumberFormat(stat.totalRetention)}
                        </Text>
                      </View>
                      {stat.totalRetentionWithPrimas > stat.totalRetention && (
                        <View style={styles.categoryStatItem}>
                          <Text
                            style={[styles.categoryStatLabel, { color: colors.TEXT_SECONDARY }]}
                          >
                            Retefu. total (c/primas):
                          </Text>
                          <Text style={[styles.categoryStatValue, { color: colors.ERROR }]}>
                            {NumberFormat(stat.totalRetentionWithPrimas)}
                          </Text>
                        </View>
                      )}
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

              {/* ── Historial detallado ── */}
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                  Historial de Nóminas
                </Text>

                {parsedData.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.retentionCard,
                      { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
                    ]}
                  >
                    {/* Encabezado: categoría + fecha */}
                    <View style={styles.retentionHeader}>
                      <Icon
                        type="material-community"
                        name="cash-multiple"
                        size={20}
                        color={colors.PRIMARY}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.retentionCategory, { color: colors.TEXT_PRIMARY }]}>
                          {item.category}
                        </Text>
                        <Text style={[styles.retentionDate, { color: colors.TEXT_SECONDARY }]}>
                          {DateFormat(item.date, 'DD MMM YYYY')}
                        </Text>
                      </View>

                      {/* Ingreso neto */}
                      <View style={styles.retentionAmounts}>
                        <View style={styles.amountRow}>
                          <Icon
                            type="material-community"
                            name="cash-plus"
                            size={14}
                            color={colors.SUCCESS}
                          />
                          <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>
                            Neto:
                          </Text>
                          <Text style={[styles.amountValue, { color: colors.SUCCESS }]}>
                            {NumberFormat(item.cost)}
                          </Text>
                        </View>

                        {/* Retefuente salario */}
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

                    {/* Primas */}
                    {item.primas && item.primas.length > 0 && (
                      <View style={[styles.subSection, { borderColor: colors.BORDER }]}>
                        <Text style={[styles.subSectionTitle, { color: colors.TEXT_SECONDARY }]}>
                          Retefu. primas
                        </Text>
                        {item.primas.map((p, i) => (
                          <View key={i} style={styles.amountRow}>
                            <Icon
                              type="material-community"
                              name="star-outline"
                              size={13}
                              color={colors.WARNING}
                            />
                            <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>
                              Prima {p.label}:
                            </Text>
                            <Text style={[styles.amountValue, { color: colors.ERROR }]}>
                              {NumberFormat(p.amount)}
                            </Text>
                          </View>
                        ))}
                        <View style={[styles.amountRow, { marginTop: 4 }]}>
                          <Text
                            style={[
                              styles.amountLabel,
                              { color: colors.TEXT_SECONDARY, fontWeight: '600' }
                            ]}
                          >
                            Total retenido:
                          </Text>
                          <Text
                            style={[styles.amountValue, { color: colors.ERROR, fontWeight: '700' }]}
                          >
                            {NumberFormat(item.totalRetentionWithPrimas ?? item.retention)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Incapacidad */}
                    {item.incapacidad && item.incapacidad.totalDays > 0 && (
                      <View style={[styles.subSection, { borderColor: colors.BORDER }]}>
                        <Text style={[styles.subSectionTitle, { color: colors.TEXT_SECONDARY }]}>
                          Incapacidad
                        </Text>

                        {item.incapacidad.primDays > 0 && (
                          <View style={styles.amountRow}>
                            <Icon
                              type="material-community"
                              name="hospital-box-outline"
                              size={13}
                              color={colors.INFO}
                            />
                            <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>
                              Días empresa (sin descuento):
                            </Text>
                            <Text style={[styles.amountValue, { color: colors.INFO }]}>
                              {item.incapacidad.primDays}d
                            </Text>
                          </View>
                        )}

                        {item.incapacidad.epsDays > 0 && (
                          <>
                            <View style={styles.amountRow}>
                              <Icon
                                type="material-community"
                                name="hospital-box-outline"
                                size={13}
                                color={colors.WARNING}
                              />
                              <Text style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}>
                                Días EPS (con descuento):
                              </Text>
                              <Text style={[styles.amountValue, { color: colors.WARNING }]}>
                                {item.incapacidad.epsDays}d
                              </Text>
                            </View>

                            {item.incapacidad.totalDiscount !== undefined && (
                              <View style={styles.amountRow}>
                                <Icon
                                  type="material-community"
                                  name="trending-down"
                                  size={13}
                                  color={colors.WARNING}
                                />
                                <Text
                                  style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}
                                >
                                  Pérdida económica:
                                </Text>
                                <Text style={[styles.amountValue, { color: colors.WARNING }]}>
                                  {NumberFormat(Math.round(item.incapacidad.totalDiscount))}
                                </Text>
                              </View>
                            )}

                            {item.incapacidad.discountPerDay !== undefined && (
                              <View style={styles.amountRow}>
                                <Text
                                  style={[styles.amountLabel, { color: colors.TEXT_SECONDARY }]}
                                >
                                  Por día EPS:
                                </Text>
                                <Text
                                  style={[styles.amountValue, { color: colors.TEXT_SECONDARY }]}
                                >
                                  {NumberFormat(Math.round(item.incapacidad.discountPerDay))}
                                </Text>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    )}

                    {/* Notas */}
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
            </>
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
                Formato: &quot;Retefu: 467.000{'\n'}Incapacidad: Prim: 2 días, Eps: 4+18 días&quot;
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
    marginBottom: 16
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  summaryTitle: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  summaryValue: {
    fontSize: MEDIUM + 6,
    fontWeight: '700',
    marginVertical: 6,
    textAlign: 'center'
  },
  summaryDetails: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8
  },
  summaryDetail: {
    fontSize: SMALL
  },
  reteLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3
  },
  reteTotalLine: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 6,
    paddingTop: 8
  },
  reteLineLabel: {
    fontSize: SMALL,
    flex: 1
  },
  reteLineValue: {
    fontSize: SMALL + 1,
    fontWeight: '700'
  },
  incGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8
  },
  incCell: {
    alignItems: 'center',
    flex: 1
  },
  incValue: {
    fontSize: MEDIUM + 4,
    fontWeight: '700'
  },
  incLabel: {
    fontSize: SMALL - 2,
    textAlign: 'center',
    marginTop: 2
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
    gap: 12,
    alignItems: 'flex-start'
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
  subSection: {
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 5
  },
  subSectionTitle: {
    fontSize: SMALL - 1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4
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
