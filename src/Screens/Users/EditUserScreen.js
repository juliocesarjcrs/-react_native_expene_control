import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import { useForm, Controller } from "react-hook-form";
import MyButton from "~/components/MyButton";
import { Input } from "react-native-elements";
import {Errors} from '../../utils/Errors';
import {getUser} from '~/services/users';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditUserScreen ({navigation}) {

  const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

 
  const [userEdit, setUserEdit] = useState({});
  const { handleSubmit, control,setValue, errors } = useForm({
    defaultValues: {email: 'test2', password: '123'}
  });
    // {
    // defaultValues: {email: 'test2'}
    // defaultValues: async () => ({ email: 'test' })
    // defaultValues: async () => {
    //   const jsonValue = await AsyncStorage.getItem('user')
    //   const user = jsonValue != null ? JSON.parse(jsonValue) : null;
    //   console.log('user', user);
    //   return {email: user.email}
    // }
    // email: async () => {
    //   console.log('aquis');
    //   const jsonValue = await AsyncStorage.getItem('user');
    //     const user = jsonValue != null ? JSON.parse(jsonValue) : null;
    //     return {email: user.email};
    // }
  // });

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user')
      const user = jsonValue != null ? JSON.parse(jsonValue) : null;
      console.log('user', user);
      setValue("email", user.email);
    } catch (error) {
      Errors(error);
    }
  };

  // const dispatch = useDispatch();
  const onSubmit = async (payload) => {
    try {
      // const { data } = await login(payload);
      // await AsyncStorage.setItem("access_token", data.access_token);
      // const jsonValue = JSON.stringify(data.user);
      // await AsyncStorage.setItem("user", jsonValue);
      // dispatch(setUserAction(data.user));
      // dispatch(setAuthAction(true));
    } catch (error) {
      console.log(error, "LOgin error");

    }
  };
  return (
    <View style={styles.container}>
      <Text>Editar usuario</Text>
      <View style={styles.container2}>
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
            value={value}
            placeholder="Email"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.email?.message}
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
            value={value}
            placeholder="Password"
            onChangeText={(text) => onChange(text)}
            secureTextEntry={true}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.password?.message}
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