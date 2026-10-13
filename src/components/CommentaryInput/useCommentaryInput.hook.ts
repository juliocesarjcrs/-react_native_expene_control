import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SubcategoryTemplateConfig,
  HistorySuggestion,
  RecentExpenseForSuggestion,
  CommentaryValidationResult
} from '~/shared/types/screens/settings/commentary-templates.types';
import { validateCommentary } from '../../utils/commentary/commentaryTemplates.utils';
import {
  getCachedHistory,
  mergeHistorySuggestions,
  filterSuggestions
} from '../../utils/commentary/commentaryHistory.utils';
import { getTemplateConfig } from '../../utils/commentary/templateStorage.utils';

interface UseCommentaryInputProps {
  subcategoryId: number | null;
  subcategoryName?: string;
  categoryName?: string;
  recentExpenses?: RecentExpenseForSuggestion[];
  currentValue: string;
}

interface UseCommentaryInputReturn {
  templateConfig: SubcategoryTemplateConfig | null;
  filteredSuggestions: HistorySuggestion[];
  showSuggestions: boolean;
  validation: CommentaryValidationResult;
  loading: boolean;
  hideSuggestions: () => void;
  openSuggestions: () => void;
}

type CachedHistory = Awaited<ReturnType<typeof getCachedHistory>>;

const DEBOUNCE_MS = 200;

// Referencias estables (evitan invalidar los useMemo en cada render)
const NO_EXPENSES: RecentExpenseForSuggestion[] = [];
const EMPTY_CACHE = [] as unknown as CachedHistory;
const NEUTRAL_VALIDATION: CommentaryValidationResult = { state: 'neutral' };

export const useCommentaryInput = ({
  subcategoryId,
  subcategoryName,
  categoryName,
  recentExpenses = NO_EXPENSES,
  currentValue
}: UseCommentaryInputProps): UseCommentaryInputReturn => {
  // Cada resultado guarda la clave para la que se cargó. Si la clave actual
  // no coincide, el dato se considera inexistente (sin tener que "limpiar" estado).
  const [configState, setConfigState] = useState<{
    key: string;
    config: SubcategoryTemplateConfig | null;
  } | null>(null);
  const [cacheState, setCacheState] = useState<{
    subcategoryId: number;
    cached: CachedHistory;
  } | null>(null);
  const [debouncedValue, setDebouncedValue] = useState(currentValue);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const configKey =
    subcategoryId && subcategoryName && categoryName
      ? `${subcategoryId}|${subcategoryName}|${categoryName}`
      : null;

  // ── Cargar config cuando cambia la subcategoría ──
  useEffect(() => {
    if (!configKey || !subcategoryId || !subcategoryName || !categoryName) return;

    let cancelled = false;

    const load = async () => {
      try {
        const config = await getTemplateConfig(subcategoryId, subcategoryName, categoryName);
        if (!cancelled) setConfigState({ key: configKey, config });
      } catch {
        // Si falla, se continúa sin plantilla (y se termina el loading)
        if (!cancelled) setConfigState({ key: configKey, config: null });
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [configKey, subcategoryId, subcategoryName, categoryName]);

  // ── Cargar historial cacheado (y recargarlo cuando llegan recentExpenses) ──
  useEffect(() => {
    if (!subcategoryId) return;

    let cancelled = false;

    const load = async () => {
      try {
        const cached = await getCachedHistory(subcategoryId);
        if (!cancelled) setCacheState({ subcategoryId, cached });
      } catch {
        if (!cancelled) setCacheState({ subcategoryId, cached: EMPTY_CACHE });
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [subcategoryId, recentExpenses]);

  // ── Debounce del valor escrito ──
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(currentValue), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [currentValue]);

  // ── Estado derivado ──
  const templateConfig = configState?.key === configKey ? configState.config : null;
  const loading = configKey !== null && configState?.key !== configKey;

  const cached = cacheState?.subcategoryId === subcategoryId ? cacheState.cached : EMPTY_CACHE;

  const allSuggestions = useMemo(
    () => (subcategoryId ? mergeHistorySuggestions(recentExpenses, cached) : []),
    [subcategoryId, recentExpenses, cached]
  );

  const filteredSuggestions = useMemo(
    () => filterSuggestions(allSuggestions, debouncedValue),
    [allSuggestions, debouncedValue]
  );

  const validation = useMemo<CommentaryValidationResult>(
    () =>
      templateConfig ? validateCommentary(debouncedValue, templateConfig) : NEUTRAL_VALIDATION,
    [templateConfig, debouncedValue]
  );

  const hideSuggestions = useCallback(() => setShowSuggestions(false), []);

  // Abre el dropdown solo si ya hay sugerencias filtradas
  const hasSuggestions = filteredSuggestions.length > 0;
  const openSuggestions = useCallback(() => {
    if (hasSuggestions) setShowSuggestions(true);
  }, [hasSuggestions]);

  return {
    templateConfig,
    filteredSuggestions,
    showSuggestions,
    validation,
    loading,
    hideSuggestions,
    openSuggestions
  };
};
