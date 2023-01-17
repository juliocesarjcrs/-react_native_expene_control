import React, { useEffect, useState } from "react";
import {  StyleSheet, View } from "react-native";
import {  Inputs } from "~/styles";
import { useForm, Controller } from "react-hook-form";
import { Input } from "react-native-elements";
import {
  CreateSubcategory,
  getSubategoriesByCategory,
} from "../../services/subcategories";
import MyButton from "~/components/MyButton";
import { MEDIUM } from "../../styles/fonts";
import FlatListItem from "./components/FlatListItem";
import {Keyboard} from 'react-native';
import Title from '../../components/Title';
import MyLoading from "~/components/loading/MyLoading";
import {Errors} from '../../utils/Errors';

export default function CreateSubcategoryScreen({ route, navigation }) {
  const idCategory = route.params.idCategory;
  const [subcategories, setSubcategories] = useState([]);
  const {
    handleSubmit,
    control,
    reset,

    formState: {
      errors,
    },
  } = useForm({
    defaultValues: { name: null },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    try {
      if (!idCategory) {
        return;
      }
      const { data } = await getSubategoriesByCategory(idCategory);
      setSubcategories(data);
    } catch (error) {
      Errors(error)
    }
  };
  const create = async (payload) => {
    try {
      setLoading(true)
      const { data } = await CreateSubcategory({
        ...payload,
        categoryId: idCategory,
      });
      setLoading(false)
      const newSubcategories = [...subcategories, data];
      setSubcategories(newSubcategories);
      Keyboard.dismiss()
      reset()
    } catch (error) {
      setLoading(false)
      Errors(error)
    }
  };
  const updateList = () => {
    fetchData();
  };

  return (
    <View style={styles.container}>
      <Controller
        name="name"
        control={control}
        rules={{
          required: {
            value: true,
            message: "El nombre de la subcategoria es obligatorio",
          },
          maxLength: {
            value: 200,
            message: "El nombre no puede superar 200 caracteres",
          },
        }}
        render={({ field: { onChange , value  } }) => (
          <Input
          label="Subcategoria"
          value={value}
          placeholder="Ej: Recibo de agua"
          onChangeText={(text) => onChange(text)}
          errorStyle={{ color: "red" }}
          errorMessage={errors?.name?.message}
        />
        )}
        defaultValue=""
      />
       {loading ? (
        <MyLoading />
      ) : (
        <MyButton onPress={handleSubmit(create)} title="Guardar" />
      )}
      <FlatListItem data={subcategories} updateList={updateList} navigation={navigation} />
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
  item: {
    padding: 10,
    fontSize: MEDIUM,
    height: 44,
  },
});
