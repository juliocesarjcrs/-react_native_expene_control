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
import { UnrecognizedExpense } from '~/shared/types/screens/Statistics/commentary-analysis/copago/copago-analysis.types';

// Utils
import { parseCopagoCommentary } from '~/utils/commentaryParser/copagoParser';
import { showError } from '~/utils/showError';

// ─────────────────────────────────────────────
// TIPOS DE RETORNO
// ─────────────────────────────────────────────

export interface CopagoServiceSummary {
  serviceType: string;
  displayName: string;
  totalCost: number;
  count: number;
  avgCost: number;
  /** Items del grupo — para drill-down al expandir */
  items: CopagoData[];
}

export interface UseCopagoDataReturn {
  loading: boolean;
  parsedData: CopagoData[];
  serviceSummaries: CopagoServiceSummary[];
  unrecognized: UnrecognizedExpense[];
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
  medico_domicilio: 'Médico domiciliario',
  otorrino: 'Otorrino',
  otro: 'Otro'
};

const buildServiceSummaries = (data: CopagoData[]): CopagoServiceSummary[] => {
  const map = new Map<string, { totalCost: number; items: CopagoData[] }>();

  for (const item of data) {
    const key = item.serviceType;
    const existing = map.get(key) ?? { totalCost: 0, items: [] };
    map.set(key, {
      totalCost: existing.totalCost + item.cost,
      items: [...existing.items, item]
    });
  }

  return Array.from(map.entries())
    .map(([serviceType, stats]) => ({
      serviceType,
      displayName: SERVICE_DISPLAY_NAMES[serviceType] ?? serviceType,
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
  const [unrecognized, setUnrecognized] = useState<UnrecognizedExpense[]>([]);
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
      const failed: UnrecognizedExpense[] = [];

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
    unrecognized,
    currentFilters,
    totalCost,
    loadData,
    refreshData
  };
};
