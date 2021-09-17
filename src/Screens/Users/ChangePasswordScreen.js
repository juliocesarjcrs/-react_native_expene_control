import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import { useForm, Controller } from "react-hook-form";
import MyButton from "~/components/MyButton";
import { Input } from "react-native-elements";

import {getUser} from '~/services/users';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {changePassword} from '../../services/users';
import {Errors} from '../../utils/Errors';

export default function ChangePasswordScreen ({navigation}) {

  const { handleSubmit, control, errors, watch } = useForm({
    defaultValues: {currentlyPassword: '', password: '', passwordComfirm: ''}
  });
  const password = useRef({});
  password.current = watch("password", "")


  const onSubmit = async (payload) => {
    try {
      const jsonValue = await AsyncStorage.getItem('user')
      const user = jsonValue != null ? JSON.parse(jsonValue) : null;
      const { data } = await changePassword(user.id, payload);
      // await AsyncStorage.setItem("user", jsonValue);
      // dispatch(setUserAction(data.user));
      // dispatch(setAuthAction(true));
    } catch (error) {
      Errors(error);

    }
  };
  const samePassword = async(val) => {
    console.log('val', val);
    return true;
  }
  return (
    <View style={styles.container}>
      <Text>Editar usuario</Text>
      <View style={styles.container2}>
      <Controller
        name="currentlyPassword"
        control={control}
        rules={{
          required: { value: true, message: "La contraseña es obligatorio" },
          minLength: { value: true, message: "La contraseña tiene que ser mayor a 2 caracteres" }
        }}
        render={({ onChange, value }) => (
          <Input
            value={value}
            placeholder="Contraseña actual"
            onChangeText={(text) => onChange(text)}
            secureTextEntry={true}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.currentlyPassword?.message}
          />
        )}
        defaultValue=""
      />
      <Controller
        name="password"
        control={control}
        rules={{
          required: { value: true, message: "La contraseña es obligatorio" },
          minLength: { value: true, message: "La contraseña tiene que ser mayor a 2 caracteres" }
        }}
        render={({ onChange, value }) => (
          <Input
            value={value}
            placeholder="Nueva contraseña"
            onChangeText={(text) => onChange(text)}
            secureTextEntry={true}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.password?.message}
          />
        )}
        defaultValue=""
      />
          <Controller
        name="passwordComfirm"
        control={control}
        rules={{
          required: { value: true, message: "La contraseña es obligatorio" },
          minLength: { value: true, message: "La contraseña tiene que ser mayor a 2 caracteres" },
          validate: value => value === password.current || "La contraseña no coincide"
        }}
        render={({ onChange, value }) => (
          <Input
            value={value}
            placeholder="Confirmar la nueva contraseña"
            onChangeText={(text) => onChange(text)}
            secureTextEntry={true}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.passwordComfirm?.message}
          />
        )}
        defaultValue=""
      />
      <MyButton title="Editar datos" onPress={handleSubmit(onSubmit)} />
      </View>

    </View>
  )


}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
  },
  container2: {
    flexDirection: "column",
    backgroundColor: "#fff",
  },
});