import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import ChangePasswordScreen from '../Users/ChangePasswordScreen';
import MyButton from "~/components/MyButton";

export default function SettingsScreen ({navigation}) {
  const sendEditUserScreen= () => {
    navigation.navigate("editUser");
  };
  const sendchangePasswordScreen= () => {
    navigation.navigate("changePassword");
  };
  
  return (
    <View style={styles.container}>
      <View>
          <MyButton onPress={sendEditUserScreen} title="Editar perfil" />
          <MyButton onPress={sendchangePasswordScreen} title="Cambiar contraseña" />
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