import React, { useEffect, useState } from "react";
import { Keyboard, Text, ToastAndroid } from "react-native";
import { useForm, Controller } from "react-hook-form";
import RNPickerSelect from "react-native-picker-select";
import { View } from "react-native";
import { getCategoryWithSubcategories } from "../../services/categories";
import Input from "../../components/Input";
import {
  CreateExpense,
  getExpensesFromSubcategory,
} from "../../services/expenses";
import MyButton from "../../components/MyButton";
import { NumberFormat } from "../../utils/Helpers";
import { Errors } from "../../utils/Errors";
import FlatListData from "../../components/card/FlatListData";
import ErrorText from '../../components/ErrorText';
import MyLabel from '../../components/MyLabel';

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

export default function CreateExpenseScreen() {
  const { handleSubmit, control, errors, reset } = useForm({
    defaultValues: { cost: "0", commentary: null },
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoryId, setSubcategoryId] = useState(null);
  const [sumCost, setSumCost] = useState(0);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    const { data } = await getCategoryWithSubcategories();
    const dataFormat = data.data.map((e) => {
      return { label: e.name, value: e.id, subcategories: e.subcategories };
    });
    setCategories(dataFormat);
  };
  const sendFromSelectCategory = (index) => {
    setExpenses([]);
    setSubcategoryId(null);
    setSumCost(0);
    const indexArray = categories.findIndex((e) => {
      return e.value === index;
    });
    console.log('sendFromSelectCategory', index, indexArray);
    if (indexArray >= 0) {
      const dataFormat = formatOptionsSubcategories(
        categories[indexArray].subcategories
      );
    console.log('dataFormat', dataFormat.length);
      setSubcategories(dataFormat);
    }
  };
  const sendDataSubcategory = (index) => {
    console.log('sendDataSubcategory', index);

    if (!index || index == NaN) {
      console.log('sendDataSubcategory-3--', index);
      setExpenses([]);
      setSubcategoryId(null);
      setSumCost(0);
      // return;
    }else{
      console.log('else', index);
      setSubcategoryId(index);
      fetchExpenses(index);

    }
  };
  const fetchExpenses = async (idSubcategory) => {
    const { data } = await getExpensesFromSubcategory(idSubcategory);
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
      const dataSend = { ...payload, subcategoryId };
      const { data } = await CreateExpense(dataSend);
      const newExpense = [data, ...expenses];
      setExpenses(newExpense);
      calculateTotal(newExpense);
      // showToast()
      reset();
      Keyboard.dismiss();
    } catch (error) {
      Errors(error);
    }
  };
  const showToast = () => {
    ToastAndroid.show("A pikachu appeared nearby !", ToastAndroid.SHORT);
  };
  const updateList = () => {
    fetchExpenses(subcategoryId);
  };

  return (
    <View>
      <Text>Categoria</Text>
      <DropdownIn data={categories} sendDataToParent={sendFromSelectCategory} />
      <Text>Subcategoria</Text>
      {/* <DropdownIn data={subcategories} sendDataToParent={sendDataSubcategory} /> */}
      { subcategories.length >0 ? <DropdownIn data={subcategories} sendDataToParent={sendDataSubcategory} />: null}
      {!subcategoryId?<ErrorText msg="Necesita una  subcategoria"/>: null} 
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
            error={errors.cost}
            errorText={errors?.cost?.message}
            onChangeText={(text) => onChange(text)}
            value={value}
            placeholder="Ej: 20.000"
            keyboardType="numeric"
          />
        )}
        defaultValue=""
        />
        <MyLabel data="Comentario"></MyLabel>
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
            error={errors.commentary}
            errorText={errors?.commentary?.message}
            onChangeText={(text) => onChange(text)}
            value={value}
            placeholder="Ej:  Compra de una camisa"
            multiline
            numberOfLines={4}
          />
        )}
        defaultValue=""
      />
      <MyButton title="Guardar" onPress={handleSubmit(onSubmit)}></MyButton>
      <Text>Total:{NumberFormat(sumCost)}</Text>
      <FlatListData expenses={expenses} updateList={updateList}></FlatListData>
    </View>
  );
}
