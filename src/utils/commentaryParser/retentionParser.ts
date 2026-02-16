import { RetentionData } from '~/shared/types/screens/Statistics/commentary-analysis.types';

/**
 * Parsea comentarios de ingresos con retención
 * Formatos soportados:
 * - "Retefu: 335.000\nIntereses cesantias: 1.005.833"
 * - "Retefu: 635 mil\nAparentemente 32 días incapacidad"
 */
export const parseRetentionCommentary = (
  commentary: string,
  cost: number,
  date: string,
  category: string
): RetentionData | null => {
  if (!commentary) return null;

  try {
    // Buscar "Retefu:" o "Retención:"
    const match = commentary.match(/retefu?:?\s*(\d{1,3}(?:[.,\s]\d{3})*|\d+\s*mil)/i);

    if (!match) return null;

    let retention = 0;
    const retentionStr = match[1].replace(/[.,\s]/g, '');

    if (/mil/i.test(match[1])) {
      // "635 mil" -> 635000
      retention = parseInt(retentionStr) * 1000;
    } else {
      retention = parseInt(retentionStr);
    }

    // Extraer notas (todo después de salto de línea o después del monto)
    const notesMatch = commentary.split(/\n|retefu:?\s*\d+[^\n]*/i)[1];
    const notes = notesMatch?.trim();

    return {
      cost,
      retention,
      notes,
      date,
      category
    };
  } catch (error) {
    console.error('Error parsing retention commentary:', error);
    return null;
  }
};

/**
 * Calcula total de retenciones en un periodo
 */
export const calculateTotalRetention = (retentions: RetentionData[]): number => {
  return retentions.reduce((sum, r) => sum + r.retention, 0);
};
