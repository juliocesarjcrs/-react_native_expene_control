import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Icon } from "react-native-elements";
import { getLastExpensesWithPaginate } from "../../../services/expenses";
import { ICON } from "../../../styles/colors";
import {MEDIUM, SMALL} from '../../../styles/fonts';
import { DateFormat, NumberFormat } from "../../../utils/Helpers";

const CardLastExpenses = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    const { data } = await getLastExpensesWithPaginate();
    // console.log("lastExpenses");
    setExpenses(data.data);
  };

  return (
    <View style={styles.container}>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text style={styles.title}>últimos gastos</Text>
        {/* <View style={{ display: 'flex', flexDirection: 'row'}}>
          <Icon
          type="font-awesome"
          style={styles.iconHeader}
          name={"expand"}
          size={20}
          color={ICON}
        />

          <Icon
                type="font-awesome"
                style={styles.iconHeader}
                name={"ellipsis-v"}
                size={20}
                color={ICON}
              />

      </View> */}

      </View>


      {expenses.map((item) => (
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
              {DateFormat(item.date, "DD MMM")}{" "}
              {DateFormat(item.createdAt, "hh:mm a")}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    // backgroundColor: "#8D9D29",
    paddingVertical: 10,
    paddingHorizontal: 5,
    margin: 4,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 10,

  },
  iconHeader: {
    paddingHorizontal: 10
  },
  title: {
    fontWeight: "bold",
  },
  icon: {
    // backgroundColor: "pink",
    borderRadius: 100,
    padding: 2,
    marginTop: 10
  },
  containerCard: {
    display: "flex",
    flexDirection: "row",
    // backgroundColor: "red",
    // backgroundColor: "#8D9D29",
    justifyContent: "space-between",
    // borderWidth: 1,
    // borderColor: 'black',
    paddingVertical: 6,
  },
  containerText: {
    paddingLeft: 10,
    paddingVertical: 4,
    // backgroundColor: "#8D9D29",
    flex: 1
  },
  commentary: {
    fontSize: SMALL,
  },
  cardDate: {
    // backgroundColor: "#DCD4CD",
    paddingHorizontal: 5
  },
  date: {
    fontSize: SMALL,
  },
  cost: {
    fontSize: MEDIUM,
    fontWeight: 'bold',
    justifyContent: 'flex-end'
  },
});

export default CardLastExpenses;
