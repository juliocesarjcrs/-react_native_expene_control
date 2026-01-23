// ~/Screens/settings/investment-comparison/InvestmentComparisonHomeScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyButton from '~/components/MyButton';
import { ProfileSelector } from './components/ProfileSelector';
import { ScenarioCard } from './components/ScenarioCard';

// Context
import { useInvestmentComparison } from '~/contexts/InvestmentComparisonContext';

// Types
import {
  ScenarioType,
  UserPriority,
  ComparisonData
} from '~/shared/types/services/Investment-comparison.types';

// Utils & Theme
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';
import { screenConfigs } from '~/config/screenConfigs';
import { MEDIUM, SMALL } from '~/styles/fonts';
import { ShowToast } from '~/utils/toastUtils';

// Services
import InvestmentComparisonService from '~/services/InvestmentComparisonService';
import { SettingsStackParamList } from '~/shared/types';

type NavigationProp = StackNavigationProp<SettingsStackParamList, 'investmentComparisonHome'>;

interface Props {
  navigation: NavigationProp;
}

export default function InvestmentComparisonHomeScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.investmentComparisonHome;

  // Context - NOMBRES CORRECTOS
  const { state, updateUserProfile, isScenarioConfigured, clearAllScenarios } =
    useInvestmentComparison();

  // Estados locales
  const [selectedScenarios, setSelectedScenarios] = useState<ScenarioType[]>([]);

  // Refrescar cuando vuelve de configuración
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // El estado se actualiza automáticamente por el Context
    });
    return unsubscribe;
  }, [navigation]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSelectScenario = (type: ScenarioType): void => {
    if (selectedScenarios.includes(type)) {
      setSelectedScenarios(selectedScenarios.filter((s) => s !== type));
    } else {
      if (selectedScenarios.length >= 3) {
        ShowToast('Máximo 3 escenarios para comparar');
        return;
      }
      setSelectedScenarios([...selectedScenarios, type]);
    }
  };

  const handleConfigureScenario = (type: ScenarioType): void => {
    navigation.navigate('scenarioConfig', { scenarioType: type });
  };

  const handleCompare = async (): Promise<void> => {
    // Validar mínimo 2 escenarios
    if (selectedScenarios.length < 2) {
      Alert.alert('Atención', 'Debes seleccionar al menos 2 escenarios para comparar.');
      return;
    }

    // Validar que todos estén configurados
    const unconfigured = selectedScenarios.filter((type) => !isScenarioConfigured(type));
    if (unconfigured.length > 0) {
      Alert.alert(
        'Atención',
        'Debes configurar todos los escenarios seleccionados antes de comparar.'
      );
      return;
    }

    try {
      // Crear objeto de comparación
      const comparison: ComparisonData = {
        id: Date.now().toString(),
        createdAt: new Date(),
        userProfile: state.userProfile,
        scenarios: {},
        results: {}
      };

      // Agregar escenarios configurados
      if (selectedScenarios.includes(ScenarioType.SAVINGS) && state.scenarios.savings) {
        comparison.scenarios.savings = state.scenarios.savings;
      }
      if (
        selectedScenarios.includes(ScenarioType.FUTURE_PROPERTY) &&
        state.scenarios.futureProperty
      ) {
        comparison.scenarios.futureProperty = state.scenarios.futureProperty;
      }
      if (
        selectedScenarios.includes(ScenarioType.IMMEDIATE_RENT) &&
        state.scenarios.immediateRent
      ) {
        comparison.scenarios.immediateRent = state.scenarios.immediateRent;
      }

      if (
        selectedScenarios.includes(ScenarioType.EXISTING_PROPERTY) &&
        state.scenarios.existingProperty
      ) {
        comparison.scenarios.existingProperty = state.scenarios.existingProperty;
      }

      // Guardar en AsyncStorage
      await InvestmentComparisonService.saveComparison(comparison);

      // Navegar a resultados

      navigation.navigate('comparisonResults', { comparisonId: comparison.id });
      ShowToast('Comparación generada');
    } catch (error) {
      console.error('🔴 [HomeScreen] ERROR en handleCompare:', error);
      Alert.alert('Error', 'No se pudo generar la comparación. Intenta de nuevo.');
    }
  };

  const handleUpdateProfile = (field: string, value: any): void => {
    updateUserProfile({ [field]: value });
  };

  const togglePriority = (priority: UserPriority): void => {
    const priorities = [...state.userProfile.priorities];
    const index = priorities.indexOf(priority);

    if (index > -1) {
      priorities.splice(index, 1);
    } else {
      if (priorities.length >= 4) {
        ShowToast('Máximo 4 prioridades');
        return;
      }
      priorities.push(priority);
    }

    updateUserProfile({ priorities });
  };

  // ============================================
  // DATOS DE ESCENARIOS
  // ============================================

  const scenarioOptions = [
    {
      type: ScenarioType.SAVINGS,
      icon: 'piggy-bank',
      title: 'Ahorro / Inversión Líquida',
      description: 'Cajitas Nubank, CDT, cuentas de alto rendimiento',
      color: colors.SUCCESS
    },
    {
      type: ScenarioType.FUTURE_PROPERTY,
      icon: 'home-clock',
      title: 'Vivienda a Futuro',
      description: 'Ahorra cuota inicial, luego compra y arrienda',
      color: colors.INFO
    },
    {
      type: ScenarioType.IMMEDIATE_RENT,
      icon: 'home-import-outline',
      title: 'Compra Inmediata para Renta',
      description: 'Invierte ahora en propiedad para generar ingresos',
      color: colors.WARNING
    },
    {
      type: ScenarioType.EXISTING_PROPERTY,
      icon: 'home-analytics',
      title: 'Propiedad Existente',
      description: 'Compara mantener vs vender tu propiedad actual',
      color: colors.PRIMARY
    }
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {/* Perfil del Usuario */}
          <ProfileSelector
            userProfile={state.userProfile}
            onUpdateProfile={handleUpdateProfile}
            onTogglePriority={togglePriority}
            colors={colors}
          />

          {/* Seleccionar Escenarios */}
          <View
            style={[
              styles.section,
              { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
              Escenarios a Comparar
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.TEXT_SECONDARY }]}>
              Selecciona 2 o 3 opciones para analizar
            </Text>

            {scenarioOptions.map((scenario) => (
              <ScenarioCard
                key={scenario.type}
                scenario={scenario}
                isSelected={selectedScenarios.includes(scenario.type)}
                isConfigured={isScenarioConfigured(scenario.type)}
                onSelect={() => handleSelectScenario(scenario.type)}
                onConfigure={() => handleConfigureScenario(scenario.type)}
                colors={colors}
              />
            ))}
          </View>

          {/* Botón Comparar */}
          <View style={{ marginTop: 16 }}>
            <MyButton
              title={`Comparar ${selectedScenarios.length} Escenarios`}
              variant="primary"
              onPress={handleCompare}
              disabled={selectedScenarios.length < 2}
            />
          </View>

          {/* Info adicional */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: colors.INFO + '15', borderColor: colors.INFO }
            ]}
          >
            <Icon type="material-community" name="information" size={20} color={colors.INFO} />
            <Text style={[styles.infoText, { color: colors.INFO }]}>
              Todos los cálculos consideran impuestos colombianos (4x1000, retención en la fuente,
              predial, etc.)
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  sectionTitle: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: SMALL,
    marginBottom: 12
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1
  },
  infoText: {
    flex: 1,
    fontSize: SMALL,
    lineHeight: 18
  }
});
