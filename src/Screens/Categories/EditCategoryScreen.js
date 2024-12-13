import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Input } from "react-native-elements";
import { EditCategory, getCategory } from "../../services/categories";
import MyButton from "~/components/MyButton";
import { Errors } from "../../utils/Errors";
import ShowToast from '../../utils/toastUtils';
import MyLoading from "~/components/loading/MyLoading";
import ModalIcon from "../../components/modal/ModalIcon";

export default function EditCategoryScreen({ route }) {
  const idCategory = route.params.idCategory;

  const [category, setCategory] = useState([]);
  const {
    handleSubmit,
    control,
    reset,

    formState: {
      errors,
    },
  } = useForm({
    defaultValues: category,
  });
  const [icon, setIcon] = useState("home");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [reset]);

  const fetchData = async () => {
    try {
      const { data } = await getCategory(idCategory);
      let dataTransfor = {...data,  budget: data.budget.toString()};
      const editIcon = data.icon ? data.icon : "home";
      setIcon(editIcon);
      setCategory(dataTransfor);
      reset(dataTransfor);
    } catch (e) {
      Errors(e);
    }
  };

  const onSubmit = async (payload) => {
    try {
      setLoading(true);
      const sendPayload = { ...payload, icon };
      const { data } = await EditCategory(idCategory, sendPayload);
      setLoading(false);
      Keyboard.dismiss();
      ShowToast();
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const setIconHandle = (val) => {
    setIcon(val);
  };

  return (
    <View style={styles.container}>
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
        render={({ field: { onChange , value  } }) => (
          <Input
            label="Categoria"
            value={value}
            placeholder="Nombre de la categoria"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.name?.message}
          />
        )}
        defaultValue=""
      />
        <Controller
        name="budget"
        control={control}
        rules={{
          min: { value: 0, message: "El minimó valor aceptado es 1" },
          max: {
            value: 99999999,
            message: "El presupuesto no puede superar el valor de 99.999.999 ",
          },
        }}
        render={({ field: { onChange , value  } }) => (
          <Input
            label="Presupuesto"
            value={value}
            placeholder="Ej: 200000"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.budget?.message}
            keyboardType="numeric"
          />
        )}
        defaultValue=""
      />
      <ModalIcon icon={icon} setIcon={setIconHandle} />
      {loading ? (
        <MyLoading />
      ) : (
        <MyButton onPress={handleSubmit(onSubmit)} title="Editar" />
      )}
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
