import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Input } from "react-native-elements";
import { EditCategory, getCategory } from "../../services/categories";
import MyButton from "~/components/MyButton";
import { Errors } from "../../utils/Errors";
import ShowToast from "../../components/toast/ShowToast";
import MyLoading from "~/components/loading/MyLoading";
import ModalIcon from '../../components/modal/ModalIcon';

export default function EditCategoryScreen({ route }) {
  const idCategory = route.params.idCategory;

  const [category, setCategory] = useState([]);
  const { handleSubmit, control, errors, reset } = useForm({
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
      const editIcon = data.icon  ? data.icon : 'home';
      setIcon(editIcon)
      setCategory(data);
      reset(data);
    } catch (e) {
      Errors(e);
    }
  };

  const onSubmit = async (payload) => {
    try {
      setLoading(true);
      const sendPayload =  {...payload, icon}
      const { data } = await EditCategory(idCategory, sendPayload);
      setLoading(false);
      Keyboard.dismiss();
      ShowToast();
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const setIconHandle = (val) =>{
    setIcon(val)
  }

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
        render={({ onChange, value }) => (
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
         <ModalIcon icon={icon} setIcon={setIconHandle} />
      {/* <Controller
        name="icon"
        control={control}
        rules={{
          maxLength: {
            value: 200,
            message: "El icono no puede superar 200 caracteres",
          },
        }}
        render={({ onChange, value }) => (
          <Input
            label="Icono"
            value={value}
            placeholder="Nombre del icono en inglés"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.icon?.message}
          />
        )}
        defaultValue=""
      /> */}
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
