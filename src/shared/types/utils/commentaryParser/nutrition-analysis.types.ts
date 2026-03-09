/**
 * Tipos para el parser de comentarios de nutrición
 * Ubicación: src/shared/types/utils/commentaryParser/nutrition-analysis.types.ts
 *
 * Formato soportado:
 *   Semana {N} {NombreCentro}
 *   Semana {N} {NombreCentro} - {notas}
 *
 * Ejemplos reales:
 *   "Semana 6 Natural Body Center"
 *   "Semana 5 Natural Body Center"
 *   "Flora liv"   ← no matchea, queda libre
 */

export interface NutritionData {
  cost: number;
  date: string;

  weekNumber: number; // 6
  center: string; // "Natural Body Center"

  notes?: string;
}
