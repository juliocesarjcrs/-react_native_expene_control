
import React, { useCallback, useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import CardCategories from "~/Screens/Categories/components/CardCategories";
import { getCategoryWithSubcategories } from "../../services/categories";

import {
  CreateExpense,
  getExpensesFromSubcategory,
} from "../../services/expenses";
import { NumberFormat, DateFormat } from "../../utils/Helpers";
import { Errors } from "../../utils/Errors";
import { useSelector } from "react-redux";

const JustifyContentBasics = () => {
  const [justifyContent, setJustifyContent] = useState("flex-start");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoryId, setSubcategoryId] = useState(null);
  const [sumCost, setSumCost] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [idCategory, setIdCategory] = useState(null);
  const month = useSelector((state) => state.date.month);
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
        return { label: e.name, value: e.id, subcategories: e.subcategories, icon: e.icon };
      });
      // console.log('ataform',dataFormat);
      setCategories(dataFormat);
      defaultIdCategory(dataFormat);
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };

  return (
    <PreviewLayout
      label="justifyContent"
      selectedValue={idCategory}
      // values={[
      //   "flex-start",
      //   "flex-end",
      //   "center",
      //   "space-between",
      //   "space-around",
      //   "space-evenly",
      // ]}
      values={categories}
      setIdCategory={setIdCategory}
    >
      {/* <View
        style={[styles.box, { backgroundColor: "powderblue" }]}
      />
      <View
        style={[styles.box, { backgroundColor: "skyblue" }]}
      />
      <View
        style={[styles.box, { backgroundColor: "steelblue" }]}
      /> */}
    </PreviewLayout>
  );
};

const PreviewLayout = ({ values, selectedValue, setIdCategory }) => (
    <View
        style={{
            padding: 10,
            flex: 1,
            justifyContent: "space-between",
            backgroundColor: "beige",
        }}
    >
        <View style={styles.row}>
            {values.map((value) => (
                <TouchableOpacity
                    key={value.value}
                    onPress={() => setIdCategory(value.value)}
                    style={[
                        styles.button,
                        selectedValue === value.value && styles.selected,
                    ]}
                >
                    <CardCategories key={value.value} item={value} />
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({

  row: {
    // flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#f9c2ff",
    // height: 230
  },
  button: {
    // paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "oldlace",
    alignSelf: "flex-start",
    marginHorizontal: "1%",
    // marginBottom: 6,
    // minWidth: "48%",
    textAlign: "center",
  },
  selected: {
    backgroundColor: "coral",
    borderWidth: 0,
  },
});

export default JustifyContentBasics;