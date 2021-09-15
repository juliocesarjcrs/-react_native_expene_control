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
  const [page, setPage] = useState(1);
  const [stopeFetch, setStopeFetch] = useState(false);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, [page]);
  const fetchData = async () => {
    try {
      // setLoading(true);
      const params = {
        take: 15,
        page
      };
      const { data } = await getLastExpensesWithPaginate(params);
      // setLoading(false);
      if(data.data.length <= 0){
        setStopeFetch(false);
      }
      let concatPages = lastExpenses.concat(data.data);
      setLastExpenses(concatPages);
    } catch (e) {
      // setLoading(false);
      Errors(e);
    }
  };
  const loadMoreData = () => {
    if(!stopeFetch){
      setPage(page + 1);
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
          initialNumToRender={10}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
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
