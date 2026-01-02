import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getLastIncomesWithPaginate } from '../../services/incomes';

import { useDispatch, useSelector } from 'react-redux';
import usePrevious from '~/customHooks/usePrevious';
import { IncomeStackParamList } from '../../shared/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { setQuery } from '../../features/searchExpenses/searchExpensesSlice';
import { LastIncomes } from '../../shared/types/services/income-service.type';

// Components
import MyLoading from '../../components/loading/MyLoading';
import { RootState } from '../../shared/types/reducers';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { AppDispatch } from '../../shared/types/reducers/root-state.type';
import { ScreenHeader } from '~/components/ScreenHeader';
import RenderItemIncome from './components/RenderItemIncome';
import BarSearch from '~/components/search/BarSearch';

// Utils
import { showError } from '~/utils/showError';
import { handlerDataSearch } from '../../utils/Helpers';
// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';
export type LastIncomesScreenNavigationProp = StackNavigationProp<
  IncomeStackParamList,
  'lastIncomes'
>;
type LastIncomesScreenRouteProp = RouteProp<IncomeStackParamList, 'lastIncomes'>;

interface LastIncomesScreenProps {
  navigation: LastIncomesScreenNavigationProp;
  route: LastIncomesScreenRouteProp;
}

export default function LastIncomesScreen({ navigation }: LastIncomesScreenProps) {
  const config = screenConfigs.lastIncomes;
  const colors = useThemeColors();
  const [lastIncomes, setLastIncomes] = useState<LastIncomes[]>([]);
  const [loadingFooter, setLoadingFotter] = useState(false);
  const [page, setPage] = useState(1);
  const [stopeFetch, setStopeFetch] = useState(false);
  const dispatch: AppDispatch = useDispatch();
  const query = useSelector((state: RootState) => state.search.query);
  const prevQuery = usePrevious(query);
  const isFirstRender = React.useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      // Refresca la lista cada vez que el screen gana foco
      fetchData(1, true);
    }, [query])
  );
  // Resetear query solo al montar
  useEffect(() => {
    dispatch(setQuery(null));
  }, []);

  // Manejar cambios de búsqueda (query)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Si el query es distinto de null, espera a que el reset lo limpie
      if (query !== null) {
        return;
      }
    }
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
      fetchData(page, false); // false: no reset
    } else if (page > 1 && query === null) {
      fetchData(page, false);
    }
  }, [page]);

  // fetchData recibe page y reset flag
  const fetchData = useCallback(
    async (pageToFetch: number, reset: boolean) => {
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
        }
        let newList = [];
        if (reset) {
          newList = handlerDataSearch(data.data, [], params.query, prevQuery, params.page);
        } else {
          newList = handlerDataSearch(data.data, lastIncomes, params.query, prevQuery, params.page);
        }
        setLastIncomes(newList);
      } catch (e) {
        setLoadingFotter(false);
        showError(e);
      }
    },
    [query, lastIncomes, prevQuery, stopeFetch]
  );

  // Paginador
  const loadMoreData = () => {
    if (!stopeFetch && !loadingFooter) {
      setPage((prev) => prev + 1);
    }
  };
  const updateList = () => {
    fetchData(1, true);
  };
  const renderFooter = () => {
    return <View>{loadingFooter ? <MyLoading testID="loading-footer" /> : null}</View>;
  };

  return (
    <SafeAreaView
      style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}
    >
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <FlatList
        testID="flatlist-incomes"
        data={lastIncomes}
        renderItem={({ item }) => (
          <RenderItemIncome item={item} navigation={navigation} updateList={updateList} />
        )}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => (
          <Text style={[styles.textMuted, { color: colors.DARK_GRAY }]}>
            No se registran últimos ingresos
          </Text>
        )}
        initialNumToRender={10}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={() => <BarSearch />}
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  textMuted: {
    textAlign: 'center'
  }
});
