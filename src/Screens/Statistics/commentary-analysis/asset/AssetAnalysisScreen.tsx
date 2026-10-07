/**
 * AssetAnalysisScreen — costo, deuda, arriendo y rentabilidad de un bien
 * Ubicación: src/Screens/Statistics/commentary-analysis/asset/AssetAnalysisScreen.tsx
 */
import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Icon } from 'react-native-elements';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import MultiSubcategoryFilter from '../components/MultiSubcategoryFilter';
import EditCommentaryModal from '../components/EditCommentaryModal';
import AssetLinkCard from './components/AssetLinkCard';
import AssetMetricsSections from './components/AssetMetricsSections';

// Hooks
import { useAssetData } from './hooks/useAssetData';

// Types
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';
import { ExpenseToEdit } from '~/shared/types/screens/Statistics/commentary-analysis/components/edit-commentary-modal.types';

// Utils
import { DateFormat, NumberFormat } from '~/utils/Helpers';

// Theme / styles
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';
import { MEDIUM, SMALL } from '~/styles/fonts';

type ScreenNavigationProp = StackNavigationProp<StatisticsStackParamList, 'assetAnalysis'>;
type ScreenRouteProp = RouteProp<StatisticsStackParamList, 'assetAnalysis'>;

interface ScreenProps {
  navigation?: ScreenNavigationProp;
  route?: ScreenRouteProp;
}

const MAX_WARNINGS = 8;

export default function AssetAnalysisScreen(_props: ScreenProps) {
  const colors = useThemeColors();

  const {
    loading,
    metrics,
    unrecognized,
    link,
    needsLink,
    incomesFailed,
    currentFilters,
    loadData,
    refreshData,
    saveLink,
    clearLink
  } = useAssetData();

  const [editingExpense, setEditingExpense] = useState<ExpenseToEdit | null>(null);

  const subcategoryLabel = currentFilters ? currentFilters.subcategoryNames.join(' + ') : '';

  // Avisos que no tienen su propia sección: los gastos sin formato se editan abajo
  // y "annualized" ya se explica dentro de la tarjeta de rentabilidad.
  const warnings = (metrics?.warnings ?? []).filter(
    (w) => w.code !== 'annualized' && !(w.code === 'unparsed' && w.source === 'expense')
  );

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title="Bienes e Inversiones" subtitle="Costo, deuda, arriendo y rentabilidad" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <MultiSubcategoryFilter
            defaultDaysBack={360}
            buttonTitle="Analizar bien"
            onAnalyze={loadData}
          />

          {currentFilters && (
            <View style={[styles.infoBox, { backgroundColor: colors.INFO + '15' }]}>
              <Icon type="material-community" name="information" size={16} color={colors.INFO} />
              <Text style={[styles.infoText, { color: colors.TEXT_PRIMARY }]}>
                {subcategoryLabel}: del {DateFormat(currentFilters.startDate, 'DD MMM YYYY')} al{' '}
                {DateFormat(currentFilters.endDate, 'DD MMM YYYY')}. El costo y la deuda usan este
                rango: elige uno amplio para incluir toda la compra.
              </Text>
            </View>
          )}

          {loading ? (
            <MyLoading />
          ) : (
            metrics && (
              <>
                <AssetLinkCard link={link} onSave={saveLink} onClear={clearLink} />

                {!needsLink && (
                  <AssetMetricsSections
                    metrics={metrics}
                    hasIncomeLink={link?.kind === 'income'}
                    incomesFailed={incomesFailed}
                  />
                )}

                {/* Avisos */}
                {!needsLink && warnings.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <View style={styles.sectionHeader}>
                      <Icon
                        type="material-community"
                        name="alert-outline"
                        size={20}
                        color={colors.WARNING}
                      />
                      <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                        Revisar ({warnings.length})
                      </Text>
                    </View>
                    {warnings.slice(0, MAX_WARNINGS).map((w, i) => (
                      <Text
                        key={`${w.code}-${w.source ?? 'x'}-${w.id ?? i}`}
                        style={[styles.warningText, { color: colors.TEXT_SECONDARY }]}
                      >
                        • {w.message}
                      </Text>
                    ))}
                    {warnings.length > MAX_WARNINGS && (
                      <Text style={[styles.warningText, { color: colors.TEXT_SECONDARY }]}>
                        … y {warnings.length - MAX_WARNINGS} más
                      </Text>
                    )}
                  </View>
                )}

                {/* Sin formato reconocido (gastos) */}
                {!needsLink && unrecognized.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <View style={styles.sectionHeader}>
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

                    <View style={[styles.hintBox, { backgroundColor: colors.WARNING + '15' }]}>
                      <Text style={[styles.hintText, { color: colors.TEXT_SECONDARY }]}>
                        Toca &quot;Editar&quot; para usar el formato estándar:{'\n'}
                        Abono: antes de escrituras{'\n'}
                        Escrituración: notariales 2,3% [Valor escritura $130.000.000]{'\n'}
                        Administración: Mar 2026{'\n'}
                        Intereses: Mar 2026 [Tasa 14,5% EA] [Saldo $85.000.000]
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
              </>
            )
          )}
        </View>
      </ScrollView>

      <EditCommentaryModal
        visible={editingExpense !== null}
        expense={editingExpense}
        formatHint="Ej: Administración: Mar 2026"
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionTitle: { fontSize: MEDIUM, fontWeight: '600' },
  sectionCount: { fontSize: SMALL },
  warningText: { fontSize: SMALL, lineHeight: 18, marginBottom: 4 },
  hintBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
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
  editButtonText: { fontSize: SMALL, fontWeight: '500' }
});
