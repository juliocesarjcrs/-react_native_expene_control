/**
 * Hook de datos para VacationAnalysisScreen
 * Ubicación: src/Screens/Statistics/commentary-analysis/vacation/hooks/useVacationData.ts
 */

import { useState, useCallback } from 'react';

// Services
import { findExpensesBySubcategories } from '~/services/expenses';

// Types
import {
  VacationData,
  VacationFlight,
  VacationDestinationSummary,
  LodgingComparison
} from '~/shared/types/utils/commentaryParser/vacation-analysis.types';
import { MultiAnalysisFilters } from '../../components/MultiSubcategoryFilter';
import { ExpenseToEdit } from '~/shared/types/screens/Statistics/commentary-analysis/components/edit-commentary-modal.types';

// Utils
import {
  parseVacationCommentary,
  getDestinationSummaries,
  getLodgingComparisons
} from '~/utils/commentaryParser/vacationParser';
import { showError } from '~/utils/showError';

// ─────────────────────────────────────────────
// TIPOS DE RETORNO
// ─────────────────────────────────────────────

export interface UseVacationDataReturn {
  loading: boolean;
  parsedData: VacationData[];
  destinationSummaries: VacationDestinationSummary[];
  lodgingComparisons: LodgingComparison[];
  flights: VacationFlight[];
  unrecognized: ExpenseToEdit[];
  currentFilters: MultiAnalysisFilters | null;
  totalCost: number;
  loadData: (filters: MultiAnalysisFilters) => Promise<void>;
  refreshData: () => Promise<void>;
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export const useVacationData = (): UseVacationDataReturn => {
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<VacationData[]>([]);
  const [destinationSummaries, setDestinationSummaries] = useState<VacationDestinationSummary[]>(
    []
  );
  const [lodgingComparisons, setLodgingComparisons] = useState<LodgingComparison[]>([]);
  const [flights, setFlights] = useState<VacationFlight[]>([]);
  const [unrecognized, setUnrecognized] = useState<ExpenseToEdit[]>([]);
  const [currentFilters, setCurrentFilters] = useState<MultiAnalysisFilters | null>(null);
  const [totalCost, setTotalCost] = useState(0);

  const fetchAndParse = useCallback(async (filters: MultiAnalysisFilters) => {
    // Requiere al menos una subcategoría seleccionada
    if (filters.subcategoryIds.length === 0) return;

    setLoading(true);
    setCurrentFilters(filters);

    try {
      const { data } = await findExpensesBySubcategories({
        subcategoriesId: filters.subcategoryIds, // ← array directo, sin wrappear
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const parsed: VacationData[] = [];
      const failed: ExpenseToEdit[] = [];

      for (const expense of data.expenses) {
        const result = parseVacationCommentary(
          expense.commentary ?? '',
          expense.cost,
          expense.date
        );
        if (result !== null) {
          parsed.push(result);
        } else {
          failed.push({
            id: expense.id,
            commentary: expense.commentary ?? '',
            cost: expense.cost,
            date: expense.date
          });
        }
      }

      const sorted = [...parsed].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setParsedData(sorted);
      setDestinationSummaries(getDestinationSummaries(sorted));
      setLodgingComparisons(getLodgingComparisons(sorted));
      setFlights(sorted.filter((d): d is VacationFlight => d.type === 'flight'));
      setUnrecognized(failed);
      setTotalCost(sorted.reduce((sum, item) => sum + item.cost, 0));
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(
    async (filters: MultiAnalysisFilters) => fetchAndParse(filters),
    [fetchAndParse]
  );

  const refreshData = useCallback(async () => {
    if (currentFilters) await fetchAndParse(currentFilters);
  }, [currentFilters, fetchAndParse]);

  return {
    loading,
    parsedData,
    destinationSummaries,
    lodgingComparisons,
    flights,
    unrecognized,
    currentFilters,
    totalCost,
    loadData,
    refreshData
  };
};
