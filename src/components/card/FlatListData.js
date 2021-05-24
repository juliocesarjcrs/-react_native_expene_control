import React from "react";

import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Icon } from "react-native-elements";
import { deleteExpense } from "../../services/expenses";
import { ICON, PRIMARY } from "../../styles/colors";
import { MEDIUM, SMALL } from "../../styles/fonts";
import { Errors } from "../../utils/Errors";
import { DateFormat, NumberFormat } from "../../utils/Helpers";
import { Tooltip } from 'react-native-elements';

const FlatListData = ({ expenses, updateList }) => {
  const ListExpense = ({ item }) => {
    const deleteItem = async (idExpense) => {
      try {
        const { data } = await deleteExpense(idExpense);
        updateList();
      } catch (e) {
        Errors(e);
      }
    };
    const createTwoButtonAlert = (id) =>
      Alert.alert("Eliminar", "¿Desea eliminar este gasto?", [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        { text: "OK", onPress: () => deleteItem(id) },
      ]);
    return (
      <View style={styles.header}>
        <Tooltip popover={<Text>{item.commentary}</Text>}>
        <Text style={styles.title}>{NumberFormat(item.cost)}</Text>
        </Tooltip>
        <Text style={styles.item}>{DateFormat(item.date)}</Text>
        <Icon
          type="material-community"
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
      // width: 300,
      backgroundColor: PRIMARY,
      padding: 5,
      // alignItems: "center",
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
  return (
    <FlatList
      keyExtractor={(item) => item.id.toString()}
      data={expenses}
      renderItem={ListExpense}
    ></FlatList>
  );
};

export default FlatListData;
