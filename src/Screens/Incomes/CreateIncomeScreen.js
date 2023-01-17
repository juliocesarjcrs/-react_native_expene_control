import React, { useEffect, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import RNPickerSelect from "react-native-picker-select";
import { getCategoryTypeIncome } from "../../services/categories";
import { Input, Button, Icon  } from "react-native-elements";
import MyLoading from "~/components/loading/MyLoading";

import { DateFormat } from "../../utils/Helpers";
import { Errors } from "../../utils/Errors";
import ErrorText from "../../components/ErrorText";
import ShowToast from "../../components/toast/ShowToast";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import {SECUNDARY} from '../../styles/colors';
import {CreateIncome} from '../../services/incomes';



export default function CreateIncomeScreen({navigation}) {
  const month = useSelector((state) => state.date.month);
  const {
    handleSubmit,
    control,
    reset,

    formState: {
      errors,
    },
  } = useForm({
    defaultValues: { cost: "", commentary: "" },
  });
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [sumCost, setSumCost] = useState(0);
  const [loading, setLoading] = useState(false);

  //   DATE pIKER ---------------  ///////////////

  const [date, setDate] = useState(new Date());
  const today = DateFormat(new Date(), "YYYY MMM DD");
  const [dateString, setDateString] = useState(today);
  const [mode, setMode] = useState("date");
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;

    setShow(Platform.OS === "ios");
    let newDate = DateFormat(currentDate, "YYYY MMM DD");
    setDateString(newDate);
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode("date");
  };

  //////////////////////////////////////////////

  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    const { data } = await getCategoryTypeIncome(month);

    const dataFormat = data.data.map((e) => {
      return { label: e.name, value: e.id };
    });
    setCategories(dataFormat);
  };
  const sendFromSelectCategory = (index) => {
    setCategoryId(index);
    setSumCost(0);
  };

  const onSubmit = async (payload) => {
    try {
      if (!categoryId) {
        return;
      }
      const dataSend = {
        ...payload,
        categoryId,
        date: DateFormat(date, "YYYY-MM-DD"),
      };
      setLoading(true);
      const { data } = await CreateIncome(dataSend);
      setLoading(false);
      ShowToast();
      reset();
      Keyboard.dismiss();
      navigation.navigate("sumaryIncomes");
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  return (
    <View style={styles.container}>
      <Text>Categoria</Text>
      <RNPickerSelect
        useNativeAndroidPickerStyle={false}
        placeholder={{}}
        onValueChange={(value) => sendFromSelectCategory(parseInt(value))}
        items={categories}
      />
      {!categoryId ? <ErrorText msg="Necesita una categoria de ingresos" /> : null}
      <Controller
            name="amount"
            control={control}
            rules={{
              required: { value: true, message: "El costo es obligatorio" },
              min: { value: 1, message: "El minimó valor aceptado es 1" },
              max: {
                value: 99999999,
                message: "El costo no puede superar el valor de 99.999.999 ",
              },
            }}
            render={({ field: { onChange , value  } }) => (
              <Input
                label="Ingreso"
                value={value}
                placeholder="Ej: 20000"
                onChangeText={(text) => onChange(text)}
                errorStyle={{ color: "red" }}
                errorMessage={errors?.amount?.message}
                keyboardType="numeric"
              />
            )}
            defaultValue=""
          />
      <Controller
        name="commentary"
        control={control}
        rules={{
          maxLength: {
            value: 200,
            message: "El comenatario no puede superar los 200 carácteres ",
          },
        }}
        render={({ field: { onChange , value  } }) => (
          <Input
            label="Comentario"
            value={value}
            placeholder="Ej: Nómina, quincena"
            onChangeText={(text) => onChange(text)}
            multiline
            numberOfLines={2}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.commentary?.message}
          />
        )}
        defaultValue=""
      />
                       <View style={styles.containerDate}>
          <Button
            icon={
              <Icon
                type="font-awesome"
                name="calendar"
                size={25}
                color="white"
              />
            }
            iconLeft
            title="  Fecha "
            onPress={showDatepicker}
          />
          <Text style={styles.textDate}>{dateString}</Text>
        </View>

      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
         {loading ? (
        <MyLoading />
      ) : (
        <Button title="Guardar" buttonStyle={{backgroundColor: SECUNDARY}} onPress={handleSubmit(onSubmit)}/>
      )}

    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  containerDate: {
    display: "flex",
    flexDirection: "row"
  },
  textDate: {
    paddingVertical: 10,
    paddingHorizontal:10,
    color: "white",
    backgroundColor: "#c5c5c5"
  },
});

