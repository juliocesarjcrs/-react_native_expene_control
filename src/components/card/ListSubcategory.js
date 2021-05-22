import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PRIMARY } from "../../styles/colors";
import { MEDIUM, SMALL } from "../../styles/fonts";
import { NumberFormat } from "../../utils/Helpers";

const ListSubcategory = ({ item }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.item}>{NumberFormat(item.total)}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  header: {
    display: "flex",
    flexDirection: "row",
    // width: 300,
    backgroundColor: PRIMARY,
    padding: 5,
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "white",
    fontSize: MEDIUM,
    padding: 2,
  },
  item: {
    padding: 2,
    color: "white",
    fontSize: SMALL,
  },
});
export default ListSubcategory;
