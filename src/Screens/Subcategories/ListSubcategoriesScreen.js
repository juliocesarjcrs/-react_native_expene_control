import React, { useEffect, useState } from "react";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { getCategoryWithSubcategories } from "../../services/categories";
import { Icon } from "react-native-elements";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "~/styles";
import MyButton from "~/components/MyButton";
import ListSubcategory from "../../components/card/ListSubcategory";
import { MEDIUM } from "../../styles/fonts";
import { NumberFormat } from "../../utils/Helpers";
import { Errors } from "../../utils/Errors";
import { ICON } from "../../styles/colors";

export default function ListSubcategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("Screen is focused");
      fetchData();
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await getCategoryWithSubcategories();
      const mapping = data.data.map((element) => {
        return { ...element, data: element.subcategories };
      });
      setCategories(mapping);
      setTotal(data.total);
    } catch (e) {
      Errors(e);
    }
  };
  const sendCreateCategoryScreen = (id) => {
    navigation.navigate("createSubcategory", { idCategory: id });
  };

  const sendCategoryScreen = () => {
    navigation.navigate("createCategory");
  };
  const sendEditCategoryScreen = (id) => {
    navigation.navigate("editCategory", { idCategory: id });
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
      <Text>Total gastos: {NumberFormat(total)}</Text>
        <SectionList
          sections={categories}
          keyExtractor={(item, index) => item + index}
          renderItem={({ item }) => <ListSubcategory item={item} />}
          renderSectionHeader={({ section: { name, id, icon, total } }) => (
            <View style={styles.header}>
              <Icon
                type="material-community"
                style={styles.containerIcon}
                name={icon ? icon : "home"}
                size={20}
                color={ICON}
              />
              <View style={styles.containerRow}>
                <Text style={styles.title}>{name}</Text>
                <Text style={styles.title}>{NumberFormat(total)}</Text>
              </View>
              <View>
                <Icon
                  type="material-community"
                  style={{ paddingLeft: 15 }}
                  name={"pencil-outline"}
                  size={20}
                  color={ICON}
                  onPress={() => sendEditCategoryScreen(id)}
                />
                <Icon
                  type="material-community"
                  style={{ paddingLeft: 15 }}
                  name={"plus-circle"}
                  size={20}
                  color={ICON}
                  onPress={() => sendCreateCategoryScreen(id)}
                />
              </View>
            </View>
          )}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-around",
  },
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: 300,
    backgroundColor: Colors.PRIMARY_BLACK,
    paddingVertical: 5,
  },
  title: {
    fontSize: MEDIUM,
    color: "white",
    padding: 2,
  },
  containerRow: {
    display: "flex",
    alignItems: "center",
    marginRight: 5,
  },
  containerIcon: {
    marginTop: 10,
    marginLeft: 5,
    // backgroundColor: "white",
    display: "flex",
    alignItems: "center",
  },
});
