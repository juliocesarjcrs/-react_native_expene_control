import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import { useForm, Controller } from "react-hook-form";
import MyButton from "~/components/MyButton";
import { Input } from "react-native-elements";
import {Errors} from '../../utils/Errors';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {editUser} from '../../services/users';
import ShowToast from '../../components/toast/ShowToast';
import { useDispatch } from "react-redux";
import { setUserAction } from "~/actions/authActions"; 
export default function EditUserScreen ({navigation}) {

  const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const { handleSubmit, control,setValue, errors } = useForm({
    defaultValues: {email: '', name: ''}
  });

  const [idUser, setIdUser] = useState(null);


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
      setValue("email", user.email);
      setValue("name", user.name);
      setIdUser(user.id)
    } catch (error) {
      Errors(error);
    }
  };

  const dispatch = useDispatch();
  const onSubmit = async (payload) => {
    try {
      const { data } = await editUser(idUser, payload);
      dispatch(setUserAction(data));
      ShowToast();
    } catch (error) {
      Errors(error);
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
        name="name"
        control={control}
        rules={{
          required: { value: true, message: "El nombre es obligatorio" },
        }}
        render={({ onChange, value }) => (
          <Input
            value={value}
            placeholder="Nombre"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.name?.message}
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