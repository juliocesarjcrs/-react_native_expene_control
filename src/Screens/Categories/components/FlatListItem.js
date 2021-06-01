import React from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Icon } from "react-native-elements";
import { MEDIUM } from "~/styles/fonts";
import { PRIMARY, ICON } from "~/styles/colors";
import { deleteCategory } from "../../../services/categories";
import { Errors } from "../../../utils/Errors";

const FlatListItem = ({ data, updateList }) => {
  const listItem = ({ item }) => {
    const deleteItem = async (idExpense) => {
      try {
        const { data } = await deleteCategory(idExpense);
        updateList();
      } catch (e) {
        Errors(e);
      }
    };

    const createTwoButtonAlert = (id) =>
      Alert.alert("Eliminar", "¿Desea eliminar esta categoria?", [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        { text: "OK", onPress: () => deleteItem(id) },
      ]);
    return (
      <View style={styles.header}>
        <Icon
          type="font-awesome"
          style={{ paddingRight: 15 }}
          name={item.icon ? item.icon : "home"}
          size={20}
          color={ICON}
        />
        <Text style={styles.title}>{item.name}</Text>
        <Icon
          type="font-awesome"
          style={{ paddingRight: 15 }}
          name="trash-can"
          size={20}
          color={ICON}
          onPress={() => createTwoButtonAlert(item.id)}
        />
      </View>
    );
  };
  const styles = StyleSheet.create({
    header: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      width: 340,
      backgroundColor: PRIMARY,
      paddingHorizontal: 8,
      padding: 4
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
