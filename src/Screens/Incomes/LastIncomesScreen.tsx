import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

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

// Utils
import { showError } from '~/utils/showError';

// Hooks
import { useAppSelector } from '~/store/hooks';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';

// Configs
import { screenConfigs } from '~/config/screenConfigs';
import { selectSearchQuery } from '~/features/search/searchSelectors';

export type LastIncomesScreenNavigationProp = StackNavigationProp<
  IncomeStackParamList,
  'lastIncomes'
>;

interface LastIncomesScreenProps {
  navigation: LastIncomesScreenNavigationProp;
}

// Lista junto con la petición para la que se cargó
type FetchedIncomes = {
  key: string;
  items: LastIncomes[];
  page: number;
  hasMore: boolean;
};

const PAGE_SIZE = 25;

const keyExtractor = (item: LastIncomes): string => item.id.toString();

// Agrega la página nueva sin repetir ids
const mergePages = (current: LastIncomes[], next: LastIncomes[]): LastIncomes[] => {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...next.filter((item) => !seen.has(item.id))];
};

export default function LastIncomesScreen({ navigation }: LastIncomesScreenProps) {
  const config = screenConfigs.lastIncomes;
  const colors = useThemeColors();
  const query = useAppSelector(selectSearchQuery);
  const [reloadToken, setReloadToken] = useState(0);
  const [fetched, setFetched] = useState<FetchedIncomes | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Identifica la petición actual (búsqueda + recargas manuales)
  const requestKey = `${query ?? ''}|${reloadToken}`;

  // Hay carga inicial mientras los datos no correspondan a la petición actual
  const initialLoading = fetched?.key !== requestKey;
  const items = fetched?.items ?? [];

  // Resetear query solo al montar
  // useEffect(() => {
  //   dispatch(setQuery(null));
  // }, [dispatch]);

  // Página 1: al enfocar la pantalla y cuando cambia la búsqueda o se pide recargar
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadFirstPage = async (): Promise<void> => {
        try {
          const { data } = await getLastIncomesWithPaginate({ take: PAGE_SIZE, page: 1, query });
          if (active) {
            setFetched({
              key: requestKey,
              items: data.data,
              page: 1,
              hasMore: data.data.length > 0
            });
          }
        } catch (e) {
          if (!active) return;
          showError(e);
          setFetched({ key: requestKey, items: [], page: 1, hasMore: false });
        }
      };

      loadFirstPage();

      return () => {
        active = false;
      };
    }, [query, requestKey])
  );

  // Paginador
  const loadMoreData = async (): Promise<void> => {
    if (!fetched || fetched.key !== requestKey || !fetched.hasMore || loadingMore) return;

    const nextPage = fetched.page + 1;

    try {
      setLoadingMore(true);
      const { data } = await getLastIncomesWithPaginate({ take: PAGE_SIZE, page: nextPage, query });

      // Si mientras tanto cambió la petición, se descarta esta respuesta
      setFetched((prev) =>
        prev && prev.key === requestKey
          ? {
              ...prev,
              items: mergePages(prev.items, data.data),
              page: nextPage,
              hasMore: data.data.length > 0
            }
          : prev
      );
    } catch (e) {
      showError(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const updateList = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: LastIncomes }) => (
      <RenderItemIncome item={item} navigation={navigation} updateList={updateList} />
    ),
    [navigation, updateList]
  );

  const showFooterLoading = initialLoading || loadingMore;

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
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={<BarSearch />}
        ListFooterComponent={
          <View>{showFooterLoading ? <MyLoading testID="loading-footer" /> : null}</View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  textMuted: {
    textAlign: 'center'
  }
});
