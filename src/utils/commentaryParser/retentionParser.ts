import {
  IncapacidadData,
  IncapacidadStats,
  PrimaRetention,
  RetentionData
} from '~/shared/types/screens/Statistics/retention-analysis.types';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Suma expresiones como "4+18", "2+2", "13+13+1" → número total
 */
const sumExpression = (expr: string): number =>
  expr.split('+').reduce((sum, n) => sum + (parseInt(n.trim()) || 0), 0);

/**
 * Parsea montos colombianos: "467.000", "467000", "635 mil" → number
 */
const parseMonto = (raw: string): number => {
  if (/mil/i.test(raw)) {
    return parseInt(raw.replace(/[.,\s]/g, '')) * 1000;
  }
  return parseInt(raw.replace(/[.,\s]/g, '')) || 0;
};

// ─────────────────────────────────────────────
// FORMATO SOPORTADO
// ─────────────────────────────────────────────
//
//   Retefu: 467.000
//   Incapacidad: Prim: 2 días, Eps: 4+18 días
//   Prima nav: 609.000
//   Prima gest: 1.555.000
//
// Reglas:
//   • "Retefu:" es obligatorio para que se parsee el comentario
//   • "Incapacidad:" es opcional — omitir si no hubo
//   • "Prim:" dentro de Incapacidad es opcional
//   • "Eps:"  dentro de Incapacidad es opcional
//   • "Prima <tipo>:" es opcional y repetible
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// PARSER PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Parsea el comentario de un ingreso de nómina.
 *
 * @param commentary  Texto del comentario
 * @param cost        Monto del ingreso (neto recibido)
 * @param date        Fecha ISO del ingreso
 * @param category    Categoría del ingreso
 * @param baseSalary  Salario base mensual (opcional) — permite calcular descuento por incapacidad
 */
export const parseRetentionCommentary = (
  commentary: string,
  cost: number,
  date: string,
  category: string,
  baseSalary?: number
): RetentionData | null => {
  if (!commentary) return null;

  try {
    // ── 1. Retefuente ordinaria (obligatoria) ──────────────────────────────
    const reteMatch = commentary.match(/retefu(?:ente)?:?\s*([\d.,]+\s*(?:mil)?)/i);
    if (!reteMatch) return null;

    const retention = parseMonto(reteMatch[1]);

    // ── 2. Incapacidad ────────────────────────────────────────────────────
    let incapacidad: IncapacidadData | undefined;

    const incLine = commentary.match(/incapacidad\s*:(.*?)(?:\n|$)/i);
    if (incLine) {
      const incContent = incLine[1];

      // Prim: 2 días  |  Prim: 2+2 días
      const primMatch = incContent.match(/prim\s*:\s*([\d+\s]+)\s*d[ií]as?/i);
      const primDays = primMatch ? sumExpression(primMatch[1]) : 0;

      // Eps: 4+18 días  |  Eps: 22 días
      const epsMatch = incContent.match(/eps\s*:\s*([\d+\s]+)\s*d[ií]as?/i);
      const epsDays = epsMatch ? sumExpression(epsMatch[1]) : 0;

      const totalDays = primDays + epsDays;

      // Calcular descuento económico si hay días EPS y salario conocido
      let dailySalary: number | undefined;
      let discountPerDay: number | undefined;
      let totalDiscount: number | undefined;

      const salary = baseSalary;
      if (salary && epsDays > 0) {
        dailySalary = salary / 30;
        discountPerDay = dailySalary * (1 / 3); // EPS paga 2/3, empleado pierde 1/3
        totalDiscount = discountPerDay * epsDays;
      }

      incapacidad = {
        primDays,
        epsDays,
        totalDays,
        ...(dailySalary !== undefined && { dailySalary }),
        ...(discountPerDay !== undefined && { discountPerDay }),
        ...(totalDiscount !== undefined && { totalDiscount })
      };
    }

    // ── 3. Primas ─────────────────────────────────────────────────────────
    // Captura líneas: "Prima nav: 609.000", "Prima gest: 1.555.000"
    const primaRegex = /prima\s+(\w+)\s*:\s*([\d.,]+\s*(?:mil)?)/gi;
    const primas: PrimaRetention[] = [];
    let primaMatch: RegExpExecArray | null;

    while ((primaMatch = primaRegex.exec(commentary)) !== null) {
      const type = primaMatch[1].toLowerCase();
      primas.push({
        type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        amount: parseMonto(primaMatch[2])
      });
    }

    const totalPrimasRetention = primas.reduce((sum, p) => sum + p.amount, 0);
    const totalRetentionWithPrimas = retention + totalPrimasRetention;

    // ── 4. Notas (líneas que no son ninguno de los campos anteriores) ──────
    const notesLines = commentary
      .split('\n')
      .filter(
        (line) =>
          !/retefu/i.test(line) && !/incapacidad/i.test(line) && !/prima\s+\w+\s*:/i.test(line)
      )
      .map((l) => l.trim())
      .filter(Boolean);

    const notes = notesLines.length > 0 ? notesLines.join(' | ') : undefined;

    return {
      cost,
      retention,
      date,
      category,
      ...(primas.length > 0 && {
        primas,
        totalPrimasRetention,
        totalRetentionWithPrimas
      }),
      ...(incapacidad && { incapacidad }),
      ...(notes && { notes })
    };
  } catch (error) {
    console.error('Error parsing retention commentary:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// CALCULADORAS
// ─────────────────────────────────────────────

/** Suma solo la retefuente ordinaria (salario) */
export const calculateTotalRetention = (retentions: RetentionData[]): number =>
  retentions.reduce((sum, r) => sum + r.retention, 0);

/** Suma retefuente ordinaria + todas las primas */
export const calculateTotalRetentionWithPrimas = (retentions: RetentionData[]): number =>
  retentions.reduce((sum, r) => sum + (r.totalRetentionWithPrimas ?? r.retention), 0);

/** Estadísticas de incapacidad en el período */
export const calculateIncapacidadStats = (retentions: RetentionData[]): IncapacidadStats => {
  const withInc = retentions.filter((r) => r.incapacidad && r.incapacidad.totalDays > 0);

  const totalPrimDays = withInc.reduce((s, r) => s + (r.incapacidad?.primDays ?? 0), 0);
  const totalEpsDays = withInc.reduce((s, r) => s + (r.incapacidad?.epsDays ?? 0), 0);
  const totalDiscount = withInc.reduce((s, r) => s + (r.incapacidad?.totalDiscount ?? 0), 0);

  return {
    totalPrimDays,
    totalEpsDays,
    totalDays: totalPrimDays + totalEpsDays,
    totalDiscount,
    monthsWithIncapacidad: withInc.length,
    avgEpsDaysPerMonth: withInc.length > 0 ? totalEpsDays / withInc.length : 0
  };
};
