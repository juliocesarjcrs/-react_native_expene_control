import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import ChangePasswordScreen from '../Users/ChangePasswordScreen';
import EditUserScreen from '../Users/EditUserScreen';

export default function SettingsScreen ({navigation}) {

  return (
    <View style={styles.container}>
      <Text>Configuraciones</Text>
      {/* <EditUserScreen navigation={navigation}></EditUserScreen> */}
      <ChangePasswordScreen navigation={navigation}></ChangePasswordScreen>

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