import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { FlatList } from "react-native";
import { Button, StyleSheet, Text, Alert, View } from "react-native";
import { Colors, Inputs } from "~/styles";
import { useForm, Controller } from "react-hook-form";
import Input from "../../components/Input";
import {
  CreateSubcategory,
  getSubategoriesByCategory,
} from "../../services/subcategories";
import MyButton from "~/components/MyButton";
import { MEDIUM } from "../../styles/fonts";
import FlatListItem from "./components/FlatListItem";
import {Keyboard} from 'react-native';

export default function CreateSubcategoryScreen({ route, navigation }) {
  const idCategory = route.params.idCategory;
  const [subcategories, setSubcategories] = useState([]);
  const { handleSubmit, control, errors, reset } = useForm({
    defaultValues: { name: null },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!idCategory) {
        return;
      }
      const { data } = await getSubategoriesByCategory(idCategory);
      setSubcategories(data);
    } catch (e) {
      console.error(e);
    }
  };
  const create = async (payload) => {
    try {
      const { data } = await CreateSubcategory({
        ...payload,
        categoryId: idCategory,
      });
      const newSubcategories = [...subcategories, data];
      setSubcategories(newSubcategories);
      Keyboard.dismiss()
      reset()
    } catch (error) {
      console.error(e);
    }
  };
  const updateList = () => {
    fetchData();
  };

  return (
    <View style={styles.container}>
      <Text>Subcategorias</Text>
      <StatusBar style="auto" />
      <Controller
        name="name"
        control={control}
        rules={{
          required: {
            value: true,
            message: "El nombre de la categoria es obligatorio",
          },
          maxLength: {
            value: 200,
            message: "El nombre no puede superar 200 caracteres",
          },
        }}
        render={({ onChange, value }) => (
          <Input
            error={errors.name}
            errorText={errors?.name?.message}
            onChangeText={(text) => onChange(text)}
            value={value}
            placeholder="Nombre subcategoria"
          />
        )}
        defaultValue=""
      />
      <MyButton onPress={handleSubmit(create)} title="Guardar" />
      <FlatListItem data={subcategories} updateList={updateList} />
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
  input: {
    ...Inputs.base,
  },
  item: {
    padding: 10,
    fontSize: MEDIUM,
    height: 44,
  },
});
