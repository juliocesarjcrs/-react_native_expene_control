/**
 * Parser de comentarios de deportes
 * Ubicación: src/utils/commentaryParser/sportsParser.ts
 *
 * Formatos soportados:
 *   Mensualidad {Mes} ({deporte})
 *   Arbitraje {descripcion}
 *   Cancha {lugar} {deporte}
 *   {ítem} {deporte}   ← uniforme, zapatillas, etc.
 *
 * Ejemplos reales:
 *   "Mensualidad Feb (futsal)"
 *   "Arbitraje Futsal Amistoso"
 *   "Cancha Canaan futbol 8"
 *   "Uniforme ProSport Futsal"
 */

import {
  SportsData,
  SportsExpenseType
} from '~/shared/types/utils/commentaryParser/sports-analysis.types';

// ─────────────────────────────────────────────
// REGEX PATTERNS
// ─────────────────────────────────────────────

const PATTERNS = {
  // "Mensualidad Feb (futsal)" o "Mensualidad Feb futsal"
  monthly: /^mensualidad\s+(\w+)(?:\s+\(([^)]+)\)|\s+(.+))?$/i,

  // "Arbitraje Futsal Amistoso"
  referee: /^arbitraje\s+(.+)$/i,

  // "Cancha Canaan futbol 8"
  court: /^cancha\s+(\w+)(?:\s+(.+))?$/i,

  // Palabras clave de equipamiento
  equipment:
    /^(uniforme|zapatillas?|guayos?|camiseta|pantaloneta|rodillera|guantes?|raqueta)\s+(.+)?$/i
};

// Palabras que contienen nombres de deportes comunes
const SPORT_KEYWORDS = [
  'futsal',
  'futbol',
  'fútbol',
  'tenis',
  'ciclismo',
  'natacion',
  'natación',
  'baloncesto',
  'voleibol',
  'atletismo',
  'yoga',
  'crossfit'
];

const extractSport = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  return SPORT_KEYWORDS.find((s) => lower.includes(s));
};

// ─────────────────────────────────────────────
// PARSER PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Parsea el comentario de un gasto de deportes.
 * Retorna null si no sigue ningún patrón reconocido.
 */
export const parseSportsCommentary = (
  commentary: string,
  cost: number,
  date: string
): SportsData | null => {
  if (!commentary?.trim()) return null;

  try {
    const normalized = commentary.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // ── 1. Mensualidad ────────────────────────────────────────────────────
    const monthlyMatch = normalized.match(PATTERNS.monthly);
    if (monthlyMatch) {
      const sportRaw = monthlyMatch[2] ?? monthlyMatch[3];
      return {
        cost,
        date,
        expenseType: 'mensualidad',
        month: monthlyMatch[1],
        sport: sportRaw?.trim(),
        description: normalized
      };
    }

    // ── 2. Arbitraje ──────────────────────────────────────────────────────
    const refereeMatch = normalized.match(PATTERNS.referee);
    if (refereeMatch) {
      const desc = refereeMatch[1].trim();
      return {
        cost,
        date,
        expenseType: 'arbitraje',
        sport: extractSport(desc),
        description: desc
      };
    }

    // ── 3. Cancha ─────────────────────────────────────────────────────────
    const courtMatch = normalized.match(PATTERNS.court);
    if (courtMatch) {
      const rest = courtMatch[2]?.trim() ?? '';
      return {
        cost,
        date,
        expenseType: 'cancha',
        location: courtMatch[1],
        sport: rest ? (extractSport(rest) ?? rest) : undefined,
        description: normalized
      };
    }

    // ── 4. Equipamiento ───────────────────────────────────────────────────
    const equipMatch = normalized.match(PATTERNS.equipment);
    if (equipMatch) {
      return {
        cost,
        date,
        expenseType: 'equipamiento',
        sport: equipMatch[2] ? extractSport(equipMatch[2]) : undefined,
        description: normalized
      };
    }

    // ── 5. Fallback: si contiene alguna palabra de deporte, clasificar como "otro" ──
    const sport = extractSport(normalized);
    if (sport) {
      return {
        cost,
        date,
        expenseType: 'otro',
        sport,
        description: normalized
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing sports commentary:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// CALCULADORAS
// ─────────────────────────────────────────────

/** Gasto total por tipo de gasto deportivo */
export const getTotalByExpenseType = (data: SportsData[]): Record<SportsExpenseType, number> => {
  const result: Record<SportsExpenseType, number> = {
    mensualidad: 0,
    arbitraje: 0,
    cancha: 0,
    equipamiento: 0,
    otro: 0
  };

  for (const item of data) {
    result[item.expenseType] += item.cost;
  }

  return result;
};
