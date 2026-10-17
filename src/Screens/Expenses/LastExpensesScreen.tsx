import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
// Hooks
import { selectSearchQuery } from '~/features/search/searchSelectors';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { FetchParams, usePaginatedSearch } from '~/customHooks/usePaginatedSearch';
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

import { useAppSelector } from '~/store/hooks';
// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';
import { useMinimumDuration } from '~/customHooks/useMinimumDuration';

export type LastExpenseScreenNavigationProp = StackNavigationProp<
  ExpenseStackParamList,
  'lastExpenses'
>;

interface LastExpenseScreenProps {
  navigation: LastExpenseScreenNavigationProp;
}
const PAGE_SIZE = 15;

const fetchExpenses = async ({
  take,
  page,
  query
}: FetchParams): Promise<ExtendedExpenseModel[]> => {
  const { data } = await getLastExpensesWithPaginate({ take, page, query, orderBy: 'date' });
  return data.data.map((e) => ({ ...e }) as ExtendedExpenseModel);
};
export default function LastExpensesScreen({ navigation }: LastExpenseScreenProps) {
  const query = useAppSelector(selectSearchQuery('expenses'));
  const { items, initialLoading, loadingMore, loadMore, reload } = usePaginatedSearch(
    fetchExpenses,
    query,
    PAGE_SIZE
  );
  const searching = useMinimumDuration(initialLoading);

  // footer: solo lo muestra si es paginación, o si no hay nada que mirar todavía
  const showFooterLoading = loadingMore || (initialLoading && items.length === 0);
  const config = screenConfigs.lastExpenses;
  const colors = useThemeColors();

  const renderItem = useCallback(
    ({ item }: { item: ExtendedExpenseModel }) => (
      <RenderItemExpense item={item} navigation={navigation} updateList={reload} />
    ),
    [navigation, reload]
  );

  return (
    <SafeAreaView style={[commonStyles.screenContent, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <FlatList
        testID="flatlist-expenses"
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          initialLoading ? null : (
            <Text style={[styles.textMuted, { color: colors.DARK_GRAY }]}>
              No se registran últimos gastos
            </Text>
          )
        }
        initialNumToRender={10}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={<BarSearch scope="expenses" loading={searching} />}
        ListFooterComponent={showFooterLoading ? <MyLoading /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  textMuted: {
    textAlign: 'center'
  }
});
