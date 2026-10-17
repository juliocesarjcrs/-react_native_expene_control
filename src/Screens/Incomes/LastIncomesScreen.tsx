import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { getLastIncomesWithPaginate } from '../../services/incomes';

// Types
import { IncomeStackParamList } from '../../shared/types';
import { LastIncomes } from '../../shared/types/services/income-service.type';

// Components
import MyLoading from '../../components/loading/MyLoading';
import { ScreenHeader } from '~/components/ScreenHeader';
import RenderItemIncome from './components/RenderItemIncome';
import BarSearch from '~/components/search/BarSearch';

// Hooks
import { useAppSelector } from '~/store/hooks';
import { FetchParams, usePaginatedSearch } from '~/customHooks/usePaginatedSearch';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';
import { selectSearchQuery } from '~/features/search/searchSelectors';
import { useMinimumDuration } from '~/customHooks/useMinimumDuration';

export type LastIncomesScreenNavigationProp = StackNavigationProp<
  IncomeStackParamList,
  'lastIncomes'
>;

interface LastIncomesScreenProps {
  navigation: LastIncomesScreenNavigationProp;
}

const PAGE_SIZE = 25;

const keyExtractor = (item: LastIncomes): string => item.id.toString();

const fetchIncomes = async ({ take, page, query }: FetchParams): Promise<LastIncomes[]> => {
  const { data } = await getLastIncomesWithPaginate({ take, page, query });
  return data.data;
};
export default function LastIncomesScreen({ navigation }: LastIncomesScreenProps) {
  const query = useAppSelector(selectSearchQuery('incomes'));
  const { items, initialLoading, loadingMore, loadMore, reload } = usePaginatedSearch(
    fetchIncomes,
    query,
    PAGE_SIZE
  );
  const searching = useMinimumDuration(initialLoading);

  // footer: solo lo muestra si es paginación, o si no hay nada que mirar todavía
  const showFooterLoading = loadingMore || (initialLoading && items.length === 0);

  const config = screenConfigs.lastIncomes;
  const colors = useThemeColors();

  const renderItem = useCallback(
    ({ item }: { item: LastIncomes }) => (
      <RenderItemIncome item={item} navigation={navigation} updateList={reload} />
    ),
    [navigation, reload]
  );

  return (
    <SafeAreaView style={[commonStyles.screenContent, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <FlatList
        testID="flatlist-incomes"
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          initialLoading ? null : (
            <Text style={[styles.textMuted, { color: colors.DARK_GRAY }]}>
              No se registran últimos ingresos
            </Text>
          )
        }
        initialNumToRender={10}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        // ListHeaderComponent={<BarSearch scope="incomes" />}
        // ListFooterComponent={
        //   <View>{showFooterLoading ? <MyLoading testID="loading-footer" /> : null}</View>
        // }
        ListHeaderComponent={<BarSearch scope="incomes" loading={searching} />}
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
