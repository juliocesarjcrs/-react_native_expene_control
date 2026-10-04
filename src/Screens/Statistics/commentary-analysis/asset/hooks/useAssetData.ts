/**
 * Hook de datos para AssetAnalysisScreen
 * Ubicación: src/Screens/Statistics/commentary-analysis/asset/hooks/useAssetData.ts
 *
 * Solo hace las llamadas (gastos, vínculo guardado, ingresos) y delega todo el cálculo
 * en analyzeAsset (puro y con tests).
 */
import { useState, useCallback } from 'react';

// Services
import { findExpensesBySubcategories } from '~/services/expenses';

// Types
import { MultiAnalysisFilters } from '../../components/MultiSubcategoryFilter';
import { ExpenseToEdit } from '~/shared/types/screens/Statistics/commentary-analysis/components/edit-commentary-modal.types';
import { AssetMetrics } from '~/shared/types/utils/commentaryParser/asset-metrics.types';

// Utils
import { analyzeAsset, RawRecord, toISODate } from '~/utils/commentaryParser/assetData.utils';
import {
  AssetLink,
  getAssetLink,
  saveAssetLink,
  clearAssetLink
} from '~/utils/commentary/assetLinks.utils';
import { showError } from '~/utils/showError';
import { fetchAssetIncomes } from './assetIncomes.adapter';

export interface UseAssetDataReturn {
  loading: boolean;
  metrics: AssetMetrics | null;
  unrecognized: ExpenseToEdit[];
  /** Vínculo guardado con la categoría de ingreso; null = aún no se ha preguntado */
  link: AssetLink | null;
  /** Hay datos cargados pero falta preguntar cuál es la categoría de ingreso del bien */
  needsLink: boolean;
  /** Falló la carga de ingresos (se muestra el resto del análisis igual) */
  incomesFailed: boolean;
  currentFilters: MultiAnalysisFilters | null;
  loadData: (filters: MultiAnalysisFilters) => Promise<void>;
  refreshData: () => Promise<void>;
  saveLink: (link: AssetLink) => Promise<void>;
  clearLink: () => Promise<void>;
}

export const useAssetData = (): UseAssetDataReturn => {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<AssetMetrics | null>(null);
  const [unrecognized, setUnrecognized] = useState<ExpenseToEdit[]>([]);
  const [link, setLink] = useState<AssetLink | null>(null);
  const [incomesFailed, setIncomesFailed] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<MultiAnalysisFilters | null>(null);

  const fetchAndAnalyze = useCallback(async (filters: MultiAnalysisFilters) => {
    if (filters.subcategoryIds.length === 0) return;

    setLoading(true);
    setCurrentFilters(filters);
    setIncomesFailed(false);

    try {
      const [{ data }, storedLink] = await Promise.all([
        findExpensesBySubcategories({
          subcategoriesId: filters.subcategoryIds,
          startDate: filters.startDate,
          endDate: filters.endDate
        }),
        getAssetLink(filters.subcategoryIds)
      ]);
      setLink(storedLink);

      // Los ingresos son opcionales: si fallan, se sigue con costo, deuda y gastos
      let incomes: RawRecord[] = [];
      if (storedLink?.kind === 'income') {
        try {
          incomes = await fetchAssetIncomes(
            storedLink.categoryId,
            filters.startDate,
            filters.endDate
          );
        } catch (error) {
          setIncomesFailed(true);
          showError(error);
        }
      }

      const result = analyzeAsset({
        expenses: data.expenses,
        incomes,
        asOf: toISODate(new Date()),
        propertyAliases: storedLink?.kind === 'income' ? storedLink.aliases : undefined
      });
      setMetrics(result.metrics);
      setUnrecognized(result.unrecognized);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(
    async (filters: MultiAnalysisFilters) => fetchAndAnalyze(filters),
    [fetchAndAnalyze]
  );

  const refreshData = useCallback(async () => {
    if (currentFilters) await fetchAndAnalyze(currentFilters);
  }, [currentFilters, fetchAndAnalyze]);

  const saveLink = useCallback(
    async (next: AssetLink) => {
      if (!currentFilters) return;
      try {
        await saveAssetLink(currentFilters.subcategoryIds, next);
      } catch (error) {
        showError(error);
        return;
      }
      await fetchAndAnalyze(currentFilters);
    },
    [currentFilters, fetchAndAnalyze]
  );

  const clearLink = useCallback(async () => {
    if (!currentFilters) return;
    try {
      await clearAssetLink(currentFilters.subcategoryIds);
    } catch (error) {
      showError(error);
      return;
    }
    await fetchAndAnalyze(currentFilters);
  }, [currentFilters, fetchAndAnalyze]);

  return {
    loading,
    metrics,
    unrecognized,
    link,
    needsLink: metrics !== null && !loading && link === null,
    incomesFailed,
    currentFilters,
    loadData,
    refreshData,
    saveLink,
    clearLink
  };
};
