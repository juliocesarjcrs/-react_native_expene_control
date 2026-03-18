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
  /** Config de plantilla para la subcategoría actual */
  templateConfig: SubcategoryTemplateConfig | null;
  /** Sugerencias filtradas para el dropdown */
  filteredSuggestions: HistorySuggestion[];
  /** Si mostrar el dropdown de historial */
  showSuggestions: boolean;
  /** Resultado de validación del texto actual */
  validation: CommentaryValidationResult;
  /** Si está cargando la config/historial */
  loading: boolean;
  /** Cerrar el dropdown */
  hideSuggestions: () => void;
  /** Mostrar el dropdown (al hacer focus) */
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
      console.log('[useCommentaryInput] guard falló:', {
        subcategoryId,
        subcategoryName,
        categoryName
      });
      setTemplateConfig(null);
      setAllSuggestions([]);
      return;
    }

    console.log('[useCommentaryInput] cargando config para:', {
      subcategoryId,
      subcategoryName,
      categoryName
    });

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

        // Fusionar backend (live) con cache
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

  // ── Actualizar sugerencias del backend cuando lleguen ──
  useEffect(() => {
    if (!subcategoryId || recentExpenses.length === 0) return;

    getCachedHistory(subcategoryId).then((cached) => {
      const merged = mergeHistorySuggestions(recentExpenses, cached);
      setAllSuggestions(merged);
      // Reaplicar filtro actual
      setFilteredSuggestions(filterSuggestions(merged, currentValue));
    });
  }, [recentExpenses]);

  // ── Filtrar sugerencias + validar con debounce ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      // Filtrar historial
      setFilteredSuggestions(filterSuggestions(allSuggestions, currentValue));

      // Validar
      if (templateConfig) {
        setValidation(validateCommentary(currentValue, templateConfig));
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentValue, allSuggestions, templateConfig]);

  const hideSuggestions = useCallback(() => setShowSuggestions(false), []);

  const openSuggestions = useCallback(() => {
    if (allSuggestions.length > 0) setShowSuggestions(true);
  }, [allSuggestions]);

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
