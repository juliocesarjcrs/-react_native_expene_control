import React, { useEffect, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import DropDownPicker from "react-native-dropdown-picker";
import { useForm, Controller } from "react-hook-form";
import { CheckBox, Input, Button, Icon,FAB } from "react-native-elements";

// Services
import {
  CreateExpense,
  getExpensesFromSubcategory,
} from "../../services/expenses";
import { getAllSubcategoriesExpensesByMonth } from "../../services/categories";
import {getExchangeCurrency} from '../../services/external';

// Components
import FlatListData from "../../components/card/FlatListData";
import ErrorText from "../../components/ErrorText";
import MyLoading from "~/components/loading/MyLoading";

// Types
import { RootState } from "~/shared/types/reducers";
import { ExpenseModel } from "~/shared/types";
import { CategoryExpensesFormat, FormExpensesValues, SubcategoryExpensesFormat } from "~/shared/types/screens/expenses/create-expenses.type";
import { CreateExpensePayload, GetExpensesFromSubcategoryResponse } from "~/shared/types/services/expense-service.type";
import { Subcategory } from "~/shared/types/services";

// Utils
import { Errors } from "../../utils/Errors";
import ShowToast from '../../utils/toastUtils';
import { NumberFormat, DateFormat } from "../../utils/Helpers";

// Styles
import { ICON_DROPDOWN, COLOR_SEPARATOR_DROPDOWN, COLOR_TEXT_DROPDOWN } from "~/styles/colors";
import { MEGA_BIG } from "~/styles/fonts";

export default function CreateExpenseScreen(): React.JSX.Element {
  const month  = useSelector((state: RootState) => state.date.month);
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
  const [categories, setCategories] = useState<CategoryExpensesFormat[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryExpensesFormat[]>([]);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [sumCost, setSumCost] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [loading, setLoading] = useState(false);
  const ITEM_HEIGHT = 42
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [idCategory, setIdCategory] = useState<number | null>(null);
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
  const [mode, setMode] = useState<"date" | "time">("date");
  const [show, setShow] = useState(false);
  // convertidor de moneda
  const [currencySymbol, setcurrencySymbol] = useState('COP');
  // const [checkboxes, setCheckboxes] = useState([
  //     {
  //         id: 1,
  //         title: "COP",
  //         checked: true,
  //         value: "COP",
  //     },
  //     {
  //         id: 2,
  //         title: "EUR",
  //         checked: false,
  //         value: "EUR",
  //     },
  //     {
  //         id: 3,
  //         title: "CHF",
  //         checked: false,
  //         value: "CHF",
  //     },
  // ]);
  // const toggleCheckbox = (id, index) => {
  //     let checkboxData = [...checkboxes];
  //     const oldValue = checkboxData[index].checked;
  //     checkboxData = checkboxData.map((e) => {
  //         return { ...e, checked: false };
  //     });
  //     checkboxData[index].checked = true;
  //     setCheckboxes(checkboxData);
  //     if (!oldValue) {
  //         const newvalue = checkboxData[index].value;
  //         setcurrencySymbol(newvalue);
  //     }
  // };

  const onChange = (_: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === "ios");
    const newDate = DateFormat(currentDate, "YYYY MMM DD");
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
      const { data } = await getAllSubcategoriesExpensesByMonth(month);
      setLoading(false);
      const filter = data.data.filter((f) => f.subcategories.length > 0);
      const dataFormat:CategoryExpensesFormat[] = filter.map((e) => {
        return { label: e.name, value: e.id, subcategories: e.subcategories,
          icon: ()=>  <Icon
            type="font-awesome"
            name={e.icon ? e.icon : "home"}
            size={35}
            color={ICON_DROPDOWN}
        />
         };
      });
      setCategories(dataFormat);
      defaultIdCategory(dataFormat);
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const defaultIdCategory = (categories: CategoryExpensesFormat[]) =>{
    if(categories.length > 0){
      setIdCategory(categories[0].value)
    }
  }

  const sendDataSubcategory = (index: number | null) => {
    console.log('[sendDataSubcategory] index', index);
    if (!index || index == NaN) {
      setExpenses([]);
      setSumCost(0);
    } else {
      fetchExpenses(index);
    }
  };
  const fetchExpenses = async (idSubcategory: number) => {
    const { data } = await getExpensesFromSubcategory(idSubcategory, month);
    setExpenses(data);
    calculateTotal(data);
  };
  const calculateTotal = (data: GetExpensesFromSubcategoryResponse) => {
    const total = data.reduce((acu: number, val: ExpenseModel) => {
      return acu + val.cost;
    }, 0);
    setSumCost(total);
  };
  const formatOptionsSubcategories = (data: Subcategory[]): SubcategoryExpensesFormat[]=> {
    return data.map((e) => {
      return { label: e.name, value: e.id };
    });
  };
  const onSubmit = async (payload: FormExpensesValues) => {
   

    let newAmount = null;
    if(currencySymbol !== 'COP'){
      try {
        const values = {
          "amount": payload.cost,
          "from": currencySymbol,
          "to": "COP"
        };
        const { data} = await getExchangeCurrency(values);
        newAmount = data.result;
        payload.cost = newAmount;
      } catch (error) {
        console.log('error---', error);
      }
    }
    try {
      if (!subcategoryId) {
        return;
      }
      const dataSend: CreateExpensePayload = {
        ...payload, cost: parseInt(payload.cost),
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
    if (!subcategoryId) {
      return;
    }
    fetchExpenses(subcategoryId);
  };


  const sendFromDropDownPickerCategory = (index: null | number) => {
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
          <Controller
              name="cost"
              control={control}
              rules={{
                  required: { value: true, message: "El gasto es obligatorio" },
                  min: { value: 1, message: "El minimó valor aceptado es 1" },
                  max: {
                      value: 99999999,
                      message:
                          "El gasto no puede superar el valor de 99.999.999 ",
                  },
              }}
              render={({ field: { onChange , value  } }) => (
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
                      message:
                          "El comenatario no puede superar los 200 carácteres ",
                  },
              }}
              render={({ field: { onChange , value  } }) => (
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
          <Text style={styles.subtitle}>Categoría</Text>
          <DropDownPicker
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
              ActivityIndicatorComponent={() => <MyLoading />}
              activityIndicatorColor="red"
              activityIndicatorSize={30}
              dropDownContainerStyle={{
                  backgroundColor: "#dfdfdf",
              }}
              listMode="MODAL"
              // styles modal
              itemSeparator={true}
              itemSeparatorStyle={{
                  backgroundColor: COLOR_SEPARATOR_DROPDOWN,
                  paddingVertical: 5,
              }}
              selectedItemContainerStyle={{
                  backgroundColor: "#F0AEBB",
              }}
              selectedItemLabelStyle={{
                  fontWeight: "bold",
              }}
              // como se ve el select
              textStyle={{
                  fontSize: 18,
                  color: COLOR_TEXT_DROPDOWN,
              }}
          />
          {!idCategory ? (
              <ErrorText msg="Necesita seleccionar una  Categoria" />
          ) : null}

          <Text style={styles.subtitle}>Subcategoría</Text>
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
              placeholderStyle={{
                  color: "grey",
              }}
              zIndex={1000}
              zIndexInverse={2000}
              loading={loading}
              listMode="MODAL"
              // styles modal
              itemSeparator={true}
              itemSeparatorStyle={{
                  backgroundColor: COLOR_SEPARATOR_DROPDOWN,
                  paddingVertical: 5,
              }}
              selectedItemContainerStyle={{
                  backgroundColor: "#F0AEBB",
              }}
              selectedItemLabelStyle={{
                  fontWeight: "bold",
              }}
              // como se ve el select
              textStyle={{
                  fontSize: MEGA_BIG,
                  color: COLOR_TEXT_DROPDOWN,
              }}
              // prueba
              dropDownContainerStyle={{
                  backgroundColor: "#dfdfdf",
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
          {/* <View style={styles.rows}>
              {checkboxes.map((cb, index) => {
                  return (
                      <CheckBox
                          center
                          key={cb.id}
                          title={cb.title}
                          iconType="material"
                          checkedIcon="check-box"
                          uncheckedIcon="check-box-outline-blank"
                          checked={cb.checked}
                          onPress={() => toggleCheckbox(cb.id, index)}
                          containerStyle={styles.containerCheckbox}
                      />
                  );
              })}
          </View> */}

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
              <FAB title="Guardar gasto" onPress={handleSubmit(onSubmit)} />
          )}

          <Text>Total:{NumberFormat(sumCost)}</Text>
          <FlatListData
              expenses={expenses}
              updateList={updateList}
          ></FlatListData>
      </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F5F7",
    margin: 8
  },
  containerDate: {
    display: "flex",
    flexDirection: "row",
    marginVertical:5
  },
  textDate: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: "white",
    backgroundColor: "#c5c5c5",
  },
  subtitle: {
    fontWeight: "bold"
  },
  rows: {
    backgroundColor: "#F3F5F7",
    flexDirection: 'row',

  },
  containerCheckbox: {
    paddingVertical: 2,
  }
});

