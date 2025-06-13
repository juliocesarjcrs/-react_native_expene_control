import React, { useEffect, useState, useCallback } from 'react';
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

export type LastIncomesScreenNavigationProp = StackNavigationProp<IncomeStackParamList, 'lastIncomes'>;
type LastIncomesScreenRouteProp = RouteProp<IncomeStackParamList, 'lastIncomes'>;

interface LastIncomesScreenProps {
  navigation: LastIncomesScreenNavigationProp;
  route: LastIncomesScreenRouteProp;
}

export default function LastIncomesScreen({ navigation }: LastIncomesScreenProps) {
  const [lastIncomes, setLastIncomes] = useState<LastIncomes[]>([]);
  const [loadingFooter, setLoadingFotter] = useState(false);
  const [page, setPage] = useState(1);
  const [stopeFetch, setStopeFetch] = useState(false);
  const dispatch: AppDispatch = useDispatch();
  const query = useSelector((state: RootState) => state.search.query);
  const prevQuery = usePrevious(query);
  const isFirstRender = React.useRef(true);

  // Resetear query solo al montar
  useEffect(() => {
    console.log('[LastIncomesScreen] useEffect mount: dispatch setQuery(null)');
    dispatch(setQuery(null));
  }, []);

  // Manejar cambios de búsqueda (query)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Si el query es distinto de null, espera a que el reset lo limpie
      if (query !== null) {
        console.log('[LastIncomesScreen] useEffect [query]: Detenido porque query !== null:', query);
        return;
      }
    }
    console.log('[LastIncomesScreen] useEffect [query]: Reiniciando paginación y datos. Query:', query);
    // Reinicia todos los flags de paginación y datos
    setLastIncomes([]);
    setPage(1);
    setStopeFetch(false);
    setLoadingFotter(false);
    fetchData(1, true);
  }, [query]);

  // Manejar paginación (solo si no es búsqueda nueva)
  useEffect(() => {
    if (page > 1 && query !== null) {
      console.log('[LastIncomesScreen] useEffect [page]: page > 1 y query !== null, fetchData', page, query);
      fetchData(page, false); // false: no reset
    } else if (page > 1 && query === null) {
      console.log('[LastIncomesScreen] useEffect [page]: page > 1 y query === null, fetchData', page, query);
      fetchData(page, false);
    }
  }, [page]);

  // fetchData recibe page y reset flag
  const fetchData = useCallback(async (pageToFetch: number, reset: boolean) => {
    console.log('[LastIncomesScreen] fetchData called with', { pageToFetch, reset, query, lastIncomesLength: lastIncomes.length, stopeFetch });
    try {
      setLoadingFotter(true);
      const params = {
        take: 25,
        page: pageToFetch,
        query
      };
      const { data } = await getLastIncomesWithPaginate(params);
      setLoadingFotter(false);
      if (data.data.length <= 0) {
        setStopeFetch(true);
        console.log('[LastIncomesScreen] fetchData: No más datos, stopeFetch=true');
      }
      let newList = [];
      if (reset) {
        newList = handlerDataSearch(data.data, [], params.query, prevQuery, params.page);
      } else {
        newList = handlerDataSearch(data.data, lastIncomes, params.query, prevQuery, params.page);
      }
      setLastIncomes(newList);
      console.log('[LastIncomesScreen] fetchData: setLastIncomes, length:', newList.length);
    } catch (e) {
      setLoadingFotter(false);
      Errors(e);
    }
  }, [query, lastIncomes, prevQuery, stopeFetch]);

  // Paginador
  const loadMoreData = () => {
    console.log('[LastIncomesScreen] loadMoreData: stopeFetch:', stopeFetch, 'loadingFooter:', loadingFooter, 'page:', page);
    if (!stopeFetch && !loadingFooter) {
      setPage((prev) => prev + 1);
    }
  };

  const renderFooter = () => {
    return <View>{loadingFooter ? <MyLoading testID="loading-footer" /> : null}</View>;
  };

  return (
    <SafeAreaView style={styles.container}>
        <FlatList
          testID="flatlist-incomes"
          data={lastIncomes}
          renderItem={({ item }) => <RenderItem item={item} navigation={navigation} updateList={() => fetchData(1, true)} />}
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
