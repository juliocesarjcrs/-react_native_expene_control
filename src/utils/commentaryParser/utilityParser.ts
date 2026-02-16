/**
 * Parser de comentarios de servicios públicos (Luz, Agua, Gas)
 * Versión optimizada v3.0 - Con badges y cálculo automático
 *
 * Ubicación: src/utils/commentaryParser/utilityParser.ts
 *
 * Formato estándar:
 * Consumo({cantidad} {unidad}) {fechaInicio} - {fechaFin} [{situación}] {notas}
 *
 * Ejemplos:
 * - Consumo(100 Kw) 18 Dic - 17 Ene 2026 [Con Margot]
 * - Consumo(79 Kw) 17 Nov - 17 Dic 2025 [Solos] [Deshabitado 6 días]
 * - Consumo(14 M3) 16 Dic - 15 Ene 2026 [Con Margot (24 Dic - 15 Ene)]
 * - Consumo(66 Kw) 17 Ago - 16 Sep 2024 [Visitas: 3] Familia Silvia 17-19 Ago
 * - Consumo(71 Kw) 18 Jul - 16 Ago 2024 [Visita: Monica] 5-10 Ago
 */

import {
  UtilityConsumption,
  ConsumptionStats
} from '~/shared/types/screens/Statistics/commentary-analysis.types';

// ============================================================================
// REGEX PATTERNS (Case Insensitive)
// ============================================================================

const PATTERNS = {
  consumption: /Consumo\s*\(?\s*(\d+(?:\.\d+)?)\s*(Kw|M3|kw|m3)\s*\)?/i,
  period: /(\d{1,2})\s+(\w+)\s*-\s*(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/i,
  solos: /\[Solos\]/i,

  // [Con Margot (10 Abr - 17 May)] o [Con Margot(10 Abr - 17 May)]
  extraPersonWithDates: /\[Con\s+(\w+)\s*\(\s*(\d{1,2}\s+\w+)\s*-\s*(\d{1,2}\s+\w+)\s*\)\]/i,

  // [Con Margot] simple (sin fechas)
  extraPersonSimple: /\[Con\s+(\w+)\](?!\s*\()/i,

  // [Margot] solo (sin "Con")
  extraPersonNameOnly: /\[(\w+)\](?!\s*\()/i,

  // [Visitas: 2] o [visitas: 3 personas]
  visitsMultiple: /\[visitas:\s*(\d+)(?:\s+personas?)?\]/i,

  // [Visita: Monica] o [visita: Monica ]
  visitsSingle: /\[visita:\s*(\w+)\s*\]/i,

  // [Deshabitado 6 días]
  uninhabited: /\[Deshabitado\s+(\d+)\s+días?\]/i
};

// ============================================================================
// HELPER: Extraer todas las notas adicionales
// ============================================================================

/**
 * Extrae TODAS las notas después del último corchete
 * Ignora textos redundantes que repiten información ya capturada
 */
const extractAdditionalNotes = (
  normalized: string,
  extraPersonName?: string,
  extraPersonStartDate?: string
): string | undefined => {
  // Encontrar el último corchete de cierre
  const lastBracketIndex = normalized.lastIndexOf(']');

  if (lastBracketIndex === -1) {
    // No hay corchetes, todo después del periodo es nota
    const periodMatch = normalized.match(PATTERNS.period);
    if (periodMatch) {
      const periodEnd = periodMatch.index! + periodMatch[0].length;
      const notes = normalized.substring(periodEnd).trim();
      return notes || undefined;
    }
    return undefined;
  }

  // Extraer texto después del último corchete
  let notes = normalized.substring(lastBracketIndex + 1).trim();

  if (!notes) return undefined;

  // Eliminar textos redundantes
  if (extraPersonName && extraPersonStartDate) {
    // Eliminar "Margot llegó el 16 Mar" si ya tenemos las fechas
    const redundantPattern = new RegExp(
      `${extraPersonName}\\s+llegó\\s+el?\\s+\\d{1,2}\\s+\\w+`,
      'gi'
    );
    notes = notes.replace(redundantPattern, '').trim();
  }

  return notes || undefined;
};

// ============================================================================
// HELPER: Construir notas para franja gris
// ============================================================================

/**
 * Construye el texto final para la franja gris
 * Combina:
 * 1. Fechas de persona adicional (si llegó a mitad)
 * 2. Descripción de visitas
 * 3. Razón de deshabitado
 * 4. Notas adicionales generales
 */
const buildNotesForDisplay = (
  extraPersonName?: string,
  extraPersonStartDate?: string,
  extraPersonEndDate?: string,
  visitsSingleName?: string,
  visitsDescription?: string,
  uninhabitedReason?: string,
  additionalNotes?: string
): string | undefined => {
  const parts: string[] = [];

  // 1. Fechas de persona adicional (solo si llegó a mitad del periodo)
  if (extraPersonName && extraPersonStartDate && extraPersonEndDate) {
    parts.push(`${extraPersonName}: ${extraPersonStartDate} - ${extraPersonEndDate}`);
  }

  // 2. Descripción de visitas
  if (visitsSingleName && visitsDescription) {
    // Visita de 1 persona con descripción
    parts.push(`Visita de ${visitsSingleName} del ${visitsDescription}`);
  } else if (visitsSingleName) {
    // Solo nombre sin descripción
    parts.push(`Visita de ${visitsSingleName}`);
  } else if (visitsDescription) {
    // Visitas múltiples con descripción
    parts.push(visitsDescription);
  }

  // 3. Razón de deshabitado (si está dentro de los corchetes)
  if (uninhabitedReason) {
    parts.push(uninhabitedReason);
  }

  // 4. Notas adicionales generales (TODO lo que está al final)
  if (additionalNotes) {
    parts.push(additionalNotes);
  }

  return parts.length > 0 ? parts.join(' • ') : undefined;
};

// ============================================================================
// PARSER PRINCIPAL
// ============================================================================

export const parseUtilityCommentary = (
  commentary: string,
  cost: number,
  date: string
): UtilityConsumption | null => {
  if (!commentary || !commentary.trim()) return null;

  try {
    // Normalizar
    const normalized = commentary.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. CONSUMO (obligatorio)
    const consumptionMatch = normalized.match(PATTERNS.consumption);
    if (!consumptionMatch) return null;

    const consumption = parseFloat(consumptionMatch[1]);
    const unit = consumptionMatch[2].toUpperCase() as 'Kw' | 'M3';

    // 2. PERIODO (obligatorio)
    const periodMatch = normalized.match(PATTERNS.period);
    if (!periodMatch) return null;

    const periodStart = `${periodMatch[1]} ${periodMatch[2]}`;
    const periodEnd = `${periodMatch[3]} ${periodMatch[4]}${periodMatch[5] ? ' ' + periodMatch[5] : ''}`;

    // 3. [Solos]
    const isSolo = PATTERNS.solos.test(normalized);

    // 4. PERSONA ADICIONAL
    let hasExtraPerson = false;
    let extraPersonName: string | undefined;
    let extraPersonStartDate: string | undefined;
    let extraPersonEndDate: string | undefined;

    // Intentar con fechas: [Con Margot (10 Abr - 17 May)]
    const extraPersonWithDatesMatch = normalized.match(PATTERNS.extraPersonWithDates);
    if (extraPersonWithDatesMatch) {
      hasExtraPerson = true;
      extraPersonName = extraPersonWithDatesMatch[1];
      extraPersonStartDate = extraPersonWithDatesMatch[2].trim();
      extraPersonEndDate = extraPersonWithDatesMatch[3].trim();
    } else {
      // Intentar [Con Margot] simple
      const extraPersonSimpleMatch = normalized.match(PATTERNS.extraPersonSimple);
      if (extraPersonSimpleMatch) {
        hasExtraPerson = true;
        extraPersonName = extraPersonSimpleMatch[1];
      } else {
        // Intentar [Margot] solo (sin "Con")
        const extraPersonNameOnlyMatch = normalized.match(PATTERNS.extraPersonNameOnly);
        if (extraPersonNameOnlyMatch) {
          // Verificar que no sea [Solos] o [Deshabitado X días]
          const potentialName = extraPersonNameOnlyMatch[1];
          if (
            potentialName.toLowerCase() !== 'solos' &&
            !PATTERNS.uninhabited.test(`[${potentialName}]`)
          ) {
            hasExtraPerson = true;
            extraPersonName = potentialName;
          }
        }
      }
    }

    // 5. VISITAS
    let hasVisits = false;
    let visitsCount: number | undefined;
    let visitsSingleName: string | undefined;
    let visitsDescription: string | undefined;

    const visitsMultipleMatch = normalized.match(PATTERNS.visitsMultiple);
    const visitsSingleMatch = normalized.match(PATTERNS.visitsSingle);

    if (visitsMultipleMatch) {
      hasVisits = true;
      visitsCount = parseInt(visitsMultipleMatch[1]);
    } else if (visitsSingleMatch) {
      hasVisits = true;
      visitsCount = 1;
      visitsSingleName = visitsSingleMatch[1].trim();
    }

    // 6. DESHABITADO
    let uninhabitedDays: number | undefined;
    let uninhabitedReason: string | undefined;

    const uninhabitedMatch = normalized.match(PATTERNS.uninhabited);
    if (uninhabitedMatch) {
      uninhabitedDays = parseInt(uninhabitedMatch[1]);
    }

    // 7. EXTRAER NOTAS ADICIONALES (TODO después del último corchete)
    const additionalNotes = extractAdditionalNotes(
      normalized,
      extraPersonName,
      extraPersonStartDate
    );

    // Separar visitsDescription de additionalNotes
    if (hasVisits && additionalNotes) {
      visitsDescription = additionalNotes;
    } else if (uninhabitedDays && additionalNotes) {
      uninhabitedReason = additionalNotes;
    }

    // 8. CÁLCULO AUTOMÁTICO
    let totalExtraPeople = 0;
    if (hasExtraPerson) totalExtraPeople += 1;
    if (hasVisits && visitsCount) totalExtraPeople += visitsCount;

    // 9. CONSTRUIR NOTAS PARA FRANJA GRIS
    const notesForDisplay = buildNotesForDisplay(
      extraPersonName,
      extraPersonStartDate,
      extraPersonEndDate,
      visitsSingleName,
      visitsDescription,
      uninhabitedReason,
      // Si no se usó en visitas o deshabitado, va como nota general
      !hasVisits && !uninhabitedDays ? additionalNotes : undefined
    );

    // 10. RESULTADO
    return {
      cost,
      consumption,
      unit,
      periodStart: periodStart.trim(),
      periodEnd: periodEnd.trim(),
      date,
      isSolo,
      hasExtraPerson,
      extraPersonName,
      extraPersonStartDate,
      extraPersonEndDate,
      hasVisits,
      visitsCount,
      visitsSingleName,
      visitsDescription,
      uninhabitedDays,
      uninhabitedReason,
      totalExtraPeople,
      notesForDisplay
    };
  } catch (error) {
    console.error('Error parsing utility commentary:', error);
    return null;
  }
};

// ============================================================================
// FUNCIONES DE ANÁLISIS (Sin cambios)
// ============================================================================

export const calculateConsumptionPerPerson = (
  data: UtilityConsumption[]
): ConsumptionStats | null => {
  if (data.length === 0) return null;

  const aloneData = data.filter((item) => item.isSolo || (!item.hasExtraPerson && !item.hasVisits));
  const withExtraData = data.filter((item) => item.hasExtraPerson);

  if (aloneData.length === 0 && withExtraData.length === 0) return null;

  const aloneAvg =
    aloneData.length > 0
      ? aloneData.reduce((sum, item) => sum + item.consumption, 0) / aloneData.length
      : 0;

  const withExtraAvg =
    withExtraData.length > 0
      ? withExtraData.reduce((sum, item) => sum + item.consumption, 0) / withExtraData.length
      : 0;

  const difference = withExtraAvg - aloneAvg;
  const percentageIncrease = aloneAvg > 0 ? (difference / aloneAvg) * 100 : 0;

  return {
    alone: Math.round(aloneAvg),
    withExtra: Math.round(withExtraAvg),
    difference: Math.round(difference),
    percentageIncrease: Math.round(percentageIncrease),
    aloneCount: aloneData.length,
    withExtraCount: withExtraData.length
  };
};

export const calculateAdjustedConsumption = (
  consumption: number,
  uninhabitedDays: number,
  periodDays: number = 30
): number => {
  if (uninhabitedDays === 0 || periodDays === 0) return consumption;
  const inhabitedDays = periodDays - uninhabitedDays;
  const dailyConsumption = consumption / inhabitedDays;
  const projectedFullPeriod = dailyConsumption * periodDays;
  return Math.round(projectedFullPeriod);
};

export const groupByUtilityType = (data: UtilityConsumption[]) => {
  return {
    solos: data.filter((item) => item.isSolo),
    withExtraPerson: data.filter((item) => item.hasExtraPerson),
    withVisits: data.filter((item) => item.hasVisits),
    uninhabited: data.filter((item) => (item.uninhabitedDays ?? 0) > 0),
    normal: data.filter(
      (item) => !item.isSolo && !item.hasExtraPerson && !item.hasVisits && !item.uninhabitedDays
    )
  };
};

export const getDateRange = (data: UtilityConsumption[]) => {
  if (data.length === 0) return null;
  const dates = data.map((item) => new Date(item.date).getTime()).sort((a, b) => a - b);
  return {
    earliest: new Date(dates[0]),
    latest: new Date(dates[dates.length - 1]),
    totalDays: Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24))
  };
};
