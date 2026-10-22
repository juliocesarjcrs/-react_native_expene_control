/**
 * Hook de datos para CopagoAnalysisScreen
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/hooks/useCopagoData.ts
 */

import { useState, useCallback } from 'react';

// Services
import { findExpensesBySubcategories } from '~/services/expenses';

// Types
import {
  CopagoData,
  CopagoSeriesStats
} from '~/shared/types/utils/commentaryParser/copago-analysis.types';
import { AnalysisFilters } from '../../components/FilterSelector';
import { ExpenseToEdit } from '~/shared/types/screens/Statistics/commentary-analysis/components/edit-commentary-modal.types';

// Utils — siempre desde el índice (regla del README de commentaryParser)
import { parseCopagoCommentary, getSeriesStats } from '~/utils/commentaryParser';
import { showError } from '~/utils/showError';

// ─────────────────────────────────────────────
// TIPOS DE RETORNO
// ─────────────────────────────────────────────

export interface CopagoServiceSummary {
  /** Especialidad o grupo de acto: 'reumatologia', 'laboratorio', 'examenes'… */
  groupKey: string;
  displayName: string;
  totalCost: number;
  count: number;
  avgCost: number;
  /** Items del grupo — para drill-down al expandir */
  items: CopagoData[];
}

export interface UseCopagoDataReturn {
  loading: boolean;
  unrecognized: ExpenseToEdit[];
  parsedData: CopagoData[];
  serviceSummaries: CopagoServiceSummary[];
  /** Citas/sesiones numeradas por paciente + especialidad, separadas en ciclos */
  seriesStats: CopagoSeriesStats[];
  currentFilters: AnalysisFilters | null;
  totalCost: number;
  loadData: (filters: AnalysisFilters) => Promise<void>;
  refreshData: () => Promise<void>;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Agrupa por especialidad (o por acto si no tiene). Ya no existe el grupo "Otro". */
const buildServiceSummaries = (data: CopagoData[]): CopagoServiceSummary[] => {
  const map = new Map<string, { label: string; totalCost: number; items: CopagoData[] }>();

  for (const item of data) {
    const existing = map.get(item.groupKey) ?? { label: item.groupLabel, totalCost: 0, items: [] };
    existing.totalCost += item.cost;
    existing.items.push(item);
    map.set(item.groupKey, existing);
  }

  return Array.from(map.entries())
    .map(([groupKey, stats]) => ({
      groupKey,
      displayName: stats.label,
      totalCost: stats.totalCost,
      count: stats.items.length,
      avgCost: Math.round(stats.totalCost / stats.items.length),
      items: stats.items
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
};

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export const useCopagoData = (): UseCopagoDataReturn => {
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<CopagoData[]>([]);
  const [serviceSummaries, setServiceSummaries] = useState<CopagoServiceSummary[]>([]);
  const [seriesStats, setSeriesStats] = useState<CopagoSeriesStats[]>([]);
  const [unrecognized, setUnrecognized] = useState<ExpenseToEdit[]>([]);
  const [currentFilters, setCurrentFilters] = useState<AnalysisFilters | null>(null);
  const [totalCost, setTotalCost] = useState(0);

  const fetchAndParse = useCallback(async (filters: AnalysisFilters) => {
    if (!filters.subcategoryId) return;

    setLoading(true);
    setCurrentFilters(filters);

    try {
      const { data } = await findExpensesBySubcategories({
        subcategoriesId: [filters.subcategoryId],
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const parsed: CopagoData[] = [];
      const failed: ExpenseToEdit[] = [];

      for (const expense of data.expenses) {
        const result = parseCopagoCommentary(expense.commentary ?? '', expense.cost, expense.date);
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

      const sortedParsed = [...parsed].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setParsedData(sortedParsed);
      setServiceSummaries(buildServiceSummaries(sortedParsed));
      setSeriesStats(getSeriesStats(sortedParsed));
      setUnrecognized(failed);
      setTotalCost(sortedParsed.reduce((sum, item) => sum + item.cost, 0));
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(
    async (filters: AnalysisFilters) => fetchAndParse(filters),
    [fetchAndParse]
  );

  const refreshData = useCallback(async () => {
    if (currentFilters) await fetchAndParse(currentFilters);
  }, [currentFilters, fetchAndParse]);

  return {
    loading,
    parsedData,
    serviceSummaries,
    seriesStats,
    unrecognized,
    currentFilters,
    totalCost,
    loadData,
    refreshData
  };
};
