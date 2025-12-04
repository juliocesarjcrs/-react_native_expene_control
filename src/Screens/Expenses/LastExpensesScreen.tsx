import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { setQuery } from '../../features/searchExpenses/searchExpensesSlice';

// Services
import { getLastExpensesWithPaginate } from '../../services/expenses';

// Components
import MyLoading from '../../components/loading/MyLoading';
import { ScreenHeader } from '~/components/ScreenHeader';
import RenderItemExpense from './components/RenderItemExpense';
import BarSearch from '~/components/search/BarSearch';

// Types
import { ExpenseStackParamList } from '../../shared/types';
import { RootState } from '../../shared/types/reducers';

// Utils
import { ExtendedExpenseModel } from '../../shared/types/models/expense.type';
import { AppDispatch } from '../../shared/types/reducers/root-state.type';
import { showError } from '~/utils/showError';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';
import { useThemeColors } from '~/customHooks/useThemeColors';

export type LastExpenseScreenNavigationProp = StackNavigationProp<
  ExpenseStackParamList,
  'lastExpenses'
>;

interface LastExpenseScreenProps {
  navigation: LastExpenseScreenNavigationProp;
}

export default function LastExpensesScreen({ navigation }: LastExpenseScreenProps) {
  const config = screenConfigs.lastExpenses;
  const colors = useThemeColors();
  const [lastExpenses, setLastExpenses] = useState<ExtendedExpenseModel[]>([]);
  const [loadingFooter, setLoadingFotter] = useState(false);
  const [page, setPage] = useState(1);
  const [stopeFetch, setStopeFetch] = useState(false);
  const dispatch: AppDispatch = useDispatch();
  const query = useSelector((state: RootState) => state.search.query);
  const isFirstRender = React.useRef(true);

  // Resetear query solo al montar
  useEffect(() => {
    dispatch(setQuery(null));
  }, []);

  // Manejar cambios de búsqueda (query)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (query !== null) return;
    }
    setLastExpenses([]);
    setPage(1);
    setStopeFetch(false);
    setLoadingFotter(false);
    fetchData(1, true);
  }, [query]);

  // Manejar paginación (solo si no es búsqueda nueva)
  useEffect(() => {
    if (page > 1) {
      fetchData(page, false);
    }
  }, [page]);

  // fetchData recibe page y reset flag
  const fetchData = async (pageToFetch: number, reset: boolean) => {
    try {
      setLoadingFotter(true);
      const params = {
        take: 15,
        page: pageToFetch,
        query,
        orderBy: 'date'
      };
      const { data } = await getLastExpensesWithPaginate(params);
      setLoadingFotter(false);
      if (data.data.length <= 0) {
        setStopeFetch(true);
      }
      let newList: ExtendedExpenseModel[] = [];
      if (reset) {
        newList = data.data.map((e) => ({ ...e }) as ExtendedExpenseModel);
      } else {
        newList = [...lastExpenses, ...data.data.map((e) => ({ ...e }) as ExtendedExpenseModel)];
      }
      setLastExpenses(newList);
    } catch (e) {
      setLoadingFotter(false);
      showError(e);
    }
  };

  // Función para actualizar la lista desde RenderItem (siempre recarga la primera página)
  const updateList = () => {
    fetchData(1, true);
  };

  // Paginador
  const loadMoreData = () => {
    if (!stopeFetch && !loadingFooter) {
      setPage((prev) => prev + 1);
    }
  };

  const renderFooter = () => {
    return <View>{loadingFooter ? <MyLoading /> : null}</View>;
  };

  return (
    <SafeAreaView
      style={[commonStyles.screenContentWithPadding, { backgroundColor: colors.BACKGROUND }]}
    >
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <FlatList
        testID="flatlist-expenses"
        data={lastExpenses}
        renderItem={({ item }) => (
          <RenderItemExpense item={item} navigation={navigation} updateList={updateList} />
        )}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => (
          <Text style={[styles.textMuted, { color: colors.DARK_GRAY }]}>
            No se registran últimos gastos
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15
  },
  textMuted: {
    textAlign: 'center'
  }
});
