/**
 * Parser de comentarios de arriendo
 * Ubicación: src/utils/commentaryParser/rentParser.ts
 *
 * Formatos soportados:
 *   {N} días arriendo {descripcion}
 *   {N} días mes {Mes} {Año}
 *   Nuevo valor {descripcion}
 *   Arriendo {Mes} [{Año}] [{descripcion}]
 *
 * Ejemplos reales:
 *   "9 días arriendo Torre 2. Apt 505"
 *   "22 días mes Febrero 2026"
 *   "Nuevo valor apt 1004 Mirador Villa Verde"
 *   "Arriendo Mar 2026"
 */

import { RentData } from '~/shared/types/utils/commentaryParser/rent-analysis.types';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const MONTHS_ES: Record<string, string> = {
  enero: 'Enero',
  febrero: 'Febrero',
  marzo: 'Marzo',
  abril: 'Abril',
  mayo: 'Mayo',
  junio: 'Junio',
  julio: 'Julio',
  agosto: 'Agosto',
  septiembre: 'Septiembre',
  octubre: 'Octubre',
  noviembre: 'Noviembre',
  diciembre: 'Diciembre',
  ene: 'Enero',
  feb: 'Febrero',
  mar: 'Marzo',
  abr: 'Abril',
  may: 'Mayo',
  jun: 'Junio',
  jul: 'Julio',
  ago: 'Agosto',
  sep: 'Septiembre',
  oct: 'Octubre',
  nov: 'Noviembre',
  dic: 'Diciembre'
};

const normalizeMonth = (raw: string): string => MONTHS_ES[raw.toLowerCase()] ?? raw;

// ─────────────────────────────────────────────
// REGEX PATTERNS
// ─────────────────────────────────────────────

const PATTERNS = {
  // "9 días arriendo Torre 2. Apt 505"
  partialDays: /^(\d+)\s+d[ií]as?\s+(?:arriendo\s+)?(.*)$/i,

  // "22 días mes Febrero 2026"
  partialDaysMonth: /^(\d+)\s+d[ií]as?\s+mes\s+(\w+)(?:\s+(\d{4}))?$/i,

  // "Nuevo valor apt 1004 Mirador Villa Verde"
  newValue: /^nuevo\s+valor\s+(.+)$/i,

  // "Arriendo Febrero Torre 2"
  monthlyWithMonth: /^arriendo\s+(\w+)(?:\s+(.+))?$/i,

  // Año al inicio de lo que sigue al mes: "2026" o "2026 Torre 2"
  leadingYear: /^(\d{4})(?:\s+(.*))?$/
};

// ─────────────────────────────────────────────
// PARSER PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Parsea el comentario de un gasto de arriendo.
 * Retorna null si no sigue ningún patrón reconocido.
 */
export const parseRentCommentary = (
  commentary: string,
  cost: number,
  date: string
): RentData | null => {
  if (!commentary?.trim()) return null;

  try {
    const normalized = commentary.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // ── 1. "N días mes Mes Año" (pago parcial con mes explícito) ──────────
    const partialMonthMatch = normalized.match(PATTERNS.partialDaysMonth);
    if (partialMonthMatch) {
      return {
        cost,
        date,
        paymentType: 'parcial',
        days: parseInt(partialMonthMatch[1]),
        month: normalizeMonth(partialMonthMatch[2]),
        year: partialMonthMatch[3] ? parseInt(partialMonthMatch[3]) : undefined
      };
    }

    // ── 2. "N días arriendo {propiedad}" (pago parcial genérico) ─────────
    const partialDaysMatch = normalized.match(PATTERNS.partialDays);
    if (partialDaysMatch) {
      return {
        cost,
        date,
        paymentType: 'parcial',
        days: parseInt(partialDaysMatch[1]),
        property: partialDaysMatch[2]?.trim() || undefined
      };
    }

    // ── 3. "Nuevo valor {propiedad}" ─────────────────────────────────────
    const newValueMatch = normalized.match(PATTERNS.newValue);
    if (newValueMatch) {
      return {
        cost,
        date,
        paymentType: 'nuevo_valor',
        isNewValue: true,
        property: newValueMatch[1].trim()
      };
    }

    // ── 4. "Arriendo {Mes} [{Año}] [{propiedad}]" ────────────────────────
    const monthlyMatch = normalized.match(PATTERNS.monthlyWithMonth);
    if (monthlyMatch) {
      const potentialMonth = normalizeMonth(monthlyMatch[1]);
      const isMonth = Object.values(MONTHS_ES).includes(potentialMonth);

      if (!isMonth) {
        // La palabra no es un mes: el texto completo queda como propiedad
        return { cost, date, paymentType: 'completo', month: undefined, property: normalized };
      }

      // El año va justo después del mes ("Arriendo Mar 2026 Torre 2"); lo demás es la propiedad
      let year: number | undefined;
      let property = monthlyMatch[2]?.trim();
      const yearMatch = property?.match(PATTERNS.leadingYear);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
        property = yearMatch[2]?.trim();
      }

      return {
        cost,
        date,
        paymentType: 'completo',
        month: potentialMonth,
        year,
        property: property || undefined
      };
    }

    return null;
  } catch {
    return null;
  }
};
