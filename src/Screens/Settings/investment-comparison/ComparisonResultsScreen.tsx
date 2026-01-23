import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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

export default function ComparisonResultsScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.comparisonResults;
  const { comparisonId } = route.params;

  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async (): Promise<void> => {
    try {
      setLoading(true);
      const comparison = await InvestmentComparisonService.getComparison(comparisonId);

      if (!comparison) {
        ShowToast('Comparación no encontrada');
        navigation.goBack();
        return;
      }

      // Calcular resultados
      const results: any = {};

      if (comparison.scenarios.savings) {
        results.savings = InvestmentComparisonService.calculateSavingsScenario(
          comparison.scenarios.savings
        );
      }

      if (comparison.scenarios.futureProperty) {
        results.futureProperty = InvestmentComparisonService.calculateFuturePropertyScenario(
          comparison.scenarios.futureProperty
        );
      }

      if (comparison.scenarios.immediateRent) {
        results.immediateRent = InvestmentComparisonService.calculateImmediateRentScenario(
          comparison.scenarios.immediateRent
        );
      }
      if (comparison.scenarios.existingProperty) {
        results.existingProperty = InvestmentComparisonService.calculateExistingPropertyScenario(
          comparison.scenarios.existingProperty
        );
      }

      // Generar recomendación
      const recommendation = InvestmentComparisonService.generateRecommendation(
        comparison,
        results
      );

      setResult({ comparison, recommendation });
      setLoading(false);
    } catch (error) {
      console.error('Error loading comparison:', error);
      ShowToast('Error al cargar comparación');
      setLoading(false);
    }
  };

  if (loading || !result) {
    return (
      <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
        <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />
        <MyLoading />
      </View>
    );
  }

  const { comparison, recommendation } = result;
  const scenarioNames = {
    [ScenarioType.SAVINGS]: 'Ahorro/Inversión',
    [ScenarioType.FUTURE_PROPERTY]: 'Vivienda a Futuro',
    [ScenarioType.IMMEDIATE_RENT]: 'Compra Inmediata',
    [ScenarioType.EXISTING_PROPERTY]: 'Propiedad Actual'
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
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
              {scenarioNames[recommendation.recommendedScenario]}
            </Text>

            <View style={styles.reasoningList}>
              {recommendation.reasoning.map((reason, index) => (
                <View key={index} style={styles.reasoningItem}>
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

            {recommendation.scores.map((score) => (
              <View
                key={score.scenarioType}
                style={[
                  styles.scoreCard,
                  {
                    backgroundColor:
                      score.scenarioType === recommendation.recommendedScenario
                        ? colors.SUCCESS + '10'
                        : colors.BACKGROUND,
                    borderColor:
                      score.scenarioType === recommendation.recommendedScenario
                        ? colors.SUCCESS
                        : colors.BORDER
                  }
                ]}
              >
                <View style={styles.scoreHeader}>
                  <Text style={[styles.scoreTitle, { color: colors.TEXT_PRIMARY }]}>
                    {scenarioNames[score.scenarioType]}
                  </Text>
                  <View
                    style={[
                      styles.scoreBadge,
                      {
                        backgroundColor:
                          score.scenarioType === recommendation.recommendedScenario
                            ? colors.SUCCESS
                            : colors.INFO
                      }
                    ]}
                  >
                    <Text style={[styles.scoreBadgeText, { color: colors.WHITE }]}>
                      {score.totalScore.toFixed(0)}/100
                    </Text>
                  </View>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.TEXT_SECONDARY }]}>
                      Rentabilidad
                    </Text>
                    <View style={styles.metricBar}>
                      <View
                        style={[
                          styles.metricBarFill,
                          {
                            width: `${score.scores.profitability}%`,
                            backgroundColor: colors.SUCCESS
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.metricValue, { color: colors.TEXT_PRIMARY }]}>
                      {score.scores.profitability.toFixed(0)}%
                    </Text>
                  </View>

                  <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.TEXT_SECONDARY }]}>
                      Liquidez
                    </Text>
                    <View style={styles.metricBar}>
                      <View
                        style={[
                          styles.metricBarFill,
                          {
                            width: `${score.scores.liquidity}%`,
                            backgroundColor: colors.INFO
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.metricValue, { color: colors.TEXT_PRIMARY }]}>
                      {score.scores.liquidity.toFixed(0)}%
                    </Text>
                  </View>

                  <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.TEXT_SECONDARY }]}>
                      Seguridad
                    </Text>
                    <View style={styles.metricBar}>
                      <View
                        style={[
                          styles.metricBarFill,
                          {
                            width: `${score.scores.security}%`,
                            backgroundColor: colors.PRIMARY
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.metricValue, { color: colors.TEXT_PRIMARY }]}>
                      {score.scores.security.toFixed(0)}%
                    </Text>
                  </View>

                  <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.TEXT_SECONDARY }]}>
                      Flujo de caja
                    </Text>
                    <View style={styles.metricBar}>
                      <View
                        style={[
                          styles.metricBarFill,
                          {
                            width: `${score.scores.cashFlow}%`,
                            backgroundColor: colors.WARNING
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.metricValue, { color: colors.TEXT_PRIMARY }]}>
                      {score.scores.cashFlow.toFixed(0)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.returnRow}>
                  <Text style={[styles.returnLabel, { color: colors.TEXT_SECONDARY }]}>
                    Retorno anualizado:
                  </Text>
                  <Text style={[styles.returnValue, { color: colors.SUCCESS }]}>
                    {score.adjustedReturn.toFixed(2)}% E.A.
                  </Text>
                </View>
              </View>
            ))}
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
              {recommendation.warnings.map((warning, index) => (
                <Text key={index} style={[styles.warningText, { color: colors.TEXT_PRIMARY }]}>
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
              {recommendation.alternatives.map((alternative, index) => (
                <Text key={index} style={[styles.alternativeText, { color: colors.TEXT_PRIMARY }]}>
                  {alternative}
                </Text>
              ))}
            </View>
          )}

          {/* Acciones */}
          <View style={{ marginTop: 16, gap: 8 }}>
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

const styles = StyleSheet.create({
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
    backgroundColor: '#E0E0E0',
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
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
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
