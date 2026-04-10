import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CachedCommentaryHistory,
  HistorySuggestion,
  RecentExpenseForSuggestion
} from '~/shared/types/screens/settings/commentary-templates.types';

const HISTORY_KEY_PREFIX = 'commentary_history_';
const MAX_CACHED_ENTRIES = 20;

// ============================================================
// HELPERS DE CLAVE
// ============================================================

const buildKey = (subcategoryId: number): string => `${HISTORY_KEY_PREFIX}${subcategoryId}`;

// ============================================================
// LECTURA
// ============================================================

/**
 * Obtiene el historial cacheado de una subcategoría.
 * Retorna array vacío si no hay cache.
 */
export const getCachedHistory = async (subcategoryId: number): Promise<HistorySuggestion[]> => {
  try {
    const raw = await AsyncStorage.getItem(buildKey(subcategoryId));
    // console.log('getCachedHistory', raw)
    if (!raw) return [];
    const parsed: CachedCommentaryHistory = JSON.parse(raw);
    return parsed.entries ?? [];
  } catch {
    return [];
  }
};

// ============================================================
// ESCRITURA
// ============================================================

/**
 * Guarda un nuevo comentario en el historial de la subcategoría.
 * Evita duplicados exactos y mantiene máximo MAX_CACHED_ENTRIES.
 */
export const saveCommentaryToHistory = async (
  subcategoryId: number,
  commentary: string,
  cost: number,
  date: string
): Promise<void> => {
  if (!commentary?.trim()) return;

  try {
    const existing = await getCachedHistory(subcategoryId);

    // Evitar duplicado exacto
    const isDuplicate = existing.some((e) => e.commentary.trim() === commentary.trim());
    if (isDuplicate) return;

    const newEntry: HistorySuggestion = {
      commentary: commentary.trim(),
      date,
      cost,
      source: 'cached'
    };

    // Más reciente primero, limitar tamaño
    const updated = [newEntry, ...existing].slice(0, MAX_CACHED_ENTRIES);

    const payload: CachedCommentaryHistory = {
      subcategoryId,
      entries: updated,
      savedAt: new Date().toISOString()
    };

    await AsyncStorage.setItem(buildKey(subcategoryId), JSON.stringify(payload));
  } catch {
    // Fallo silencioso — no bloquear la UI
  }
};

// ============================================================
// MERGE: backend + cache
// ============================================================

/**
 * Fusiona los comentarios del backend con el cache local.
 * Estrategia:
 *   1. Los del backend son "live" y van primero
 *   2. Los del cache que no estén ya en el backend se agregan al final
 *   3. Se eliminan duplicados (comparación de texto normalizado)
 *   4. Máximo MAX_SUGGESTIONS resultados
 */
export const mergeHistorySuggestions = (
  liveExpenses: RecentExpenseForSuggestion[],
  cached: HistorySuggestion[],
  maxSuggestions = 6
): HistorySuggestion[] => {
  const seen = new Set<string>();
  const result: HistorySuggestion[] = [];

  // Primero los del backend (más frescos y completos)
  for (const expense of liveExpenses) {
    if (!expense.commentary?.trim()) continue;
    const key = expense.commentary.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      commentary: expense.commentary.trim(),
      date: expense.date,
      cost: expense.cost,
      source: 'live'
    });
  }

  // Luego los del cache que no están ya
  for (const entry of cached) {
    if (!entry.commentary?.trim()) continue;
    const key = entry.commentary.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }

  return result.slice(0, maxSuggestions);
};

/**
 * Filtra sugerencias según lo que el usuario ya escribió.
 * Búsqueda case-insensitive en el texto del comentario.
 */
export const filterSuggestions = (
  suggestions: HistorySuggestion[],
  query: string
): HistorySuggestion[] => {
  if (!query?.trim()) return suggestions;
  const q = query.trim().toLowerCase();
  return suggestions.filter((s) => s.commentary.toLowerCase().includes(q));
};
