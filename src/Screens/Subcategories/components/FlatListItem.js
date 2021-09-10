import React from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Icon } from "react-native-elements";
import { MEDIUM } from "~/styles/fonts";
import { PRIMARY, ICON } from "~/styles/colors";
import { Errors } from "../../../utils/Errors";
import { deleteSubategory } from "../../../services/subcategories";

const FlatListItem = ({ data, updateList, navigation }) => {
  const listItem = ({ item }) => {
    const deleteItem = async (idExpense) => {
      try {
        const { data } = await deleteSubategory(idExpense);
        updateList();
      } catch (e) {
        Errors(e);
      }
    };
    const sendEditSubcategoryScreen = (subcategoryObj) => {
      navigation.navigate("editSubcategory", { subcategoryObj });
    };

    const createTwoButtonAlert = (id) =>
      Alert.alert("Eliminar", "¿Desea eliminar esta Subcategoria?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        { text: "OK", onPress: () => deleteItem(id) },
      ]);
    return (
      <View style={styles.header}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={{ display: "flex", flexDirection: "row" }}>
          <View style={{ paddingRight: 15 }}>
            <Icon
              type="material-community"
              name="trash-can"
              size={20}
              color={ICON}
              onPress={() => createTwoButtonAlert(item.id)}
            />
          </View>
          <Icon
            type="material-community"
            style={{ paddingRight: 55, color: "white" }}
            name={"pencil-outline"}
            size={20}
            color={ICON}
            onPress={() => sendEditSubcategoryScreen(item)}
          />
        </View>
      </View>
    );
  };
  const styles = StyleSheet.create({
    header: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      width: 300,
      backgroundColor: PRIMARY,
      padding: 5,
    },
    title: {
      fontSize: MEDIUM,
      color: "white",
      padding: 2,
    },
    item: {
      padding: 10,
      fontSize: MEDIUM,
      height: 44,
    },
  });

  return (
    <FlatList
      keyExtractor={(item) => item.id.toString()}
      data={data}
      renderItem={listItem}
    />
  );
};
export default FlatListItem;
