import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MyPieChart from "../../components/charts/MyPieChart";
import MyButton from "~/components/MyButton";
import { getCategoryWithSubcategories } from "../../services/categories";
import { AsignColor } from "../../utils/Helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { setAuthAction } from "~/actions/authActions";

export default function MainScreen({ navigation }) {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
  }, []);
  const fetchData = async () => {
    const { data } = await getCategoryWithSubcategories();
    const dataFormat = data.data.map((e, idx) => {
      return {
        name: e.name,
        population: e.total,
        color: AsignColor(idx),
        legendFontColor: "#7F7F7F",
        legendFontSize: 15,
      };
    });
    setCategories(dataFormat);
  };
  const sendcreateExpenseScreen = () => {
    navigation.navigate("createExpense");
  };
  const sendDetailsExpenseScreen = () => {
    navigation.navigate("subcategoriesList");
  };
  const LogOut = async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("user");
    dispatch(setAuthAction(false));
  };
  return (
    <View>
      <View style={styles.fixToText}>
        <MyButton onPress={sendcreateExpenseScreen} title="Ingresar gasto" />
        <MyButton onPress={LogOut} title="Cerrar sesión" />
      </View>
      <MyPieChart data={categories} />
      <MyButton onPress={sendDetailsExpenseScreen} title="Detallar gastos" />
    </View>
  );
}
const styles = StyleSheet.create({
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
