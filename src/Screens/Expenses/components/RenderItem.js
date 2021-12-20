import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import {ICON, MUTED} from '../../../styles/colors';
import {MEDIUM, SMALL} from '../../../styles/fonts';
import {DateFormat, NumberFormat} from '../../../utils/Helpers';
import { Icon } from "react-native-elements";
import Popover from 'react-native-popover-view';
import {Errors} from '../../../utils/Errors';
import {deleteExpense} from '../../../services/expenses';
import ShowToast from '../../../components/toast/ShowToast';


const RenderItem = ({item, navigation, updateList})  => {

  const [showPopover, setShowPopover] = useState(false);
  const sendEditExpenceScreenn = (objectExpense)=>{
    setShowPopover(false);
    navigation.navigate("editExpense", { objectExpense });
  }
  const deleteItem = async (idExpense) => {
    try {
      await deleteExpense(idExpense);
      ShowToast();
      updateList();
    } catch (e) {
      Errors(e);
    }
  };
  const createTwoButtonAlert = (id) => {
    setShowPopover(false);
    return ( Alert.alert("Eliminar", "¿Desea eliminar este gasto?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      { text: "OK", onPress: () => deleteItem(id) },
    ]));
  }

  return (
    <View key={item.id} style={styles.containerCard}>
      <Icon
        type="font-awesome"
        style={styles.icon}
        name={item.iconCategory ? item.iconCategory : "home"}
        size={20}
        color={ICON}
      />
      <View style={styles.containerText}>
        <Text style={styles.title}>{item.subcategory}</Text>
        <Text style={styles.commentary}>{item.commentary}</Text>
      </View>
      <View style={styles.cardDate}>
        <Text style={styles.cost}>{NumberFormat(item.cost)}</Text>
        <Text style={styles.date}>
          {DateFormat(item.dateFormat, "DD MMM")}{" "}
          {DateFormat(item.createdAt, "hh:mm a")}
        </Text>
      </View>
      <Popover
        isVisible={showPopover}
        onRequestClose={() => {
          setShowPopover(false);
        }}
        from={
          <TouchableOpacity
            onPress={() => {
              setShowPopover(true);
            }}
          >
            <Icon
              type="font-awesome"
              style={styles.iconHeader}
              name={"ellipsis-v"}
              size={20}
              color={ICON}
            />
          </TouchableOpacity>
        }
      >
        <View style={styles.containerPopover}>
          <Text style={styles.itemPopover} onPress={() => sendEditExpenceScreenn(item)}>Editar</Text>
          <Text style={styles.itemPopover} onPress={() => createTwoButtonAlert(item.id)}>Borrar</Text>
        </View>
      </Popover>
    </View>
  );
}
const styles = StyleSheet.create({
  containerCard: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  containerText: {
    paddingLeft: 10,
    paddingVertical: 4,
    flex: 1,
  },
  commentary: {
    fontSize: SMALL,
  },
  cardDate: {
    paddingHorizontal: 5,
  },
  date: {
    fontSize: SMALL,
  },
  cost: {
    fontSize: MEDIUM,
    fontWeight: "bold",
    justifyContent: "flex-end",
  },
  textMuted: {
    textAlign: "center",
    color: MUTED,
  },
  containerPopover: {
    paddingHorizontal: 10,
    paddingTop: 10
  },
  itemPopover: {
    paddingBottom: 10
  },
  iconHeader: {
    paddingHorizontal: 10,
  },
});
export default  RenderItem;
