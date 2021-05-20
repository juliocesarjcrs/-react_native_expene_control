
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { useForm, Controller } from "react-hook-form";
import Input from '../../components/Input';
import { EditCategory, getCategory } from '../../services/categories';
import MyButton from "~/components/MyButton";
import {Errors} from '../../utils/Errors';

export default function EditCategoryScreen({ route }) {
  const idCategory =  route.params.idCategory;

  const [category, setCategory] = useState([]);

  const { handleSubmit, control, errors, reset } = useForm({
    defaultValues: category}
   );
   useEffect(() => {
    fetchData()
  }, [reset])

  const fetchData = async () => {
    try {
      const { data } = await getCategory(idCategory)
      setCategory(data)
      reset(data);
    } catch (e) {
      Errors(e)
    }
  }

  const onSubmit = async (payload) => {
    try {
      const { data } = await EditCategory(idCategory, payload)
      Keyboard.dismiss()
    } catch (error) {
      console.error(error);
    }
  }
 

  return (

    <View style={styles.container}>
      <Text>Categorias</Text>
      <StatusBar style="auto" />
      <Controller
        name="name"
        control={control}
        rules={{
          required: { value: true, message: "El nombre de la categoria es obligatorio" },
          maxLength: { value: 200, message: "El nombre no puede superar 200 caracteres" },

        }}
        render={({ onChange, value }) => (
          <Input
            error={errors.name}
            errorText={errors?.name?.message}
            onChangeText={(text) => onChange(text)}
            value={value}
            placeholder="Nombre categoria"
          />
        )}
        defaultValue=""
      />
      <Controller
        name="icon"
        control={control}
        rules={{
          maxLength: { value: 200, message: "El icono no puede superar 200 caracteres" },
        }}
        render={({ onChange, value }) => (
          <Input
            error={errors.icon}
            errorText={errors?.icon?.message}
            onChangeText={(text) => onChange(text)}
            value={value}
            placeholder="Icono"
          />
        )}
        defaultValue=""
      />
      <MyButton
        onPress={handleSubmit(onSubmit)}
        title="Editar"
      />
    </View>


  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
