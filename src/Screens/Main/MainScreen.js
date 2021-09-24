import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MyPieChart from "../../components/charts/MyPieChart";
import MyButton from "~/components/MyButton";
import { getCategoryWithSubcategories } from "../../services/categories";
import { AsignColor, NumberFormat } from "../../utils/Helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { setAuthAction } from "~/actions/authActions";
import MyMonthPicker from "../../components/datePicker/MyMonthPicker";
import { useSelector } from "react-redux";
import { MUTED, SECUNDARY } from "../../styles/colors";
import { Button } from "react-native-elements";
import { BIG } from "../../styles/fonts";
import { Errors } from "../../utils/Errors";
import MyLoading from "~/components/loading/MyLoading";
import MyFaButton from "../../components/buttons/MyFaButton";
import CardLastExpenses from "./components/CardLastExpenses";

export default function MainScreen({ navigation }) {
  const month = useSelector((state) => state.date.month);
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, [month]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await getCategoryWithSubcategories(month);
      setLoading(false);
      setTotal(data.total);
      const dataFormat = data.data.map((e, idx) => {
        return {
          name: cutName(e.name),
          population: e.total,
          color: AsignColor(idx),
          legendFontColor: "#7F7F7F",
          legendFontSize: 15,
        };
      });
      setCategories(dataFormat);
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const cutName = (name) => {
    return name.length < 12 ? name : name.slice(0, 10) + "...";
  };
  const sendcreateExpenseScreen = () => {
    navigation.navigate("createExpense");
  };
  const sendDetailsExpenseScreen = () => {
    navigation.navigate("sumary");
  };
  const LogOut = async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("user");
    dispatch(setAuthAction(false));
  };
  return (
    <View style={styles.container}>
      <ScrollView>
        <MyMonthPicker />
        <View style={styles.fixToText}>
          <MyButton onPress={sendcreateExpenseScreen} title="Ingresar gasto" />
          <MyButton onPress={LogOut} title="Cerrar sesión" />
        </View>
        <Button
          title="Detallar gastos"
          buttonStyle={{ backgroundColor: SECUNDARY }}
          onPress={sendDetailsExpenseScreen}
        />
        <Text style={styles.text}>Total: {NumberFormat(total)}</Text>
        {loading ? (
          <MyLoading />
        ) : total > 0 ? (
          <MyPieChart data={categories} />
        ) : (
          <Text style={styles.textMuted}>
            No se registran gastos en este mes
          </Text>
        )}
        <CardLastExpenses navigation={navigation} />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  text: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: BIG,
    marginTop: 5,
  },
  textMuted: {
    textAlign: "center",
    color: MUTED,
  },
});
