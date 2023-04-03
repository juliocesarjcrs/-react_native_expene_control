import React, { useEffect, useState } from "react";
import {StyleSheet, Text, View} from 'react-native';
import ChangePasswordScreen from '../Users/ChangePasswordScreen';
import MyButton from "~/components/MyButton";
import { Errors } from "../../utils/Errors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {getUser} from '~/services/users';
export default function SettingsScreen ({navigation}) {
  const [userLoggued, setUserLoggued] = useState({});
  useEffect(() => {
    fetchDataUserLogued();
    return navigation.addListener("focus", () => {
      fetchDataUserLogued();
    });

  }, []);

  const fetchDataUserLogued = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user')
      const user = jsonValue != null ? JSON.parse(jsonValue) : null;
      const {data} = await getUser(user.id);
      setUserLoggued(data);
    } catch (error) {
      Errors(error);
    }
  };
  const sendEditUserScreen= () => {
    navigation.navigate("editUser");
  };
  const sendchangePasswordScreen= () => {
    navigation.navigate("changePassword");
  };

  const sendCreateUserScreen= () => {
    navigation.navigate("createUser");
  };
  const sendcCalculeProductsScreen= () => {
    navigation.navigate("calculeProducts");
  };
  const sendCreateLoanScreen= () => {
    navigation.navigate("createLoan");
  };
  return (
    <View style={styles.container}>
      <View>
          {userLoggued.role==1 && <MyButton onPress={sendEditUserScreen} title="Editar perfil" />}
          <MyButton onPress={sendchangePasswordScreen} title="Cambiar contraseña" />
          {userLoggued.role==1 && <MyButton onPress={sendCreateUserScreen} title="Crear Usuario" /> }
          <MyButton onPress={sendcCalculeProductsScreen} title="Calcuar productos" />
          <MyButton onPress={sendCreateLoanScreen} title="Crear préstamo" />
        </View>
      {/* <Text>Configuraciones</Text> */}
      {/* <EditUserScreen navigation={navigation}></EditUserScreen> */}
      {/* <ChangePasswordScreen navigation={navigation}></ChangePasswordScreen> */}

    </View>
  )


}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
  }
});