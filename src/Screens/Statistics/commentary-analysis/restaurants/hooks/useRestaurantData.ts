import { useState, useMemo, useCallback } from 'react';
import { findExpensesBySubcategories } from '~/services/expenses';
import {
  buildRestaurantAnalysis,
  DateRangeKeys,
  RestaurantAnalysis,
  RestaurantExpenseInput,
  toDateKey
} from '~/utils/commentaryParser/restaurantAnalysis';
import { AnalysisFilters } from '../../components/FilterSelector';
import { showError } from '~/utils/showError';

interface UseRestaurantDataReturn {
  loading: boolean;
  analysis: RestaurantAnalysis;
  currentFilters: AnalysisFilters | null;
  loadData: (filters: AnalysisFilters) => Promise<void>;
  refreshData: () => Promise<void>;
}

/** Gastos y rango se guardan juntos para que el resumen mensual nunca use un rango viejo. */
interface LoadedData {
  expenses: RestaurantExpenseInput[];
  range: DateRangeKeys;
}

/**
 * Hook de la pantalla de restaurantes: trae los gastos de UNA subcategoría en un
 * rango de fechas y delega todo el análisis en buildRestaurantAnalysis (con tests).
 */
export const useRestaurantData = (): UseRestaurantDataReturn => {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<LoadedData | null>(null);
  const [currentFilters, setCurrentFilters] = useState<AnalysisFilters | null>(null);

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

      setLoaded({
        expenses: data.expenses.map((expense) => ({
          commentary: expense.commentary,
          cost: expense.cost,
          date: expense.date
        })),
        range: { start: toDateKey(filters.startDate), end: toDateKey(filters.endDate) }
      });
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (currentFilters) {
      await loadData(currentFilters);
    }
  }, [currentFilters, loadData]);

  const analysis = useMemo(
    () => buildRestaurantAnalysis(loaded?.expenses ?? [], loaded?.range),
    [loaded]
  );

  return { loading, analysis, currentFilters, loadData, refreshData };
};
