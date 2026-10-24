/**
 * Hook de datos para CopagoAnalysisScreen
 * Ubicación: src/Screens/Statistics/commentary-analysis/copago/hooks/useCopagoData.ts
 *
 * Se parsea UNA vez (allParsed). Todo lo que ve la pantalla se deriva de allParsed
 * filtrado por el paciente elegido, así cambiar de paciente no vuelve a llamar al backend.
 */

import { useState, useCallback, useMemo } from 'react';

// Services
import { findExpensesBySubcategories } from '~/services/expenses';

// Types
import {
  CopagoData,
  CopagoMonthlySpending,
  CopagoPendingSummary,
  CopagoSeriesStats
} from '~/shared/types/utils/commentaryParser/copago-analysis.types';
import { AnalysisFilters } from '../../components/FilterSelector';
import { ExpenseToEdit } from '~/shared/types/screens/Statistics/commentary-analysis/components/edit-commentary-modal.types';

// Utils — siempre desde el índice (regla del README de commentaryParser)
import {
  parseCopagoCommentary,
  getSeriesStats,
  getMonthlySpending,
  getPendingCycles,
  getPatientOptions
} from '~/utils/commentaryParser';
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

export interface CopagoPatientOption {
  name: string;
  count: number;
}

export interface UseCopagoDataReturn {
  loading: boolean;
  /** Los registros sin formato NO se filtran por paciente: no se sabe de quién son */
  unrecognized: ExpenseToEdit[];
  /** Registros reconocidos, ya filtrados por el paciente elegido */
  parsedData: CopagoData[];
  serviceSummaries: CopagoServiceSummary[];
  /** Citas/sesiones numeradas por paciente + especialidad, separadas en ciclos */
  seriesStats: CopagoSeriesStats[];
  /** Gasto por mes y paciente (meses sin gasto incluidos con 0) */
  monthlySpending: CopagoMonthlySpending[];
  /** Lo que falta por pagar en terapias abiertas con total */
  pendingSummary: CopagoPendingSummary;
  /** Pacientes presentes en los datos (para el selector) */
  patients: CopagoPatientOption[];
  /** null = Todos */
  selectedPatient: string | null;
  setSelectedPatient: (patient: string | null) => void;
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
  const [allParsed, setAllParsed] = useState<CopagoData[]>([]);
  const [unrecognized, setUnrecognized] = useState<ExpenseToEdit[]>([]);
  const [currentFilters, setCurrentFilters] = useState<AnalysisFilters | null>(null);
  const [requestedPatient, setSelectedPatient] = useState<string | null>(null);

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

      setAllParsed(
        [...parsed].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
      setUnrecognized(failed);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Derivados del paciente elegido ─────────────────────────────────────
  const patients = useMemo(() => getPatientOptions(allParsed), [allParsed]);

  // Si el paciente elegido ya no aparece (otro rango o subcategoría), vuelve a "Todos"
  const selectedPatient = patients.some((p) => p.name === requestedPatient)
    ? requestedPatient
    : null;

  const parsedData = useMemo(
    () => (selectedPatient ? allParsed.filter((d) => d.patient === selectedPatient) : allParsed),
    [allParsed, selectedPatient]
  );

  const serviceSummaries = useMemo(() => buildServiceSummaries(parsedData), [parsedData]);
  const seriesStats = useMemo(() => getSeriesStats(parsedData), [parsedData]);
  const pendingSummary = useMemo(() => getPendingCycles(seriesStats), [seriesStats]);
  const monthlySpending = useMemo(() => getMonthlySpending(parsedData), [parsedData]);
  const totalCost = useMemo(
    () => parsedData.reduce((sum, item) => sum + item.cost, 0),
    [parsedData]
  );

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
    monthlySpending,
    pendingSummary,
    patients,
    selectedPatient,
    setSelectedPatient,
    unrecognized,
    currentFilters,
    totalCost,
    loadData,
    refreshData
  };
};
