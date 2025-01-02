import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { Icon } from "react-native-elements";
import Popover from 'react-native-popover-view';
import { StackNavigationProp } from "@react-navigation/stack";

// Services
import {deleteExpense} from '../../../services/expenses';

// Components

// Types
import { ExtendedExpenseModel } from "../../../shared/types/models/expense.type";
import { ExpenseStackParamList } from "../../../shared/types";

// Utils
import ShowToast from "../../../utils/toastUtils";
import {Errors} from '../../../utils/Errors';
import {DateFormat, NumberFormat} from '../../../utils/Helpers';

// styles
import {ICON, MUTED} from '../../../styles/colors';
import {MEDIUM, SMALL} from '../../../styles/fonts';
import { FONT_WEIGHTS } from "../../../styles/fontWeight";

type RenderItemNavigationProp = StackNavigationProp<ExpenseStackParamList, 'lastExpenses'>;
interface RenderItemProps {
  item: ExtendedExpenseModel;
  navigation: RenderItemNavigationProp;
  updateList: () => void;
}

const RenderItem: React.FC<RenderItemProps> = ({ item, navigation, updateList }) => {

  const [showPopover, setShowPopover] = useState(false);
  const sendEditExpenceScreenn = (objectExpense: typeof item)=>{
    setShowPopover(false);
    navigation.navigate("editExpense", { objectExpense });
  }
  const deleteItem = async (idExpense: number) => {
    try {
      await deleteExpense(idExpense);
      ShowToast();
      updateList();
    } catch (e) {
      Errors(e);
    }
  };
  const createTwoButtonAlert = (expenseDelete: typeof item) => {
    setShowPopover(false);
    return ( Alert.alert("Eliminar", `¿Desea eliminar gasto de ${expenseDelete.subcategory} por ${NumberFormat(expenseDelete.cost)} ? `, [
      {
        text: "Cancel",
        style: "cancel",
      },
      { text: "OK", onPress: () => deleteItem(expenseDelete.id) },
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
        <Text style={styles.subcategoryTitle}>{item.subcategory}</Text>
        <Text style={styles.commentary}>{item.commentary}</Text>
      </View>
      <View style={styles.cardDate}>
        <Text style={styles.cost}>{NumberFormat(item.cost)}</Text>
        <Text style={styles.date}>
          {DateFormat(item.dateFormat, "DD MMM YYYY")}{"   "}
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
          <Text style={styles.itemPopover} onPress={() => createTwoButtonAlert(item)}>Borrar</Text>
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
  subcategoryTitle: {
    fontWeight: FONT_WEIGHTS.semiBold
  },
  icon: {
    borderRadius: 100,
    padding: 2,
    marginTop: 10
  },
});
export default  RenderItem;
