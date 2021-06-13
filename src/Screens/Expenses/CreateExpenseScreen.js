import React, { useCallback, useEffect, useState } from "react";
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
import DropDownPicker from "react-native-dropdown-picker";

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
  const ITEM_HEIGHT = 42
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
      defaultIdCategory(dataFormat);
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const defaultIdCategory = (categories) =>{
    if(categories.length > 0){
      setIdCategory(categories[0].value)
    }
  }

  const sendDataSubcategory = (index) => {
    if (!index || index == NaN) {
      setExpenses([]);
      setSumCost(0);
    } else {
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


  const sendFromDropDownPickerCategory = (index) => {
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

  return (
    <View style={styles.container}>
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
        ActivityIndicatorComponent={({color, size}) => (
          <MyLoading />
          // <ActivityIndicator color={color} size={size} />
        )}
        activityIndicatorColor="red"
        activityIndicatorSize={30}
        dropDownContainerStyle={{
          backgroundColor: "#dfdfdf"
        }}
        listMode="FLATLIST"
        flatListProps={{
          initialNumToRender: 10
        }}
        listItemContainer={{
          height: 150,
          backgroundColor: '#F4C75B'
        }}
        selectedItemContainerStyle={{
          backgroundColor: "#F0AEBB"
        }}
        itemSeparator={true}
        itemSeparatorStyle={{
          backgroundColor: "white"
        }}
        selectedItemLabelStyle={{
          fontWeight: "bold"
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
        dropDownContainerStyle={{
          backgroundColor: "#dfdfdf"
        }}
        selectedItemContainerStyle={{
          backgroundColor: "#F0AEBB"
        }}
        itemSeparator={true}
        itemSeparatorStyle={{
          backgroundColor: "white"
        }}
        selectedItemLabelStyle={{
          fontWeight: "bold"
        }}
    
      />
      {!subcategoryId ? <ErrorText msg="Necesita seleccionar una subcategoria" /> : null}
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

