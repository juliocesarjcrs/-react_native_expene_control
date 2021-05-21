import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import Input from "../../components/Input";
import { useForm, Controller } from "react-hook-form";
import { login } from "~/services/auth";
import { useDispatch } from "react-redux";
import { setUserAction, setAuthAction } from "~/actions/authActions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyButton from "~/components/MyButton";

export default function LoginScreen({ navigation }) {
  const EMAIL_REGEX =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const { handleSubmit, control, errors } = useForm();
  const dispatch = useDispatch();
  const onSubmit = async (payload) => {
    try {
      const { data } = await login(payload);

      await AsyncStorage.setItem("access_token", data.access_token);

      const jsonValue = JSON.stringify(data.user);
      await AsyncStorage.setItem("user", jsonValue);
      dispatch(setUserAction(data.user));
      dispatch(setAuthAction(true));

      // navigation.navigate("categoriesList");
    } catch (error) {
      dispatch(setUserAction(null));
      dispatch(setAuthAction(false));
      console.log(error, "error");
    }
  };
  return (
    <View style={styles.container}>
      <Controller
        name="email"
        control={control}
        rules={{
          required: { value: true, message: "Email es obligatorio" },
          pattern: {
            value: EMAIL_REGEX,
            message: "Not a valid email",
          },
        }}
        render={({ onChange, value }) => (
          <Input
            error={errors.email}
            errorText={errors?.email?.message}
            onChangeText={(text) => onChange(text)}
            value={value}
            placeholder="Email"
          />
        )}
        defaultValue=""
      />
      <Controller
        name="password"
        control={control}
        rules={{
          required: { value: true, message: "La contraseña es obligatorio" },
        }}
        render={({ onChange, value }) => (
          <Input
            error={errors.password}
            errorText={errors?.password?.message}
            onChangeText={(text) => onChange(text)}
            value={value}
            placeholder="password"
            secure={true}
          />
        )}
        defaultValue=""
      />
      <View
        style={{
          marginTop: 35,
        }}
      >
        <MyButton title="iniciar sesión" onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
