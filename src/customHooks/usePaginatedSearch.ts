// src/hooks/usePaginatedSearch.ts
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { showError } from '~/utils/showError';

export type FetchParams = { take: number; page: number; query: string | null };
type Fetcher<T> = (params: FetchParams) => Promise<T[]>;

type Fetched<T> = {
  key: string;
  items: T[];
  page: number;
  hasMore: boolean;
};

const mergePages = <T extends { id: number }>(current: T[], next: T[]): T[] => {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...next.filter((item) => !seen.has(item.id))];
};

export function usePaginatedSearch<T extends { id: number }>(
  fetcher: Fetcher<T>,
  query: string | null,
  pageSize: number
) {
  const [reloadToken, setReloadToken] = useState(0);
  const [fetched, setFetched] = useState<Fetched<T> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const requestKey = `${query ?? ''}|${reloadToken}`;
  const initialLoading = fetched?.key !== requestKey;
  const items = fetched?.items ?? [];

  // Página 1: al enfocar, al cambiar la búsqueda o al recargar
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadFirstPage = async (): Promise<void> => {
        try {
          const data = await fetcher({ take: pageSize, page: 1, query });
          if (active) {
            setFetched({ key: requestKey, items: data, page: 1, hasMore: data.length > 0 });
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
    }, [fetcher, query, requestKey, pageSize])
  );

  const loadMore = useCallback(async (): Promise<void> => {
    if (!fetched || fetched.key !== requestKey || !fetched.hasMore) return;
    if (loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = fetched.page + 1;

    try {
      const data = await fetcher({ take: pageSize, page: nextPage, query });
      // Si mientras tanto cambió la petición, se descarta la respuesta
      setFetched((prev) =>
        prev && prev.key === requestKey
          ? {
              ...prev,
              items: mergePages(prev.items, data),
              page: nextPage,
              hasMore: data.length > 0
            }
          : prev
      );
    } catch (e) {
      showError(e);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetched, fetcher, pageSize, query, requestKey]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  return { items, initialLoading, loadingMore, loadMore, reload };
}
