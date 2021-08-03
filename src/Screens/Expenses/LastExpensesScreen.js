import React, { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text } from "react-native";
import { Errors } from "../../utils/Errors";
import MyLoading from "~/components/loading/MyLoading";
import { getLastExpensesWithPaginate } from "../../services/expenses";
import { MUTED } from "../../styles/colors";
import RenderItem from "./components/RenderItem";

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

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <MyLoading />
      ) : (
        <FlatList
          data={lastExpenses}
          renderItem={({ item }) => (
            <RenderItem
              item={item}
              navigation={navigation}
              updateList={fetchData}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={() => (
            <Text style={styles.textMuted}>No se registran últimos gastos</Text>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
  },
  textMuted: {
    textAlign: "center",
    color: MUTED,
  },
});
