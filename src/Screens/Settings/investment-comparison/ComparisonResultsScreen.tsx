import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, DimensionValue } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Icon } from 'react-native-elements';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import MyLoading from '~/components/loading/MyLoading';

// Types
import {
  ComparisonResult,
  ScenarioType
} from '~/shared/types/services/Investment-comparison.types';
import { SettingsStackParamList } from '~/shared/types';

// Utils & Theme
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';
import { screenConfigs } from '~/config/screenConfigs';
import { MEDIUM, SMALL } from '~/styles/fonts';
import { ShowToast } from '~/utils/toastUtils';

// Services
import InvestmentComparisonService from '~/services/InvestmentComparisonService';

type NavigationProp = StackNavigationProp<SettingsStackParamList, 'comparisonResults'>;
type RoutePropType = RouteProp<SettingsStackParamList, 'comparisonResults'>;

interface Props {
  navigation: NavigationProp;
  route: RoutePropType;
}

type AppColors = ReturnType<typeof useThemeColors>;
type Comparison = NonNullable<
  Awaited<ReturnType<typeof InvestmentComparisonService.getComparison>>
>;
type ScenarioResults = Parameters<typeof InvestmentComparisonService.generateRecommendation>[1];
type MetricKey = 'profitability' | 'liquidity' | 'security' | 'cashFlow';

const SCENARIO_NAMES: Record<ScenarioType, string> = {
  [ScenarioType.SAVINGS]: 'Ahorro/Inversión',
  [ScenarioType.FUTURE_PROPERTY]: 'Vivienda a Futuro',
  [ScenarioType.IMMEDIATE_RENT]: 'Compra Inmediata',
  [ScenarioType.EXISTING_PROPERTY]: 'Propiedad Actual'
};

const METRICS: { key: MetricKey; label: string; color: keyof AppColors }[] = [
  { key: 'profitability', label: 'Rentabilidad', color: 'SUCCESS' },
  { key: 'liquidity', label: 'Liquidez', color: 'INFO' },
  { key: 'security', label: 'Seguridad', color: 'PRIMARY' },
  { key: 'cashFlow', label: 'Flujo de caja', color: 'WARNING' }
];

// Calcula los resultados de cada escenario y genera la recomendación
const buildResult = (comparison: Comparison): ComparisonResult => {
  const { scenarios } = comparison;
  const results = {} as ScenarioResults;

  if (scenarios.savings) {
    results.savings = InvestmentComparisonService.calculateSavingsScenario(scenarios.savings);
  }
  if (scenarios.futureProperty) {
    results.futureProperty = InvestmentComparisonService.calculateFuturePropertyScenario(
      scenarios.futureProperty
    );
  }
  if (scenarios.immediateRent) {
    results.immediateRent = InvestmentComparisonService.calculateImmediateRentScenario(
      scenarios.immediateRent
    );
  }
  if (scenarios.existingProperty) {
    results.existingProperty = InvestmentComparisonService.calculateExistingPropertyScenario(
      scenarios.existingProperty
    );
  }

  const recommendation = InvestmentComparisonService.generateRecommendation(comparison, results);
  return { comparison, recommendation };
};

const toPercentWidth = (value: number): DimensionValue =>
  `${Math.min(Math.max(value, 0), 100)}%` as DimensionValue;

export default function ComparisonResultsScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.comparisonResults;
  const { comparisonId } = route.params;

  // Mientras no haya resultado, la pantalla está cargando
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComparison = async (): Promise<void> => {
      try {
        const comparison = await InvestmentComparisonService.getComparison(comparisonId);
        if (!isMounted) return;

        if (!comparison) {
          ShowToast('Comparación no encontrada');
          navigation.goBack();
          return;
        }

        setResult(buildResult(comparison));
      } catch {
        if (!isMounted) return;
        ShowToast('Error al cargar comparación');
        navigation.goBack();
      }
    };

    loadComparison();

    return () => {
      isMounted = false;
    };
  }, [comparisonId, navigation]);

  if (!result) {
    return (
      <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
        <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />
        <MyLoading />
      </View>
    );
  }

  const { recommendation } = result;

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Recomendación Principal */}
          <View
            style={[
              styles.recommendationCard,
              {
                backgroundColor: colors.SUCCESS + '15',
                borderColor: colors.SUCCESS
              }
            ]}
          >
            <View style={styles.recommendationHeader}>
              <Icon type="material-community" name="trophy" size={32} color={colors.SUCCESS} />
              <Text style={[styles.recommendationTitle, { color: colors.SUCCESS }]}>
                Recomendación
              </Text>
            </View>

            <Text style={[styles.recommendationScenario, { color: colors.TEXT_PRIMARY }]}>
              {SCENARIO_NAMES[recommendation.recommendedScenario]}
            </Text>

            <View style={styles.reasoningList}>
              {recommendation.reasoning.map((reason) => (
                <View key={reason} style={styles.reasoningItem}>
                  <Icon
                    type="material-community"
                    name="check-circle"
                    size={16}
                    color={colors.SUCCESS}
                  />
                  <Text style={[styles.reasoningText, { color: colors.TEXT_PRIMARY }]}>
                    {reason}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tabla Comparativa */}
          <View
            style={[
              styles.section,
              { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
              📊 Comparación de Resultados
            </Text>

            {recommendation.scores.map((score) => {
              const isRecommended = score.scenarioType === recommendation.recommendedScenario;

              return (
                <View
                  key={score.scenarioType}
                  style={[
                    styles.scoreCard,
                    {
                      backgroundColor: isRecommended ? colors.SUCCESS + '10' : colors.BACKGROUND,
                      borderColor: isRecommended ? colors.SUCCESS : colors.BORDER
                    }
                  ]}
                >
                  <View style={styles.scoreHeader}>
                    <Text style={[styles.scoreTitle, { color: colors.TEXT_PRIMARY }]}>
                      {SCENARIO_NAMES[score.scenarioType]}
                    </Text>
                    <View
                      style={[
                        styles.scoreBadge,
                        { backgroundColor: isRecommended ? colors.SUCCESS : colors.INFO }
                      ]}
                    >
                      <Text style={[styles.scoreBadgeText, { color: colors.WHITE }]}>
                        {score.totalScore.toFixed(0)}/100
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricsGrid}>
                    {METRICS.map((metric) => (
                      <MetricRow
                        key={metric.key}
                        label={metric.label}
                        value={score.scores[metric.key]}
                        barColor={colors[metric.color]}
                        colors={colors}
                      />
                    ))}
                  </View>

                  <View style={[styles.returnRow, { borderTopColor: colors.BORDER }]}>
                    <Text style={[styles.returnLabel, { color: colors.TEXT_SECONDARY }]}>
                      Retorno anualizado:
                    </Text>
                    <Text style={[styles.returnValue, { color: colors.SUCCESS }]}>
                      {score.adjustedReturn.toFixed(2)}% E.A.
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Advertencias */}
          {recommendation.warnings.length > 0 && (
            <View
              style={[
                styles.section,
                { backgroundColor: colors.WARNING + '15', borderColor: colors.WARNING }
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.WARNING }]}>
                ⚠️ Consideraciones Importantes
              </Text>
              {recommendation.warnings.map((warning) => (
                <Text key={warning} style={[styles.warningText, { color: colors.TEXT_PRIMARY }]}>
                  {warning}
                </Text>
              ))}
            </View>
          )}

          {/* Alternativas */}
          {recommendation.alternatives.length > 0 && (
            <View
              style={[
                styles.section,
                { backgroundColor: colors.INFO + '15', borderColor: colors.INFO }
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.INFO }]}>💡 Alternativas</Text>
              {recommendation.alternatives.map((alternative) => (
                <Text
                  key={alternative}
                  style={[styles.alternativeText, { color: colors.TEXT_PRIMARY }]}
                >
                  {alternative}
                </Text>
              ))}
            </View>
          )}

          {/* Acciones */}
          <View style={styles.actions}>
            <MyButton
              title="Nueva Comparación"
              variant="primary"
              onPress={() => navigation.navigate('investmentComparisonHome')}
            />
            <MyButton title="Volver" variant="cancel" onPress={() => navigation.goBack()} />
          </View>

          {/* Disclaimer */}
          <View style={[styles.disclaimer, { borderColor: colors.BORDER }]}>
            <Text style={[styles.disclaimerText, { color: colors.TEXT_SECONDARY }]}>
              ⚠️ Esta es una simulación educativa. Los resultados son aproximados y no constituyen
              asesoría financiera. Consulta con un profesional antes de tomar decisiones de
              inversión.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Componente: Fila de métrica con barra
// ============================================================================

interface MetricRowProps {
  label: string;
  value: number;
  barColor: string;
  colors: AppColors;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, barColor, colors }) => (
  <View style={styles.metric}>
    <Text style={[styles.metricLabel, { color: colors.TEXT_SECONDARY }]}>{label}</Text>
    <View style={[styles.metricBar, { backgroundColor: colors.BORDER }]}>
      <View
        style={[styles.metricBarFill, { width: toPercentWidth(value), backgroundColor: barColor }]}
      />
    </View>
    <Text style={[styles.metricValue, { color: colors.TEXT_PRIMARY }]}>{value.toFixed(0)}%</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10
  },
  actions: {
    marginTop: 16,
    gap: 8
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  recommendationTitle: {
    fontSize: MEDIUM + 2,
    fontWeight: 'bold'
  },
  recommendationScenario: {
    fontSize: MEDIUM + 4,
    fontWeight: 'bold',
    marginBottom: 12
  },
  reasoningList: {
    gap: 8
  },
  reasoningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  reasoningText: {
    flex: 1,
    fontSize: SMALL + 1,
    lineHeight: 20
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1
  },
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
    marginBottom: 12
  },
  scoreCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  scoreTitle: {
    fontSize: SMALL + 2,
    fontWeight: '600'
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  scoreBadgeText: {
    fontSize: SMALL,
    fontWeight: 'bold'
  },
  metricsGrid: {
    gap: 8,
    marginBottom: 12
  },
  metric: {
    gap: 4
  },
  metricLabel: {
    fontSize: SMALL,
    fontWeight: '500'
  },
  metricBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden'
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3
  },
  metricValue: {
    fontSize: SMALL - 1,
    textAlign: 'right'
  },
  returnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1
  },
  returnLabel: {
    fontSize: SMALL
  },
  returnValue: {
    fontSize: SMALL + 1,
    fontWeight: 'bold'
  },
  warningText: {
    fontSize: SMALL,
    lineHeight: 18,
    marginBottom: 8
  },
  alternativeText: {
    fontSize: SMALL,
    lineHeight: 18,
    marginBottom: 8
  },
  disclaimer: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8
  },
  disclaimerText: {
    fontSize: SMALL - 1,
    lineHeight: 16,
    textAlign: 'center'
  }
});
