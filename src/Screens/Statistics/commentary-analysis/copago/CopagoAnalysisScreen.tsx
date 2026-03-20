/**
 * CopagoAnalysisScreen
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/CopagoAnalysisScreen.tsx
 *
 * Secciones:
 *   1. Filtros (subcategoría + rango de fechas)
 *   2. Resumen por tipo de servicio con drill-down expandible
 *   3. Lista cronológica de copagos reconocidos
 *   4. Registros no reconocidos con botón para corregir el comentario
 */

import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Icon } from 'react-native-elements';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import FilterSelector, { AnalysisFilters } from '../components/FilterSelector';
import CopagoSummaryCard from './components/CopagoSummaryCard';
import CopagoHistoryItem from './components/CopagoHistoryItem';
import EditCommentaryModal from './components/EditCommentaryModal';

// Hooks
import { useCopagoData } from './hooks/useCopagoData';

// Types
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';
import { UnrecognizedExpense } from '~/shared/types/screens/Statistics/commentary-analysis/copago/copago-analysis.types';

// Utils
import { DateFormat, NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ScreenNavigationProp = StackNavigationProp<StatisticsStackParamList, 'copagoAnalysis'>;
type ScreenRouteProp = RouteProp<StatisticsStackParamList, 'copagoAnalysis'>;

interface ScreenProps {
  navigation?: ScreenNavigationProp;
  route?: ScreenRouteProp;
}

export default function CopagoAnalysisScreen({ navigation, route }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.copagoAnalysis;

  const {
    loading,
    parsedData,
    serviceSummaries,
    unrecognized,
    currentFilters,
    totalCost,
    loadData,
    refreshData
  } = useCopagoData();

  // Estado del modal de edición
  const [editingExpense, setEditingExpense] = useState<UnrecognizedExpense | null>(null);

  const handleSaved = async () => {
    await refreshData();
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Filtros */}
          <FilterSelector type="expenses" onAnalyze={loadData} defaultDaysBack={365} />

          {/* Info del rango seleccionado */}
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

          {loading ? (
            <MyLoading />
          ) : (
            <>
              {/* ── Datos reconocidos ── */}
              {parsedData.length > 0 && (
                <>
                  {/* Resumen por tipo de servicio con drill-down */}
                  <CopagoSummaryCard summaries={serviceSummaries} totalCost={totalCost} />

                  {/* Lista cronológica */}
                  <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                    Historial de copagos
                  </Text>
                  <Text style={[styles.sectionCount, { color: colors.TEXT_SECONDARY }]}>
                    {parsedData.length} {parsedData.length === 1 ? 'registro' : 'registros'}
                  </Text>
                  {parsedData.map((item, index) => (
                    <CopagoHistoryItem key={index} item={item} />
                  ))}
                </>
              )}

              {/* ── Registros no reconocidos ── */}
              {unrecognized.length > 0 && (
                <View style={{ marginTop: parsedData.length > 0 ? 24 : 0 }}>
                  <View style={styles.unrecognizedHeader}>
                    <Icon
                      type="material-community"
                      name="alert-circle-outline"
                      size={20}
                      color={colors.WARNING}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY, flex: 1 }]}>
                      Sin formato reconocido
                    </Text>
                    <Text style={[styles.sectionCount, { color: colors.TEXT_SECONDARY }]}>
                      {unrecognized.length}
                    </Text>
                  </View>

                  <View
                    style={[styles.unrecognizedHint, { backgroundColor: colors.WARNING + '15' }]}
                  >
                    <Text style={[styles.hintText, { color: colors.TEXT_SECONDARY }]}>
                      Toca "Editar" para corregir el formato.{'\n'}
                      Esperado: Copago Colmedica terapia física #11/20
                    </Text>
                  </View>

                  {unrecognized.map((expense) => (
                    <View
                      key={expense.id}
                      style={[
                        styles.unrecognizedCard,
                        {
                          backgroundColor: colors.CARD_BACKGROUND,
                          borderColor: colors.BORDER,
                          borderLeftColor: colors.WARNING
                        }
                      ]}
                    >
                      {/* Comentario actual */}
                      <Text
                        style={[styles.unrecognizedCommentary, { color: colors.TEXT_PRIMARY }]}
                        numberOfLines={2}
                      >
                        {expense.commentary || '(sin comentario)'}
                      </Text>

                      {/* Meta + botón editar */}
                      <View style={styles.unrecognizedFooter}>
                        <Text style={[styles.unrecognizedMeta, { color: colors.TEXT_SECONDARY }]}>
                          {DateFormat(expense.date, 'DD MMM YYYY')} · {NumberFormat(expense.cost)}
                        </Text>
                        <TouchableOpacity
                          style={[styles.editButton, { backgroundColor: colors.INFO + '20' }]}
                          onPress={() => setEditingExpense(expense)}
                          activeOpacity={0.7}
                        >
                          <Icon
                            type="material-community"
                            name="pencil-outline"
                            size={14}
                            color={colors.INFO}
                          />
                          <Text style={[styles.editButtonText, { color: colors.INFO }]}>
                            Editar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* ── Estado vacío total ── */}
              {!loading &&
                currentFilters &&
                parsedData.length === 0 &&
                unrecognized.length === 0 && (
                  <View style={styles.emptyState}>
                    <Icon
                      type="material-community"
                      name="hospital-box-outline"
                      size={48}
                      color={colors.TEXT_SECONDARY}
                    />
                    <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                      No se encontraron gastos en este período
                    </Text>
                  </View>
                )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal de edición de comentario */}
      <EditCommentaryModal
        visible={editingExpense !== null}
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSaved={handleSaved}
      />
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
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 4
  },
  sectionCount: {
    fontSize: SMALL,
    marginBottom: 12
  },
  unrecognizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  unrecognizedHint: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  hintText: {
    fontSize: SMALL - 1,
    lineHeight: 18
  },
  unrecognizedCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 8,
    gap: 8
  },
  unrecognizedCommentary: {
    fontSize: SMALL + 1,
    fontStyle: 'italic'
  },
  unrecognizedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  unrecognizedMeta: {
    fontSize: SMALL - 1
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  editButtonText: {
    fontSize: SMALL,
    fontWeight: '500'
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
  }
});
