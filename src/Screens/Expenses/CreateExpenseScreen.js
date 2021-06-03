import React, { useEffect, useState } from "react";
import { Keyboard, StyleSheet, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import RNPickerSelect from "react-native-picker-select";
import { View } from "react-native";
import { getCategoryWithSubcategories } from "../../services/categories";
import { Input } from "react-native-elements";
import MyLoading from "~/components/loading/MyLoading";

import {
  CreateExpense,
  getExpensesFromSubcategory,
} from "../../services/expenses";
import { NumberFormat, DateFormat } from "../../utils/Helpers";
import { Errors } from "../../utils/Errors";
import FlatListData from "../../components/card/FlatListData";
import ErrorText from "../../components/ErrorText";
import ShowToast from "../../components/toast/ShowToast";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, Icon } from "react-native-elements";
import { useSelector } from "react-redux";
import { SECUNDARY } from "../../styles/colors";

export default function CreateExpenseScreen() {
  const month = useSelector((state) => state.date.month);
  const { handleSubmit, control, errors, reset } = useForm({
    defaultValues: { cost: "", commentary: "" },
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoryId, setSubcategoryId] = useState(null);
  const [sumCost, setSumCost] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  //   DATE pIKER ---------------  ///////////////

  const [date, setDate] = useState(new Date());
  const today = DateFormat(new Date(), "YYYY MMM DD");
  const [dateString, setDateString] = useState(today);
  const [mode, setMode] = useState("date");
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    // console.log('onChange', selectedDate, date);
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

  const showTimepicker = () => {
    showMode("time");
  };
  //////////////////////////////////////////////

  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await getCategoryWithSubcategories(month);
      setLoading(false);
      const filter = data.data.filter((f) => f.subcategories.length > 0);
      const dataFormat = filter.map((e) => {
        return { label: e.name, value: e.id, subcategories: e.subcategories };
      });
      setCategories(dataFormat);
    } catch (error){
      setLoading(false);
      Errors(error);
    }
  };
  const sendFromSelectCategory = (index) => {
    setExpenses([]);
    setSubcategoryId(null);
    setSumCost(0);
    const indexArray = categories.findIndex((e) => {
      return e.value === index;
    });
    if (indexArray >= 0) {
      const dataFormat = formatOptionsSubcategories(
        categories[indexArray].subcategories
      );
      setSubcategories(dataFormat);
    }
  };
  const sendDataSubcategory = (index) => {
    if (!index || index == NaN) {
      setExpenses([]);
      setSubcategoryId(null);
      setSumCost(0);
    } else {
      setSubcategoryId(index);
      fetchExpenses(index);
    }
  };
  const fetchExpenses = async (idSubcategory) => {
    const { data } = await getExpensesFromSubcategory(idSubcategory, month);
    setExpenses(data);
    calculateTotal(data);
  };
  const calculateTotal = (data) => {
    const total = data.reduce((acu, val) => {
      return acu + parseFloat(val.cost);
    }, 0);
    setSumCost(total);
  };
  const formatOptionsSubcategories = (data) => {
    return data.map((e) => {
      return { label: e.name, value: e.id };
    });
  };
  const onSubmit = async (payload) => {
    try {
      if (!subcategoryId) {
        return;
      }
      const dataSend = {
        ...payload,
        subcategoryId,
        date: DateFormat(date, "YYYY-MM-DD"),
      };
      setLoading(true);
      const { data } = await CreateExpense(dataSend);
      setLoading(false);
      const newExpense = [data, ...expenses];
      setExpenses(newExpense);
      calculateTotal(newExpense);
      ShowToast();
      reset();
      Keyboard.dismiss();
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const updateList = () => {
    fetchExpenses(subcategoryId);
  };
  return (
    <View style={styles.container}>
      <Text>Categoría</Text>
      {loading ? (
        <MyLoading />
      ) : (
        <DropdownIn data={categories} sendDataToParent={sendFromSelectCategory} />
      )
}
      <Text>Subcategoría</Text>
      <DropdownIn data={subcategories} sendDataToParent={sendDataSubcategory} />
      {!subcategoryId ? <ErrorText msg="Necesita una  subcategoria" /> : null}
      <Controller
        name="cost"
        control={control}
        rules={{
          required: { value: true, message: "El costo es obligatorio" },
          min: { value: 1, message: "El minimó valor aceptado es 1" },
          max: {
            value: 99999999,
            message: "El costo no puede superar el valor de 99.999.999 ",
          },
        }}
        render={({ onChange, value }) => (
          <Input
            label="Gasto"
            value={value}
            placeholder="Ej: 20000"
            onChangeText={(text) => onChange(text)}
            errorStyle={{ color: "red" }}
            errorMessage={errors?.cost?.message}
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
        render={({ onChange, value }) => (
          <Input
            label="Comentario"
            value={value}
            placeholder="Ej: Compra de una camisa"
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
              type="material-community"
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
        <Button
          title="Guardar"
          buttonStyle={{ backgroundColor: SECUNDARY }}
          onPress={handleSubmit(onSubmit)}
        />
      )}

      <Text>Total:{NumberFormat(sumCost)}</Text>
      <FlatListData expenses={expenses} updateList={updateList}></FlatListData>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDate: {
    display: "flex",
    flexDirection: "row",
  },
  textDate: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: "white",
    backgroundColor: "#c5c5c5",
  },
});
const DropdownIn = ({ data, sendDataToParent }) => {
  return (
    <RNPickerSelect
      useNativeAndroidPickerStyle={false}
      placeholder={{}}
      onValueChange={(value) => sendDataToParent(parseInt(value))}
      items={data}
    />
  );
};
