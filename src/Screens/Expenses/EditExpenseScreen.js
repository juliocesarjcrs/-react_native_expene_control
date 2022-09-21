import React, { useCallback, useEffect, useState } from "react";
import { Keyboard, StyleSheet, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { View } from "react-native";
import { getCategoryWithSubcategories } from "../../services/categories";
import { Input } from "react-native-elements";
import MyLoading from "~/components/loading/MyLoading";

import {
  editExpense,
  getExpensesFromSubcategory,
  getOneExpense,
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
import DropDownPicker from "react-native-dropdown-picker";

export default function EditExpenseScreen({ route, navigation }) {
  const idExpense = route.params.objectExpense.id;
  const objectExpense = route.params.objectExpense;
  const month = useSelector((state) => state.date.month);
  const [expenseEdit, setExpenseEdit] = useState({
    cost: objectExpense.cost.toString(),
    commentary: objectExpense.commentary,
  });
  const { handleSubmit, control, errors, reset } = useForm({
    defaultValues: expenseEdit,
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoryId, setSubcategoryId] = useState(null);
  const [sumCost, setSumCost] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const ITEM_HEIGHT = 42;
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [idCategory, setIdCategory] = useState(null);

  useEffect(() => {
    sendFromDropDownPickerCategory(idCategory);
  }, [idCategory]);
  useEffect(() => {
    sendDataSubcategory(subcategoryId);
  }, [subcategoryId]);

  //   DATE pIKER ---------------  ///////////////
  // 2021-08-03T14:30:25.523Z  sirve
  // 2021-06-22T00:00:00.000Z   falla
  // const splitDate =  objectExpense.date.split('-');
  // const yearNumber = parseInt(splitDate[0]);
  // const monthNumber = parseInt(splitDate[1]);
  // const dayNumber = parseInt(splitDate[2]);
  // let loadDate = new Date(Date.UTC(yearNumber, monthNumber, dayNumber));
  let loadDate = new Date(objectExpense.date);
  loadDate.setMinutes(loadDate.getMinutes() + loadDate.getTimezoneOffset());
  const [date, setDate] = useState(loadDate);
  const today = DateFormat(loadDate, "YYYY MMM DD");
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
    try {
      setLoading(true);
      const { data } = await getCategoryWithSubcategories(month);
      setLoading(false);
      const filter = data.data.filter((f) => f.subcategories.length > 0);
      const dataFormat = filter.map((e) => {
        return { label: e.name, value: e.id, subcategories: e.subcategories };
      });
      setCategories(dataFormat);

      await defaultIdCategory();
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const defaultIdCategory = async () => {
    const { data } = await getOneExpense(idExpense);
    setExpenseEdit({ cost: data.cost, commentary: data.commentary });
    const idCategoryEdit = data.subcategories.category.id;
    setIdCategory(idCategoryEdit);
    const idsubcategoryEdit = data.subcategories.id;
    setSubcategoryId(idsubcategoryEdit);
  };

  const sendDataSubcategory = (index) => {
    if (!index || index == NaN) {
      setExpenses([]);
      setSumCost(0);
    } else {
      // fetchExpenses(index);
    }
  };
  // const fetchExpenses = async (idSubcategory) => {
  //   const { data } = await getExpensesFromSubcategory(idSubcategory, month);
  //   setExpenses(data);
  //   calculateTotal(data);
  // };
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
      const { data } = await editExpense(idExpense, dataSend);
      setLoading(false);

      ShowToast();
      reset();
      Keyboard.dismiss();
      navigation.navigate("lastExpenses");
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };

  const sendFromDropDownPickerCategory = (index) => {
    setExpenses([]);
    // setSubcategoryId(null);
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

  return (
    <View style={styles.container}>
      <Controller
        name="cost"
        control={control}
        rules={{
          required: { value: true, message: "El gasto es obligatorio" },
          min: { value: 1, message: "El minimó valor aceptado es 1" },
          max: {
            value: 99999999,
            message: "El gasto no puede superar el valor de 99.999.999 ",
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
      <Text>Categoría</Text>
      <DropDownPicker
        // containerStyle={{ height: 40, marginBottom: 10 }}
        open={open}
        value={idCategory}
        items={categories}
        setOpen={setOpen}
        setValue={setIdCategory}
        setItems={setCategories}
        maxHeight={ITEM_HEIGHT * categories.length}
        placeholder="Selecione una categoría"
        zIndex={2000}
        zIndexInverse={1000}
        loading={loading}
        ActivityIndicatorComponent={({ color, size }) => (
          <MyLoading />
          // <ActivityIndicator color={color} size={size} />
        )}
        activityIndicatorColor="red"
        activityIndicatorSize={30}
        dropDownContainerStyle={{
          backgroundColor: "#dfdfdf",
        }}
        listMode="MODAL"
        // flatListProps={{
        //   initialNumToRender: 10
        // }}
        // listItemContainer={{
        //   height: 150,
        //   backgroundColor: '#F4C75B'
        // }}
        selectedItemContainerStyle={{
          backgroundColor: "#F0AEBB",
        }}
        itemSeparator={true}
        itemSeparatorStyle={{
          backgroundColor: "white",
        }}
        selectedItemLabelStyle={{
          fontWeight: "bold",
        }}
      />
      {!idCategory ? (
        <ErrorText msg="Necesita seleccionar una  Categoria" />
      ) : null}

      <Text>Subcategoría</Text>
      <DropDownPicker
        // containerStyle={{ height: 40, marginBottom: 10 }}
        open={open2}
        value={subcategoryId}
        items={subcategories}
        setOpen={setOpen2}
        setValue={setSubcategoryId}
        setItems={setSubcategories}
        maxHeight={ITEM_HEIGHT * subcategories.length}
        placeholder="Selecione una subcategoría"
        zIndex={1000}
        zIndexInverse={2000}
        loading={loading}
        listMode="MODAL"
        dropDownContainerStyle={{
          backgroundColor: "#dfdfdf",
        }}
        selectedItemContainerStyle={{
          backgroundColor: "#F0AEBB",
        }}
        itemSeparator={true}
        itemSeparatorStyle={{
          backgroundColor: "white",
        }}
        selectedItemLabelStyle={{
          fontWeight: "bold",
        }}
      />
      {!subcategoryId ? (
        <ErrorText msg="Necesita seleccionar una subcategoria" />
      ) : null}
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
          title="Editar"
          buttonStyle={{ backgroundColor: SECUNDARY }}
          onPress={handleSubmit(onSubmit)}
        />
      )}
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
