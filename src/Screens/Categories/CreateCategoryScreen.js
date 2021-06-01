import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { CreateCategory, getCategories } from "../../services/categories";
import MyButton from "~/components/MyButton";
import FlatListItem from "./components/FlatListItem";

import { Keyboard } from "react-native";
import { Errors } from "../../utils/Errors";
import { Input } from "react-native-elements";
import MyLoading from "~/components/loading/MyLoading";
import ShowToast from "../../components/toast/ShowToast";
import { RadioButton } from "react-native-paper";

import ModalIcon from '../../components/modal/ModalIcon';

export default function CreateCategoryScreen({ navigation }) {
  const [icon, setIcon] = useState("home");
  const [categories, setCategories] = useState([]);
  const { handleSubmit, control, errors, reset } = useForm({
    defaultValues: { name: "" },
  });
  const [loading, setLoading] = useState(false);
  const [type, setType] = React.useState(0);

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      const params = {
        type,
      };
      const { data } = await getCategories(params);
      setCategories(data);
    } catch (error) {
      Errors(error);
    }
  };

  const onSubmit = async (payload) => {
    try {
      const dataTransform = { ...payload, icon, type };
      setLoading(true);
      const { data } = await CreateCategory(dataTransform);
      setLoading(false);
      const newCategories = [...categories, data];
      setCategories(newCategories);
      reset();
      Keyboard.dismiss();
      ShowToast();
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const updateList = () => {
    fetchData();
  };


  const setIconHandle = (val) =>{
    setIcon(val)
  }

  return (
    <View style={styles.container}>
      <RadioButton.Group
        onValueChange={(newValue) => setType(newValue)}
        value={type}
      >
        <View>
          <Text>Tipo Gasto</Text>
          <RadioButton value={0} />
        </View>
        <View>
          <Text>Tipo Ingreso</Text>
          <RadioButton value={1} />
        </View>
      </RadioButton.Group>
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
            label="Categoria"
            value={value}
            placeholder="Ej: Vivienda"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.name?.message}
          />
        )}
        defaultValue=""
      />
      <ModalIcon icon={icon} setIcon={setIconHandle} />
      {loading ? (
        <MyLoading />
      ) : (
        <MyButton onPress={handleSubmit(onSubmit)} title="Guardar" />
      )}
      <FlatListItem data={categories} updateList={updateList} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});
