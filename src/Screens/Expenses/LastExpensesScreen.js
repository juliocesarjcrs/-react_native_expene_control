import React, { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getCategoryWithSubcategories } from "../../services/categories";
import { Errors } from "../../utils/Errors";
import { DateFormat, NumberFormat } from "../../utils/Helpers";
import { BIG, MEDIUM, SMALL } from "../../styles/fonts";
import MyAcordeon from "./components/MyAcordeon";
import MyButton from "~/components/MyButton";
import { useSelector } from "react-redux";
import MyLoading from "~/components/loading/MyLoading";
import { getLastExpensesWithPaginate } from "../../services/expenses";
import { Icon } from "react-native-elements";
import { ICON, MUTED } from "../../styles/colors";

export default function LastExpensesScreen({ navigation }) {
  const [lastExpenses, setLastExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, []);
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        take: 50,
      };
      const { data } = await getLastExpensesWithPaginate(params);
      setLoading(false);
      setLastExpenses(data.data);
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };
  const renderItem = ({ item }) => (
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
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <MyLoading />
      ) : (
        <FlatList
          data={lastExpenses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={()=>   <Text style={styles.textMuted}>No se registran últimos gastos</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
});
