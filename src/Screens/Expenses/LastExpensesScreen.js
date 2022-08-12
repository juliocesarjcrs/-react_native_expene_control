import React, { useEffect, useRef, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Errors } from "../../utils/Errors";
import MyLoading from "~/components/loading/MyLoading";
import { getLastExpensesWithPaginate } from "../../services/expenses";
import { MUTED } from "../../styles/colors";
import RenderItem from "./components/RenderItem";
import BarSearch from './components/BarSearch';
import {  useDispatch, useSelector } from "react-redux";
import usePrevious from '../../customHooks/usePrevious';
import {setQueryAction} from '../../actions/SearchActions';

export default function LastExpensesScreen({ navigation }) {
  const [lastExpenses, setLastExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFooter, setLoadingFotter] = useState(false);
  const [page, setPage] = useState(1);
  const [stopeFetch, setStopeFetch] = useState(false);
  // PARA EL BUSCADOR
  const dispatch = useDispatch();
  const query = useSelector((state) => state.search.query);
  const prevQuery = usePrevious(query);
  // la primera vez resetea el buscador
  useEffect(() => {
    dispatch(setQueryAction (null));

  }, []);

  useEffect(() => {
    fetchData();
    return navigation.addListener("focus", () => {
      fetchData();
    });
  }, [page, query]);
  useEffect(() => {
    if(page!==1){
      setPage(1);
    }
  }, [query]);

  const fetchData = async () => {
    try {
      const params = {
        take: 15,
        page,
        query
      };
      // setLoading(true);
      setLoadingFotter(true);
      const { data } = await getLastExpensesWithPaginate(params);
      setLoadingFotter(false);
      // setLoading(false);
      if (data.data.length <= 0) {
          setStopeFetch(false);
      }
      let concatPages = [];
      const condition1 = query === null && prevQuery === undefined;
      const condition2 = query === null && prevQuery === null;
      const condition3 = query === '' && prevQuery === '';
      if (condition1 || condition2) {
        concatPages = lastExpenses.concat(data.data);
      } else {
        if(condition3){
            concatPages = lastExpenses.concat(data.data);
            concatPages = getUniqArrDeep(concatPages)
          }else{
            if(page >1){
              concatPages = lastExpenses.concat(data.data);
              concatPages = getUniqArrDeep(concatPages)
            }else{
              concatPages =  data.data;
            }
          }
      }
      setLastExpenses(concatPages);
    } catch (e) {
      setLoadingFotter(false);
      // setLoading(false);
      Errors(e);
    }
  };
  const loadMoreData = () => {
    if(!stopeFetch){
      setPage(page + 1);
    }
  };
  const getUniqArrDeep = arr => {
    const arrStr = arr.map(item => JSON.stringify(item))
    return [...new Set(arrStr)]
        .map(item => JSON.parse(item))
}

const renderFooter = () => {
    return <View>{loadingFooter ? <MyLoading /> : null}</View>;
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
          ListHeaderComponent={BarSearch}
          ListFooterComponent={renderFooter}
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
