import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
// Hooks
import { selectSearchQuery } from '~/features/search/searchSelectors';
// Services
import { getLastExpensesWithPaginate } from '../../services/expenses';

// Components
import MyLoading from '../../components/loading/MyLoading';
import { ScreenHeader } from '~/components/ScreenHeader';
import RenderItemExpense from './components/RenderItemExpense';
import BarSearch from '~/components/search/BarSearch';

// Types
import { ExpenseStackParamList } from '../../shared/types';

// Utils
import { ExtendedExpenseModel } from '../../shared/types/models/expense.type';
import { showError } from '~/utils/showError';

import { useAppSelector } from '~/store/hooks';
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
  const query = useAppSelector(selectSearchQuery);
  const isFirstRender = React.useRef(true);

  const fetchData = useCallback(
    async (pageToFetch: number, reset: boolean) => {
      try {
        setLoadingFotter(true);
        const params = { take: 15, page: pageToFetch, query, orderBy: 'date' };
        const { data } = await getLastExpensesWithPaginate(params);
        if (data.data.length <= 0) {
          setStopeFetch(true);
        }
        const mapped = data.data.map((e) => ({ ...e }) as ExtendedExpenseModel);
        setLastExpenses((prev) => (reset ? mapped : [...prev, ...mapped]));
      } catch (e) {
        showError(e);
      } finally {
        setLoadingFotter(false);
      }
    },
    [query]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (query !== null) return;
    }
    setLastExpenses([]);
    setPage(1);
    setStopeFetch(false);
    void (async () => {
      await fetchData(1, true);
    })();
  }, [query, fetchData]);

  useEffect(() => {
    if (page > 1) {
      void (async () => {
        await fetchData(page, false);
      })();
    }
  }, [page, fetchData]);

  const updateList = useCallback(() => {
    setPage(1);
    setStopeFetch(false);

    void (async () => {
      await fetchData(1, true);
    })();
  }, [fetchData]);

  const loadMoreData = () => {
    if (!stopeFetch && !loadingFooter) {
      setPage((prev) => prev + 1);
    }
  };

  // const renderFooter = () => <View>{loadingFooter ? <MyLoading /> : null}</View>;
  // ✅ Sin footer cuando no hay loading
  const renderFooter = () => {
    if (!loadingFooter) return null;
    return <MyLoading />;
  };

  return (
    <SafeAreaView style={[commonStyles.screenContent, { backgroundColor: colors.BACKGROUND }]}>
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
  textMuted: {
    textAlign: 'center'
  }
});
