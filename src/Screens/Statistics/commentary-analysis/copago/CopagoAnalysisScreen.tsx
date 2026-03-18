/**
 * CopagoAnalysisScreen
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/CopagoAnalysisScreen.tsx
 *
 * Muestra:
 *   1. Filtros (subcategoría + rango de fechas)
 *   2. Resumen por tipo de servicio (CopagoSummaryCard)
 *   3. Lista cronológica de copagos (CopagoHistoryItem)
 */

import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Icon } from 'react-native-elements';

// Services — vía hook
// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import FilterSelector, { AnalysisFilters } from '../components/FilterSelector';
import CopagoSummaryCard from './components/CopagoSummaryCard';
import CopagoHistoryItem from './components/CopagoHistoryItem';

// Hooks
import { useCopagoData } from './hooks/useCopagoData';

// Types
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';

// Utils
import { DateFormat } from '~/utils/Helpers';

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

  const { loading, parsedData, serviceSummaries, currentFilters, totalCost, loadData } =
    useCopagoData();

  const handleAnalyze = (filters: AnalysisFilters) => {
    loadData(filters);
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Filtros */}
          <FilterSelector type="expenses" onAnalyze={handleAnalyze} defaultDaysBack={365} />

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
          ) : parsedData.length > 0 ? (
            <>
              {/* Resumen por tipo de servicio */}
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
          ) : currentFilters ? (
            <View style={styles.emptyState}>
              <Icon
                type="material-community"
                name="hospital-box-outline"
                size={48}
                color={colors.TEXT_SECONDARY}
              />
              <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
                No se encontraron copagos con formato reconocido
              </Text>
              <Text style={[styles.emptyHint, { color: colors.TEXT_SECONDARY }]}>
                Formato esperado: Copago Colmedica terapia física #11/20
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
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: '600',
    marginBottom: 4
  },
  sectionCount: {
    fontSize: SMALL,
    marginBottom: 12
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
