import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp } from '@react-navigation/native';

import { Errors } from '../../utils/Errors';

// Services
import { getUser } from '../../services/users';

// Components
import MyButton from '../../components/MyButton';

// Types
import { SettingsStackParamList, UserModel } from '../../shared/types';

type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList>;
type SettingsScreenRouteProp = RouteProp<SettingsStackParamList>;

// Define las props del componente
interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
  route: SettingsScreenRouteProp;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [userLoggued, setUserLoggued] = useState<UserModel>();
  useEffect(() => {
    fetchDataUserLogued();
    return navigation.addListener('focus', () => {
      fetchDataUserLogued();
    });
  }, []);

  const fetchDataUserLogued = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user');
      const user = jsonValue != null ? JSON.parse(jsonValue) : null;
      const { data } = await getUser(user.id);
      setUserLoggued(data);
    } catch (error) {
      Errors(error);
    }
  };
  const sendEditUserScreen = () => {
    navigation.navigate('editUser');
  };
  const sendchangePasswordScreen = () => {
    navigation.navigate('changePassword');
  };

  const sendCreateUserScreen = () => {
    navigation.navigate('createUser');
  };
  const sendcCalculeProductsScreen = () => {
    navigation.navigate('calculeProducts');
  };
  const sendCreateLoanScreen = () => {
    navigation.navigate('createLoan');
  };
  const sendExportExpenseScreen = () => {
    navigation.navigate('exportData');
  };
  const sendAdvancedSearchScreen = () => {
    navigation.navigate('advancedSearch');
  };
  const sendVirtualBudgetScreen = () => {
    navigation.navigate('virtualBudget');
  };
  const sendManageCSVsScreen = () => {
    navigation.navigate('manageCSV');
  };
  const sendManageFeatureFlagsScreen = () => {
  navigation.navigate('manageFeatureFlags');
};
  return (
    <View style={styles.container}>
      <View>
        {userLoggued?.role == 1 && <MyButton onPress={sendEditUserScreen} title="Editar perfil" />}
        <MyButton onPress={sendchangePasswordScreen} title="Cambiar contraseña" />
        {userLoggued?.role == 1 && <MyButton onPress={sendCreateUserScreen} title="Crear Usuario" />}
        <MyButton onPress={sendcCalculeProductsScreen} title="Calcuar productos" />
        <MyButton onPress={sendCreateLoanScreen} title="Crear préstamo" />
        <MyButton onPress={sendExportExpenseScreen} title="Gastos Rango fechas" />
        <MyButton onPress={sendAdvancedSearchScreen} title="Busqueda Avanzada" />
        <MyButton onPress={sendVirtualBudgetScreen} title="Presupuesto virtual" />
        {userLoggued?.role == 1 && <MyButton onPress={sendManageCSVsScreen} title="Gestonar Csv" />}
        {userLoggued?.role == 1 && <MyButton onPress={sendManageFeatureFlagsScreen} title="Gestionar Funcionalidades" />}
      </View>
      {/* <Text>Configuraciones</Text> */}
      {/* <EditUserScreen navigation={navigation}></EditUserScreen> */}
      {/* <ChangePasswordScreen navigation={navigation}></ChangePasswordScreen> */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10
  }
});
