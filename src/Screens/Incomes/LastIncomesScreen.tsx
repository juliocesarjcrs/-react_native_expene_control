import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Errors } from '../../utils/Errors';
import { getLastIncomesWithPaginate } from '../../services/incomes';
import { MUTED } from '../../styles/colors';
import RenderItem from './components/RenderItem';

import { useDispatch, useSelector } from 'react-redux';
import usePrevious from '../../customHooks/usePrevious';
import { handlerDataSearch } from '../../utils/Helpers';
import { IncomeStackParamList } from '../../shared/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { setQuery } from '../../features/searchExpenses/searchExpensesSlice';
import { LastIncomes } from '../../shared/types/services/income-service.type';

// Components
import { BarSearch } from '../../components/search';
import MyLoading from '../../components/loading/MyLoading';
import { RootState } from '../../shared/types/reducers';
import { RouteProp } from '@react-navigation/native';
import { AppDispatch } from '../../shared/types/reducers/root-state.type';

type LastIncomesScreenNavigationProp = StackNavigationProp<IncomeStackParamList, 'lastIncomes'>;
type LastIncomesScreenRouteProp = RouteProp<IncomeStackParamList, 'lastIncomes'>;

interface LastIncomesScreenProps {
  navigation: LastIncomesScreenNavigationProp;
  route: LastIncomesScreenRouteProp;
}

export default function LastIncomesScreen({ navigation, route }: LastIncomesScreenProps) {
  const paramsEdictedIncome = route.params ? route.params.data : null;
  const [lastIncomes, setLastIncomes] = useState<LastIncomes[]>([]);
  const [loadingFooter, setLoadingFotter] = useState(false);
  const [page, setPage] = useState(1);
  const [stopeFetch, setStopeFetch] = useState(false);
  // PARA EL BUSCADOR
  const dispatch: AppDispatch = useDispatch();
  const query = useSelector((state: RootState) => state.search.query);
  const prevQuery = usePrevious(query);
  // const [isMounted, setIsMounted] = useState(true);
  // Cuando viene de editar
  // console.log('1----------paramsEdictedIncome', paramsEdictedIncome);
  // const [edictedIncome, setEdictedIncome] = useState(null);
  if (paramsEdictedIncome) {
    // console.log('1------------ ',paramsEdictedIncome.id, route);
  } else {
    // console.log('else2----------');
  }
  // const updateWhenEdit = () => {
  //     if (edictedIncome) {
  //         console.log("----------Entró 1", lastIncomes);
  //         const indexArray = lastIncomes.findIndex((e) => {
  //             return e.id === edictedIncome.id;
  //         });
  //         if (indexArray >= 0) {
  //             let temp = {
  //                 cost: edictedIncome.amount,
  //                 commentary: edictedIncome.commentary,
  //                 dateFormat: edictedIncome.date,
  //             };
  //             let tempIncomes = lastIncomes;
  //             tempIncomes[indexArray] = {
  //                 ...tempIncomes[indexArray],
  //                 ...temp,
  //             };
  //             setLastIncomes(tempIncomes);
  //             // console.log('sigue aqui 22------concatPages:', concatPages);
  //         }
  //     } else {
  //         console.log("ELSE----------");
  //     }
  // };
  // la primera vez resetea el buscador
  useEffect(() => {
    dispatch(setQuery(null));
  }, []);

  useEffect(() => {
    fetchData();
    return navigation.addListener('focus', () => {
      fetchData();
    });
  }, [page]);
  /**Solo se lanza la primera vez cuando se contruye el component y al dar click boton buscar */
  useEffect(() => {
    setLastIncomes([]);
    setPage(1);
    setStopeFetch(false);
    if (page === 1 && query !== null) {
      fetchData();
    }
  }, [query]);

  const fetchData = async () => {
    try {
      // setLoading(true);
      const params = {
        take: 25,
        page,
        query
      };
      setLoadingFotter(true);
      const { data } = await getLastIncomesWithPaginate(params);
      setLoadingFotter(false);
      if (data.data.length <= 0) {
        setStopeFetch(true);
      }
      const concatPages = handlerDataSearch(data.data, lastIncomes, params.query, prevQuery, params.page);
      setLastIncomes(concatPages);
    } catch (e) {
      setLoadingFotter(false);
      Errors(e);
    }
  };
  const loadMoreData = () => {
    if (!stopeFetch) {
      if (!loadingFooter) {
        // si no esta cargando datos aumente la página
        setPage(page + 1);
      }
    }
  };
  const renderFooter = () => {
    return <View>{loadingFooter ? <MyLoading /> : null}</View>;
  };

  return (
    <SafeAreaView style={styles.container}>
        <FlatList
          data={lastIncomes}
          renderItem={({ item }) => <RenderItem item={item} navigation={navigation} updateList={fetchData} />}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={() => <Text style={styles.textMuted}>No se registran últimos ingresos</Text>}
          initialNumToRender={10}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.1}
          ListHeaderComponent={BarSearch}
          ListFooterComponent={renderFooter}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15
  },
  textMuted: {
    textAlign: 'center',
    color: MUTED
  }
});
