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

const ADMIN_ROLE = 1;
const ADMIN_COLOR = '#009688';

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const config = screenConfigs.settings;
  const colors = useThemeColors();
  const [loggedUser, setLoggedUser] = useState<UserModel>();

  useEffect(() => {
    let isMounted = true;

    const fetchLoggedUser = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('user');
        const storedUser = jsonValue ? JSON.parse(jsonValue) : null;
        if (!storedUser?.id) return;

        const { data } = await getUser(storedUser.id);
        if (isMounted) setLoggedUser(data);
      } catch (error) {
        showError(error);
      }
    };

    // 'focus' se dispara también en el primer enfoque de la pantalla,
    // por lo que no hace falta llamar a la función directamente aquí.
    const unsubscribe = navigation.addListener('focus', fetchLoggedUser);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigation]);

  const go = (route: keyof SettingsStackParamList) => () => navigation.navigate(route as never);

  return (
    <ScrollView
      style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title={config.title} subtitle={config.subtitle} />

      {/* --- GENERAL --- */}
      <View style={styles.section}>
        <MenuCardButton title="Cambiar contraseña" onPress={go('changePassword')} />
        <MenuCardButton title="Calcular productos" onPress={go('calculeProducts')} />
        <MenuCardButton title="Crear préstamo" onPress={go('createLoan')} />
        <MenuCardButton title="Gastos rango fechas" onPress={go('exportData')} />
        <MenuCardButton title="Búsqueda Avanzada" onPress={go('advancedSearch')} />
        <MenuCardButton title="Presupuesto Virtual" onPress={go('virtualBudget')} />
        <MenuCardButton title="Mi Tema" onPress={go('userThemeSettings')} />
        <MenuCardButton
          title="Comparador de Inversiones"
          onPress={go('investmentComparisonHome')}
        />
        <MenuCardButton title="Plantillas de Comentarios" onPress={go('commentaryTemplates')} />
      </View>

      {/* --- SOLO ADMIN --- */}
      {loggedUser?.role === ADMIN_ROLE && (
        <View style={styles.section}>
          <MenuCardButton
            title="Gestionar permisos usuario"
            onPress={go('manageUserPermissions')}
            color={ADMIN_COLOR}
          />
          <MenuCardButton title="Editar Perfil" onPress={go('editUser')} color={ADMIN_COLOR} />
          <MenuCardButton title="Crear Usuario" onPress={go('createUser')} color={ADMIN_COLOR} />
          <MenuCardButton title="Gestionar CSV" onPress={go('manageCSV')} color={ADMIN_COLOR} />
          <MenuCardButton
            title="Gestionar Funcionalidades"
            onPress={go('manageFeatureFlags')}
            color={ADMIN_COLOR}
          />
          <MenuCardButton
            title="Configurar Chatbot"
            onPress={go('chatbotConfig')}
            color={ADMIN_COLOR}
          />
          <MenuCardButton
            title="Gestionar Modelos IA"
            onPress={go('aiModels')}
            color={ADMIN_COLOR}
          />
          <MenuCardButton
            title="Gestionar Temas"
            onPress={go('manageThemes')}
            color={ADMIN_COLOR}
          />
          <MenuCardButton
            title="Panel de Administración"
            onPress={go('adminDashboard')}
            color={ADMIN_COLOR}
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
