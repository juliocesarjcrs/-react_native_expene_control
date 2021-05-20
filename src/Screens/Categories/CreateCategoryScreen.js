import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import Input from "../../components/Input";
import { CreateCategory, getCategories } from "../../services/categories";
import MyButton from "~/components/MyButton";
import IconsJson from "../../../assets/IconsJson/material-icons-list-json.json";
import FlatListItem from "./components/FlatListItem";
import Dropdown from "../../components/Dropdown";
import { Icon } from "react-native-elements";

export default function CreateCategoryScreen({ navigation }) {
  // iconos
  const [iconSubcategories, setIconSubcategories] = useState([
    { label: "home", value: "home" },
  ]);
  const [icon, setIcon] = useState("home");
  const iconCategories = IconsJson.categories.map((e, idx) => {
    return { label: e.name, value: idx };
  });
  const changeIcons = (key) => {
    let tempIconSubcategories = IconsJson.categories[parseInt(key)].icons;
    formatIconSubcategories = tempIconSubcategories.map((e, idx) => {
      return { label: e.name, value: e.ligature };
    });
    setIconSubcategories(formatIconSubcategories);
    console.log("IconSubcategories", iconSubcategories);
  };
  const selectIcon = (value) => {
    setIcon(value);
  };
  // console.log('iconCategories', iconCategories);
  const [categories, setCategories] = useState([]);
  const { handleSubmit, control, errors } = useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await getCategories();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };
  const onSubmit = async (payload) => {
    try {
      const dataTransform = { ...payload, icon };
      const { data } = await CreateCategory(dataTransform);
      const newCategories = [...categories, data];
      setCategories(newCategories);
    } catch (error) {
      console.error(error);
    }
  };
  const updateList = () => {
    fetchData();
  };

  return (
    <View style={styles.container}>
      <Text>Categorias</Text>
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
            placeholder="Nombre categoria"
          />
        )}
        defaultValue=""
      />
      <Text>CategoriasIconos</Text>
      <Dropdown data={iconCategories} sendDataToParent={changeIcons} />
      <Text>
        SubCategorias de los Iconos{" "}
        <Icon
          type="material-community"
          style={{ paddingLeft: 15 }}
          name={icon}
          size={20}
        />
      </Text>
      <Dropdown data={iconSubcategories} sendDataToParent={selectIcon} />
      <MyButton onPress={handleSubmit(onSubmit)} title="Guardar" />
      <FlatListItem data={categories} updateList={updateList} />
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
