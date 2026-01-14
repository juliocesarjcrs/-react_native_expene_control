// ~/Screens/settings/investment-comparison/ScenarioConfigScreen.tsx

import React, { useState } from 'react';
import { View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MyLoading from '~/components/loading/MyLoading';
import { SavingsForm } from './forms/SavingsForm';
import { FuturePropertyForm } from './forms/FuturePropertyForm';
import { ImmediateRentForm } from './forms/ImmediateRentForm';

// Context
import { useInvestmentComparison } from '~/contexts/InvestmentComparisonContext';

// Types
import { ScenarioType } from '~/shared/types/services/Investment-comparison.types';
import { SettingsStackParamList } from '~/shared/types';

// Utils & Theme
import { useThemeColors } from '~/customHooks/useThemeColors';
import { commonStyles } from '~/styles/common';
import { screenConfigs } from '~/config/screenConfigs';

type NavigationProp = StackNavigationProp<SettingsStackParamList, 'scenarioConfig'>;
type RoutePropType = RouteProp<SettingsStackParamList, 'scenarioConfig'>;

interface Props {
  navigation: NavigationProp;
  route: RoutePropType;
}

export default function ScenarioConfigScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const screenConfig = screenConfigs.scenarioConfig;
  const { scenarioType } = route.params;
  const { getScenario } = useInvestmentComparison();

  const [loading] = useState<boolean>(false);

  // Obtener datos existentes si los hay
  const existingData = getScenario(scenarioType);

  const renderForm = () => {
    switch (scenarioType) {
      case ScenarioType.SAVINGS:
        return <SavingsForm colors={colors} navigation={navigation} existingData={existingData} />;

      case ScenarioType.FUTURE_PROPERTY:
        return (
          <FuturePropertyForm colors={colors} navigation={navigation} existingData={existingData} />
        );

      case ScenarioType.IMMEDIATE_RENT:
        return (
          <ImmediateRentForm colors={colors} navigation={navigation} existingData={existingData} />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
        <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />
        <MyLoading />
      </View>
    );
  }

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={screenConfig.title} subtitle={screenConfig.subtitle} />
      {renderForm()}
    </View>
  );
}
