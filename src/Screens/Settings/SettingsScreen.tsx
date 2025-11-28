import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp } from '@react-navigation/native';

// Services
import { getUser } from '../../services/users';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';
import MenuCardButton from '~/components/buttons/MenuCardButton';

// Types
import { SettingsStackParamList, UserModel } from '../../shared/types';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList>;
type SettingsScreenRouteProp = RouteProp<SettingsStackParamList>;

// Define las props del componente
interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
  route: SettingsScreenRouteProp;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const config = screenConfigs.settings;
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
    <ScrollView style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}showsVerticalScrollIndicator={false}>
       <ScreenHeader title={config.title} subtitle={config.subtitle} />

      {/* --- GENERAL --- */}
      <View style={styles.section}>
        <MenuCardButton title="Cambiar contraseña" onPress={go('changePassword')} />
        <MenuCardButton title="Calcular productos" onPress={go('calculeProducts')} />
        <MenuCardButton title="Crear préstamo" onPress={go('createLoan')} />
        <MenuCardButton title="Gastos rango fechas" onPress={go('exportData')} />
        <MenuCardButton title="Búsqueda Avanzada" onPress={go('advancedSearch')} />
        <MenuCardButton title="Presupuesto Virtual" onPress={go('virtualBudget')} />
      </View>

      {/* --- SOLO ADMIN --- */}
      {userLoggued?.role === 1 && (
        <View style={styles.section}>
          <MenuCardButton title="Editar Perfil" onPress={go('editUser')} color="#009688" />
          <MenuCardButton title="Crear Usuario" onPress={go('createUser')} color="#009688" />
          <MenuCardButton title="Gestionar CSV" onPress={go('manageCSV')} color="#009688" />
          <MenuCardButton title="Gestionar Funcionalidades" onPress={go('manageFeatureFlags')} color="#009688" />
          <MenuCardButton title="Configurar Chatbot" onPress={go('chatbotConfig')} color="#009688" />
          <MenuCardButton title="Gestionar Modelos IA" onPress={go('aiModels')} color="#009688" />
          <MenuCardButton title="Gestionar Temas" onPress={go('manageThemes')} color="#009688" />
          <MenuCardButton title="Panel de Administración" onPress={go('adminDashboard')} color="#009688" />
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: 'white'
  },
  section: {
    marginVertical: 10
  }
});