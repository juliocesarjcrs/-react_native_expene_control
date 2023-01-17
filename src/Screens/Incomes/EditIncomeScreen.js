import React, { useEffect, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { getCategoryTypeIncome } from "../../services/categories";
import { Input, Button, Icon } from "react-native-elements";
import MyLoading from "~/components/loading/MyLoading";
import { DateFormat } from "../../utils/Helpers";
import { Errors } from "../../utils/Errors";
import ErrorText from "../../components/ErrorText";
import ShowToast from "../../components/toast/ShowToast";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import {SECUNDARY} from '../../styles/colors';
import {editIncome} from '../../services/incomes';
import DropDownPicker from "react-native-dropdown-picker";


export default function EditIncomeScreen({navigation, route}) {
  const ITEM_HEIGHT = 42;
  const idIncome = route.params.objectIncome.id;
  const objectIncome = route.params.objectIncome;
  console.log('objectIncome', objectIncome);

  const month = useSelector((state) => state.date.month);
  const [incomeEdit, setIncomeEdit] = useState({
    amount: objectIncome.cost.toString(),
    commentary: objectIncome.commentary,
  });
  const {
    handleSubmit,
    control,
    reset,

    formState: {
      errors,
    },
  } = useForm({
    defaultValues: incomeEdit,
  });

  const [categories, setCategories] = useState([]);
  const [sumCost, setSumCost] = useState(0);
  const [loading, setLoading] = useState(false);
  // rpdawn
  const [open, setOpen] = useState(false);
  const [idCategory, setIdCategory] = useState(null);

  //   DATE pIKER ---------------  ///////////////
  let loadDate = new Date(objectIncome.date);
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
    const { data } = await getCategoryTypeIncome(month);

    const dataFormat = data.data.map((e) => {
      return { label: e.name, value: e.id };
    });
    setCategories(dataFormat);
    const idCategoryEdit = objectIncome.idCategory;
    setIdCategory(idCategoryEdit);
  };


  const onSubmit = async (payload) => {
    try {
      if (!idCategory) {
        return;
      }
      const dataSend = {
        ...payload,
        categoryId: idCategory,
        date: DateFormat(date, "YYYY-MM-DD"),
      };
      setLoading(true);
      const { data } = await editIncome(idIncome, dataSend);
      setLoading(false);
      ShowToast();
      reset();
      Keyboard.dismiss();
      navigation.navigate("lastIncomes");
      // navigation.navigate("lastIncomes",{ data });
    } catch (error) {
      setLoading(false);
      Errors(error);
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
        ActivityIndicatorComponent={({ color, size }) => (
          <MyLoading />
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
        <ErrorText msg="Necesita seleccionar una  categoria de ingresos" />
      ) : null}
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

