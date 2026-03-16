import { useState, useMemo, useCallback } from 'react';
import { ProductPrice } from '~/shared/types/utils/commentaryParser/product-analysis.types';
import { ProductSummary, GroupedProducts } from '../types';
import { findExpensesBySubcategories } from '~/services/expenses';
import { parseProductCommentary, findBestPrice } from '~/utils/commentaryParser/productParser';
import { AnalysisFilters } from '../../components/FilterSelector';
import { showError } from '~/utils/showError';

interface UseProductDataReturn {
  loading: boolean;
  parsedData: ProductPrice[];
  groupedProducts: GroupedProducts;
  completeSummaries: ProductSummary[];
  incompleteSummaries: ProductSummary[];
  currentFilters: AnalysisFilters | null;
  loadData: (filters: AnalysisFilters) => Promise<void>;
  refreshData: () => Promise<void>;
}

/**
 * Hook para manejar la carga, agrupación y análisis de datos de productos.
 * Encapsula toda la lógica de negocio relacionada con productos.
 */
export const useProductData = (): UseProductDataReturn => {
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ProductPrice[]>([]);
  const [currentFilters, setCurrentFilters] = useState<AnalysisFilters | null>(null);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const loadData = useCallback(async (filters: AnalysisFilters) => {
    if (!filters.subcategoryId) return;

    try {
      setLoading(true);
      setCurrentFilters(filters);
      const { data } = await findExpensesBySubcategories({
        subcategoriesId: [filters.subcategoryId],
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const parsed = data.expenses
        .map((expense: any) =>
          parseProductCommentary(expense.commentary, expense.cost, expense.date)
        )
        .filter((item): item is ProductPrice => item !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setParsedData(parsed);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (currentFilters) {
      await loadData(currentFilters);
    }
  }, [currentFilters, loadData]);

  // ── Agrupación por nombre normalizado ──────────────────────────────────────
  const groupedProducts: GroupedProducts = useMemo(() => {
    return parsedData.reduce((acc, item) => {
      const normalizedName = item.product
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      if (!acc[normalizedName]) {
        acc[normalizedName] = [];
      }
      acc[normalizedName].push(item);
      return acc;
    }, {} as GroupedProducts);
  }, [parsedData]);

  // ── Generación de summaries ─────────────────────────────────────────────────
  const allSummaries: ProductSummary[] = useMemo(() => {
    return Object.keys(groupedProducts).map((key) => {
      const items = groupedProducts[key];
      const { best, worst, savings } = findBestPrice(items, key);
      const completeItems = items.filter((i) => !i.isIncomplete);

      // Unidad mayoritaria: contar cuántos items tienen kg vs un
      const unitCounts = items.reduce(
        (acc, i) => {
          const u = i.unit || (i.isWeighed ? 'kg' : 'un');
          acc[u] = (acc[u] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const unit = (unitCounts.kg || 0) >= (unitCounts.un || 0) ? 'kg' : 'un';

      // Promedio solo sobre registros completos
      const avgPrice =
        completeItems.length > 0
          ? Math.round(
              completeItems.reduce((sum, i) => sum + i.pricePerKg, 0) / completeItems.length
            )
          : 0;

      // Tiendas únicas
      const stores = [...new Set(items.map((i) => i.store).filter(Boolean) as string[])];

      return {
        name: items[0].product,
        normalizedName: key,
        count: items.length,
        isWeighed: items[0].isWeighed ?? false,
        unit,
        avgPrice,
        best,
        worst,
        savings,
        totalCost: items.reduce((s, i) => s + i.cost, 0),
        stores
      };
    });
  }, [groupedProducts]);

  // Separar completos de incompletos
  const completeSummaries = useMemo(
    () => allSummaries.filter((s) => s.best !== null),
    [allSummaries]
  );

  const incompleteSummaries = useMemo(
    () => allSummaries.filter((s) => s.best === null),
    [allSummaries]
  );

  return {
    loading,
    parsedData,
    groupedProducts,
    completeSummaries,
    incompleteSummaries,
    currentFilters,
    loadData,
    refreshData
  };
};
