import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MenuCardButton from '~/components/buttons/MenuCardButton';

// Types
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type StatisticsScreenNavigationProp = StackNavigationProp<StatisticsStackParamList>;

interface StatisticsScreenProps {
  navigation: StatisticsScreenNavigationProp;
}

const HIGHLIGHT_COLOR = '#009688';

export default function StatisticsScreen({ navigation }: StatisticsScreenProps) {
  const config = screenConfigs.statistics;
  const colors = useThemeColors();

  const go = (route: keyof StatisticsStackParamList) => () => navigation.navigate(route as never);

  return (
    <ScrollView
      style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      {/* --- ESTADÍSTICAS GENERALES --- */}
      <View style={styles.section}>
        <MenuCardButton title="Comparar Períodos" onPress={go('comparePeriods')} />
        <MenuCardButton
          title="Análisis de Comentarios"
          onPress={go('commentaryAnalysis')}
          color={HIGHLIGHT_COLOR}
        />
        <MenuCardButton title="Gastos por categoría" onPress={go('expenseAnalysis')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 10
  }
});
