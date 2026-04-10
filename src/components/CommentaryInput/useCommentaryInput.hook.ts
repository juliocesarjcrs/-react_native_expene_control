import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SubcategoryTemplateConfig,
  HistorySuggestion,
  RecentExpenseForSuggestion,
  CommentaryValidationResult
} from '~/shared/types/screens/settings/commentary-templates.types';
import {
  getDefaultTemplateConfig,
  validateCommentary
} from '../../utils/commentary/commentaryTemplates.utils';
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

const DEBOUNCE_MS = 200;

export const useCommentaryInput = ({
  subcategoryId,
  subcategoryName,
  categoryName,
  recentExpenses = [],
  currentValue
}: UseCommentaryInputProps): UseCommentaryInputReturn => {
  const [templateConfig, setTemplateConfig] = useState<SubcategoryTemplateConfig | null>(null);
  const [allSuggestions, setAllSuggestions] = useState<HistorySuggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<HistorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validation, setValidation] = useState<CommentaryValidationResult>({ state: 'neutral' });
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Cargar config + historial cuando cambia la subcategoría ──
  useEffect(() => {
    if (!subcategoryId || !subcategoryName || !categoryName) {
      setTemplateConfig(null);
      setAllSuggestions([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [config, cached] = await Promise.all([
          getTemplateConfig(subcategoryId, subcategoryName, categoryName),
          getCachedHistory(subcategoryId)
        ]);

        if (cancelled) return;

        setTemplateConfig(config);

        const merged = mergeHistorySuggestions(recentExpenses, cached);
        setAllSuggestions(merged);
        setFilteredSuggestions(merged);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [subcategoryId, subcategoryName, categoryName]);

  // ── Actualizar sugerencias cuando lleguen recentExpenses del backend ──
  useEffect(() => {
    if (!subcategoryId) return;

    getCachedHistory(subcategoryId).then((cached) => {
      const merged = mergeHistorySuggestions(recentExpenses, cached);
      setAllSuggestions(merged);
      setFilteredSuggestions(filterSuggestions(merged, currentValue));
    });
  }, [recentExpenses]);

  // ── Filtrar sugerencias + validar con debounce ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setFilteredSuggestions(filterSuggestions(allSuggestions, currentValue));

      if (templateConfig) {
        setValidation(validateCommentary(currentValue, templateConfig));
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentValue, allSuggestions, templateConfig]);

  const hideSuggestions = useCallback(() => setShowSuggestions(false), []);

  // FIX: abrir dropdown si hay sugerencias YA filtradas, no allSuggestions
  // Evita que no abra cuando allSuggestions aún está vacío al hacer focus
  const openSuggestions = useCallback(() => {
    if (filteredSuggestions.length > 0) setShowSuggestions(true);
  }, [filteredSuggestions]);

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
