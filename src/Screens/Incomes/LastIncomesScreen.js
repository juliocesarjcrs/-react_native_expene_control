import React, { useEffect, useRef, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Errors } from "../../utils/Errors";
import MyLoading from "~/components/loading/MyLoading";
import { getLastIncomesWithPaginate } from "../../services/incomes";
import { MUTED } from "../../styles/colors";
import RenderItem from "./components/RenderItem";
import BarSearch from './components/BarSearch';
import {  useDispatch, useSelector } from "react-redux";
import usePrevious from '../../customHooks/usePrevious';
import {setQueryAction} from '../../actions/SearchActions';

export default function LastIncomesScreen({ navigation, route }) {
  const paramsEdictedIncome = route.params ? route.params.data : null;
  const [lastIncomes, setLastIncomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFooter, setLoadingFotter] = useState(false);
  const [page, setPage] = useState(1);
  const [stopeFetch, setStopeFetch] = useState(false);
  // PARA EL BUSCADOR
  const dispatch = useDispatch();
  const query = useSelector((state) => state.search.query);
  const prevQuery = usePrevious(query);
  // Cuando viene de editar
  // console.log('1----------paramsEdictedIncome', paramsEdictedIncome);
  const [edictedIncome, setEdictedIncome ] = useState(null);
  if (paramsEdictedIncome) {
    console.log('1------------ ',paramsEdictedIncome.id, route);
  }else{
    console.log('else2----------');
  }
  const updateWhenEdit = () => {
      if (edictedIncome) {
          console.log("----------Entró 1", lastIncomes);
          const indexArray = lastIncomes.findIndex((e) => {
              return e.id === edictedIncome.id;
          });
          if (indexArray >= 0) {
              let temp = {
                  cost: edictedIncome.amount,
                  commentary: edictedIncome.commentary,
                  dateFormat: edictedIncome.date,
              };
              let tempIncomes =  lastIncomes;
              tempIncomes[indexArray] = { ...tempIncomes[indexArray], ...temp };
              setLastIncomes(tempIncomes);
              // console.log('sigue aqui 22------concatPages:', concatPages);
          }
      } else {
          console.log("ELSE----------");
      }
  };

  // la primera vez resetea el buscador
  useEffect(() => {
      dispatch(setQueryAction(null));
  }, []);

  useEffect(() => {
      fetchData();
      return navigation.addListener("focus", () => {
          fetchData();
      });
  }, [page, query]);
  useEffect(() => {
      if (page !== 1) {
          setPage(1);
      }
  }, [query]);

//   useEffect(() => {
//     updateWhenEdit();

// }, [edictedIncome]);

  const fetchData = async () => {
      try {
          // setLoading(true);
          const params = {
              take: 15,
              page,
              query,
          };
          setLoadingFotter(true);
          const { data } = await getLastIncomesWithPaginate(params);
          setLoadingFotter(false);

          // setLoading(false);
          if (data.data.length <= 0) {
              setStopeFetch(false);
          }
          let concatPages = [];
          const condition1 = query === null && prevQuery === undefined;
          const condition2 = query === null && prevQuery === null;
          const condition3 = query === "" && prevQuery === "";
          if (condition1 || condition2) {
              concatPages = lastIncomes.concat(data.data);
              concatPages = getUniqArrDeep(concatPages)
          } else {
              if (condition3) {
                  concatPages = lastIncomes.concat(data.data);
                  concatPages = getUniqArrDeep(concatPages);
              } else {
                  concatPages = data.data.length > 0 ? data.data : lastIncomes;
              }
          }
          // if(edictedIncome){
          //   updateWhenEdit();
          // }

          setLastIncomes(concatPages);
      } catch (e) {
          setLoadingFotter(false);
          // setLoading(false);
          Errors(e);
      }
  };
  const loadMoreData = () => {
      if (!stopeFetch) {
          setPage(page + 1);
      }
  };
  const getUniqArrDeep = (arr) => {
      const arrStr = arr.map((item) => JSON.stringify(item));
      return [...new Set(arrStr)].map((item) => JSON.parse(item));
  };
  const renderFooter = () => {
      return <View>{loadingFooter ? <MyLoading /> : null}</View>;
  };


  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <MyLoading />
      ) : (
        <FlatList
          data={lastIncomes}
          renderItem={({ item }) => (
            <RenderItem
              item={item}
              navigation={navigation}
              updateList={fetchData}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={() => (
            <Text style={styles.textMuted}>No se registran últimos ingresos</Text>
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
