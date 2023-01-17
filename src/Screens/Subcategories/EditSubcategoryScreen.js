import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Input } from "react-native-elements";
import { EditSubcategory } from "../../services/subcategories";
import MyButton from "~/components/MyButton";
import { MEDIUM } from "../../styles/fonts";

import { Keyboard } from "react-native";

import MyLoading from "~/components/loading/MyLoading";
import { Errors } from "../../utils/Errors";
import ShowToast from '../../components/toast/ShowToast';

export default function EditSubcategoryScreen({ route, navigation }) {
  const subcategoryObj = route.params.subcategoryObj;
  const {
    handleSubmit,
    control,
    reset,

    formState: {
      errors,
    },
  } = useForm({
    defaultValues: { name: subcategoryObj.name },
  });
  const [loading, setLoading] = useState(false);

  const editApi = async (payload) => {
    try {
      setLoading(true);
      const { data } = await EditSubcategory(subcategoryObj.id, {
        ...payload,
        categoryId: subcategoryObj.categoryId.id,
      });
      setLoading(false);
      ShowToast();
      Keyboard.dismiss();
      reset();
      navigation.navigate("createSubcategory");
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
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
        <MyButton onPress={handleSubmit(editApi)} title="Editar" />
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
  item: {
    padding: 10,
    fontSize: MEDIUM,
    height: 44,
  },
});
