import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

// Components
import GraphIncomesByCategory from './components/GraphIncomesByCategory';
import GraphBySubcategory from './components/GraphBySubcategory';
import { ScreenHeader } from '~/components/ScreenHeader';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

interface GraphBalancesScreenProps {
  navigation: any;
}

export default function GraphBalancesScreen({ navigation }: GraphBalancesScreenProps) {
  const config = screenConfigs.graphBalances;
  const colors = useThemeColors();
  return (
    <View style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <ScrollView>
        <GraphBySubcategory navigation={navigation} />
        <GraphIncomesByCategory navigation={navigation} />
      </ScrollView>
    </View>
  );
}
