/**
 * VacationAnalysisScreen
 * Ubicación: src/Screens/Statistics/commentary-analysis/vacation/VacationAnalysisScreen.tsx
 */

import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Icon } from 'react-native-elements';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import MultiSubcategoryFilter, { MultiAnalysisFilters } from '../components/MultiSubcategoryFilter';
import EditCommentaryModal from '../components/EditCommentaryModal';
import DestinationSummaryCard from './components/DestinationSummaryCard';
import LodgingComparisonCard from './components/LodgingComparisonCard';
import FlightListCard from './components/FlightListCard';
import VacationHistoryItem from './components/VacationHistoryItem';

// Hooks
import { useVacationData } from './hooks/useVacationData';

// Types
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';
import { ExpenseToEdit } from '~/shared/types/screens/Statistics/commentary-analysis/components/edit-commentary-modal.types';

// Utils
import { DateFormat, NumberFormat } from '~/utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type ScreenNavigationProp = StackNavigationProp<StatisticsStackParamList, 'vacationAnalysis'>;
type ScreenRouteProp = RouteProp<StatisticsStackParamList, 'vacationAnalysis'>;

interface ScreenProps {
  navigation?: ScreenNavigationProp;
  route?: ScreenRouteProp;
}

export default function VacationAnalysisScreen({ navigation, route }: ScreenProps) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.vacationAnalysis;

  const {
    loading,
    parsedData,
    destinationSummaries,
    lodgingComparisons,
    flights,
    unrecognized,
    currentFilters,
    totalCost,
    loadData,
    refreshData
  } = useVacationData();

  const [editingExpense, setEditingExpense] = useState<ExpenseToEdit | null>(null);

  // Texto legible de subcategorías seleccionadas para el infoBox
  const subcategoryLabel = currentFilters ? currentFilters.subcategoryNames.join(' + ') : '';

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Filtros */}
          <MultiSubcategoryFilter
            defaultDaysBack={730}
            buttonTitle="Analizar Vacaciones"
            onAnalyze={loadData} // ← conexión directa, sin intermediario
          />

          {/* Info del rango */}
          {currentFilters && (
            <View style={[styles.infoBox, { backgroundColor: colors.INFO + '15' }]}>
              <Icon type="material-community" name="information" size={16} color={colors.INFO} />
              <Text style={[styles.infoText, { color: colors.TEXT_PRIMARY }]}>
                Analizando {subcategoryLabel} desde{' '}
                {DateFormat(currentFilters.startDate, 'DD MMM YYYY')} hasta{' '}
                {DateFormat(currentFilters.endDate, 'DD MMM YYYY')}
              </Text>
            </View>
          )}

          {loading ? (
            <MyLoading />
          ) : (
            <>
              {parsedData.length > 0 && (
                <>
                  {/* 1. Resumen por destino */}
                  <DestinationSummaryCard summaries={destinationSummaries} totalCost={totalCost} />

                  {/* 2. Comparación de alojamientos */}
                  {lodgingComparisons.length > 0 && (
                    <LodgingComparisonCard lodgings={lodgingComparisons} />
                  )}

                  {/* 3. Tiquetes */}
                  {flights.length > 0 && <FlightListCard flights={flights} />}

                  {/* 4. Lista cronológica */}
                  <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                    Historial completo
                  </Text>
                  <Text style={[styles.sectionCount, { color: colors.TEXT_SECONDARY }]}>
                    {parsedData.length} {parsedData.length === 1 ? 'registro' : 'registros'} ·{' '}
                    {NumberFormat(totalCost)} total
                  </Text>
                  {parsedData.map((item, index) => (
                    <VacationHistoryItem key={index} item={item} />
                  ))}
                </>
              )}

              {/* 5. No reconocidos */}
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
                      Toca &quot;Editar&quot; para usar el formato estándar:{'\n'}
                      Alojamiento Hotel Nombre 1 noche [Solo alojamiento] [Destino]{'\n'}
                      Tiquete Avianca Pereira-Destino 2 pasajeros{'\n'}
                      Destino: descripción del gasto
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
                      <Text
                        style={[styles.unrecognizedCommentary, { color: colors.TEXT_PRIMARY }]}
                        numberOfLines={2}
                      >
                        {expense.commentary || '(sin comentario)'}
                      </Text>
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

              {/* Estado vacío */}
              {currentFilters && parsedData.length === 0 && unrecognized.length === 0 && (
                <View style={styles.emptyState}>
                  <Icon
                    type="material-community"
                    name="airplane-off"
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

      <EditCommentaryModal
        visible={editingExpense !== null}
        expense={editingExpense}
        formatHint="Ej: Alojamiento Hotel Nombre 2 noches [Con desayuno] [Cartagena]"
        onClose={() => setEditingExpense(null)}
        onSaved={refreshData}
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
  infoText: { flex: 1, fontSize: SMALL, lineHeight: 18 },
  sectionTitle: { fontSize: MEDIUM, fontWeight: '600', marginBottom: 4 },
  sectionCount: { fontSize: SMALL, marginBottom: 12 },
  unrecognizedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  unrecognizedHint: { padding: 12, borderRadius: 8, marginBottom: 12 },
  hintText: { fontSize: SMALL - 1, lineHeight: 20 },
  unrecognizedCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 8,
    gap: 8
  },
  unrecognizedCommentary: { fontSize: SMALL + 1, fontStyle: 'italic' },
  unrecognizedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  unrecognizedMeta: { fontSize: SMALL - 1 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  editButtonText: { fontSize: SMALL, fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: SMALL + 1, textAlign: 'center' }
});
