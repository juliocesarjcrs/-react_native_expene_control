/**
 * Hook de datos para CopagoAnalysisScreen
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/hooks/useCopagoData.ts
 */

import { useState, useCallback } from 'react';

// Services
import { findExpensesBySubcategories } from '~/services/expenses';

// Types
import { CopagoData } from '~/shared/types/utils/commentaryParser/copago-analysis.types';
import { AnalysisFilters } from '../../components/FilterSelector';

// Utils
import { parseCopagoCommentary } from '~/utils/commentaryParser/copagoParser';
import { showError } from '~/utils/showError';

// ─────────────────────────────────────────────
// TIPOS DE RETORNO
// ─────────────────────────────────────────────

export interface CopagoServiceSummary {
  serviceType: string; // "terapia_fisica", "consulta", etc.
  displayName: string; // "Terapia Física", "Consulta"
  totalCost: number;
  count: number;
  avgCost: number;
}

export interface UseCopagoDataReturn {
  loading: boolean;
  parsedData: CopagoData[];
  serviceSummaries: CopagoServiceSummary[];
  currentFilters: AnalysisFilters | null;
  totalCost: number;
  loadData: (filters: AnalysisFilters) => Promise<void>;
  refreshData: () => Promise<void>;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  terapia_fisica: 'Terapia Física',
  terapia_ocupacional: 'Terapia Ocupacional',
  consulta: 'Consulta',
  control: 'Control',
  psicologia: 'Psicología',
  psiquiatra: 'Psiquiatría',
  fisiatria: 'Fisiatría',
  neurocirugia: 'Neurocirugía',
  otro: 'Otro'
};

const buildServiceSummaries = (data: CopagoData[]): CopagoServiceSummary[] => {
  const map = new Map<string, { totalCost: number; count: number }>();

  for (const item of data) {
    const key = item.serviceType;
    const existing = map.get(key) ?? { totalCost: 0, count: 0 };
    map.set(key, {
      totalCost: existing.totalCost + item.cost,
      count: existing.count + 1
    });
  }

  return Array.from(map.entries())
    .map(([serviceType, stats]) => ({
      serviceType,
      displayName: SERVICE_DISPLAY_NAMES[serviceType] ?? serviceType,
      totalCost: stats.totalCost,
      count: stats.count,
      avgCost: Math.round(stats.totalCost / stats.count)
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

      const parsed = data.expenses
        .map((expense: any) =>
          parseCopagoCommentary(expense.commentary, expense.cost, expense.date)
        )
        .filter((item): item is CopagoData => item !== null)
        .sort(
          (a: CopagoData, b: CopagoData) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      setParsedData(parsed);
      setServiceSummaries(buildServiceSummaries(parsed));
      setTotalCost(parsed.reduce((sum: number, item: CopagoData) => sum + item.cost, 0));
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(
    async (filters: AnalysisFilters) => {
      await fetchAndParse(filters);
    },
    [fetchAndParse]
  );

  const refreshData = useCallback(async () => {
    if (currentFilters) await fetchAndParse(currentFilters);
  }, [currentFilters, fetchAndParse]);

  return {
    loading,
    parsedData,
    serviceSummaries,
    currentFilters,
    totalCost,
    loadData,
    refreshData
  };
};
