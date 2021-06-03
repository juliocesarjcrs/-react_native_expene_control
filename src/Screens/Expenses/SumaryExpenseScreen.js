import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getCategoryWithSubcategories } from "../../services/categories";
import { Errors } from "../../utils/Errors";
import { NumberFormat } from "../../utils/Helpers";
import { BIG } from "../../styles/fonts";
import MyAcordeon from "./components/MyAcordeon";
import MyButton from "~/components/MyButton";
import { useSelector } from "react-redux";
import MyLoading from "~/components/loading/MyLoading";

export default function SumaryExpenseScreen({ navigation }) {
  const month = useSelector((state) => state.date.month);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
  }, []);
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await getCategoryWithSubcategories(month);
      setLoading(false);
      const mapping = data.data.map((element) => {
        return { ...element, data: element.subcategories };
      });
      setCategories(mapping);
      setTotal(data.total);
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const sendEditCategoryScreen = (id) => {
    navigation.navigate("editCategory", { idCategory: id });
  };
  const sendCreateCategoryScreen = (id) => {
    navigation.navigate("createSubcategory", { idCategory: id });
  };
  const sendCategoryScreen = () => {
    navigation.navigate("createCategory");
  };

  const sendcreateExpenseScreen = () => {
    navigation.navigate("createExpense");
  };

  return (
    <View style={styles.container}>
      <View style={styles.fixToText}>
        <MyButton onPress={sendcreateExpenseScreen} title="ingresar gasto" />
        <MyButton onPress={sendCategoryScreen} title="Crear Categoria" />
      </View>
      <Text
        style={{
          fontSize: BIG,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        Total gastos: {NumberFormat(total)}
      </Text>
      {loading ? (
        <MyLoading />
      ) : (
        <ScrollView>
          {categories.map((e, idx) => (
            <MyAcordeon
              key={e.id}
              data={e}
              editCategory={sendEditCategoryScreen}
              createSubcategory={sendCreateCategoryScreen}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
