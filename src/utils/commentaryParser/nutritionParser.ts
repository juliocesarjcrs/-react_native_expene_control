/**
 * Parser de comentarios de nutrición
 * Ubicación: src/utils/commentaryParser/nutritionParser.ts
 *
 * Formato soportado:
 *   Semana {N} {NombreCentro}
 *   Semana {N} {NombreCentro} - {notas}
 *
 * Ejemplos reales:
 *   "Semana 6 Natural Body Center"
 *   "Semana 5 Natural Body Center"
 *   "Flora liv"  ← no matchea, retorna null
 */

import { NutritionData } from '~/shared/types/utils/commentaryParser/nutrition-analysis.types';

// ─────────────────────────────────────────────
// REGEX PATTERNS
// ─────────────────────────────────────────────

const PATTERNS = {
  // "Semana {N} {Centro}" con notas opcionales después de " - "
  weekCenter: /^semana\s+(\d+)\s+(.+?)(?:\s*-\s*(.+))?$/i
};

// ─────────────────────────────────────────────
// PARSER PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Parsea el comentario de un gasto de nutrición.
 * Retorna null si no sigue el patrón "Semana N Centro".
 */
export const parseNutritionCommentary = (
  commentary: string,
  cost: number,
  date: string
): NutritionData | null => {
  if (!commentary?.trim()) return null;

  try {
    const normalized = commentary.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    const match = normalized.match(PATTERNS.weekCenter);
    if (!match) return null;

    return {
      cost,
      date,
      weekNumber: parseInt(match[1]),
      center: match[2].trim(),
      notes: match[3]?.trim() || undefined
    };
  } catch (error) {
    console.error('Error parsing nutrition commentary:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// CALCULADORAS
// ─────────────────────────────────────────────

/** Costo promedio por semana en un centro dado */
export const getAvgCostPerWeek = (data: NutritionData[], center?: string): number => {
  const filtered = center
    ? data.filter((d) => d.center.toLowerCase().includes(center.toLowerCase()))
    : data;

  if (filtered.length === 0) return 0;
  const total = filtered.reduce((sum, d) => sum + d.cost, 0);
  return Math.round(total / filtered.length);
};
