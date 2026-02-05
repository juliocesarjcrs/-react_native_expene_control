import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp } from '@react-navigation/native';

// Services
import { getUser } from '~/services/users';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MenuCardButton from '~/components/buttons/MenuCardButton';

// Types
import { UserModel } from '~/shared/types';
import { StatisticsStackParamList } from '~/shared/types/navigator/stack.type';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type StatisticsScreenNavigationProp = StackNavigationProp<StatisticsStackParamList>;
type StatisticsScreenRouteProp = RouteProp<StatisticsStackParamList>;

interface StatisticsScreenProps {
  navigation: StatisticsScreenNavigationProp;
  route: StatisticsScreenRouteProp;
}

export default function StatisticsScreen({ navigation }: StatisticsScreenProps) {
  const config = screenConfigs.statistics;
  const colors = useThemeColors();
  const [userLoggued, setUserLoggued] = useState<UserModel>();

  useEffect(() => {
    fetchDataUserLogued();
    return navigation.addListener('focus', fetchDataUserLogued);
  }, []);

  const fetchDataUserLogued = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user');
      const user = jsonValue ? JSON.parse(jsonValue) : null;
      const { data } = await getUser(user.id);
      setUserLoggued(data);
    } catch (error) {
      showError(error);
    }
  };

  const go = (route: any) => () => navigation.navigate(route);

  return (
    <ScrollView
      style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      {/* --- ESTADÍSTICAS GENERALES --- */}
      <View style={styles.section}>
        <MenuCardButton title="Comparar Períodos" onPress={go('comparePeriods')} />
      </View>

      {/* --- ANÁLISIS DE COMENTARIOS (SOLO ADMIN MIENTRAS SE PRUEBA) --- */}
      {userLoggued?.role === 1 && (
        <View style={styles.section}>
          <MenuCardButton
            title="Análisis de Comentarios"
            onPress={go('commentaryAnalysis')}
            color="#009688"
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 10
  }
});
