// Utils para parsear comentarios

import {
  UtilityConsumption,
  ProductPrice,
  RetentionData
} from '~/shared/types/screens/Statistics/commentary-analysis.types';

/**
 * Parsea comentarios de servicios públicos (Luz, Agua, Gas)
 * Formatos soportados:
 * - "Consumo 100 Kw 18 Dic - 17 Ene 2026 (Con Margot)"
 * - "Consumo(79) 17 Nov - 17 Dic (Deshabitado 6 días)"
 * - "Consumo 14 M3 Periodo 16 Dic - 15 Ene (Solos)"
 */
export const parseUtilityCommentary = (
  commentary: string,
  cost: number,
  date: string
): UtilityConsumption | null => {
  if (!commentary) return null;

  try {
    // Extraer consumo
    const consumptionMatch = commentary.match(/(\d+(?:\.\d+)?)\s*(Kw|M3|kw|m3)/i);
    if (!consumptionMatch) return null;

    const consumption = parseFloat(consumptionMatch[1]);
    const unit = consumptionMatch[2].toUpperCase() as 'Kw' | 'M3';

    // Extraer periodo de fechas
    const periodMatch = commentary.match(
      /(\d{1,2})\s+(\w+)\s*-\s*(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/
    );
    const periodStart = periodMatch ? `${periodMatch[1]} ${periodMatch[2]}` : '';
    const periodEnd = periodMatch
      ? `${periodMatch[3]} ${periodMatch[4]} ${periodMatch[5] || ''}`
      : '';

    // Detectar notas especiales
    const hasExtraPerson = /con\s+\w+|margot|mamá|persona\s+adicional/i.test(commentary);
    const uninhabitedMatch = commentary.match(/deshabitado\s+(\d+)\s+días?/i);
    const uninhabitedDays = uninhabitedMatch ? parseInt(uninhabitedMatch[1]) : 0;

    // Extraer notas entre paréntesis
    const notesMatch = commentary.match(/\(([^)]+)\)/);
    const notes = notesMatch ? notesMatch[1] : undefined;

    return {
      cost,
      consumption,
      unit,
      periodStart: periodStart.trim(),
      periodEnd: periodEnd.trim(),
      notes,
      date,
      hasExtraPerson,
      uninhabitedDays
    };
  } catch (error) {
    console.error('Error parsing utility commentary:', error);
    return null;
  }
};

/**
 * Parsea comentarios de productos/proteínas
 * Formatos soportados:
 * - "Higado — 0.525 kg a $22.000/kg"
 * - "Trucha Xkg El Mar — 0.545 kg a $26.999/kg"
 * - "1.150 kg Pechuga blanca"
 */
export const parseProductCommentary = (
  commentary: string,
  cost: number,
  date: string
): ProductPrice | null => {
  if (!commentary) return null;

  try {
    // Patrón 1: "Producto — X kg a $Y/kg"
    let match = commentary.match(/(.+?)\s*—\s*(\d+\.?\d*)\s*kg\s*a?\s*\$?(\d{1,3}(?:[.,]\d{3})*)/i);

    if (match) {
      const product = match[1].trim();
      const quantity = parseFloat(match[2]);
      const pricePerKg = parseFloat(match[3].replace(/[.,]/g, ''));

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        date
      };
    }

    // Patrón 2: "X kg Producto"
    match = commentary.match(/(\d+\.?\d*)\s*kg\s+(.+)/i);

    if (match) {
      const quantity = parseFloat(match[1]);
      const product = match[2].trim();
      const pricePerKg = Math.round(cost / quantity);

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        date
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing product commentary:', error);
    return null;
  }
};

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
 * Calcula consumo promedio por persona
 */
export const calculateConsumptionPerPerson = (
  consumptions: UtilityConsumption[]
): { alone: number; withExtra: number; difference: number } => {
  const alone = consumptions.filter((c) => !c.hasExtraPerson);
  const withExtra = consumptions.filter((c) => c.hasExtraPerson);

  const aloneAvg = alone.length
    ? alone.reduce((sum, c) => sum + c.consumption, 0) / alone.length
    : 0;

  const withExtraAvg = withExtra.length
    ? withExtra.reduce((sum, c) => sum + c.consumption, 0) / withExtra.length
    : 0;

  return {
    alone: Math.round(aloneAvg * 100) / 100,
    withExtra: Math.round(withExtraAvg * 100) / 100,
    difference: Math.round((withExtraAvg - aloneAvg) * 100) / 100
  };
};

/**
 * Encuentra el mejor precio de un producto
 */
export const findBestPrice = (
  products: ProductPrice[],
  productName: string
): { best: ProductPrice | null; worst: ProductPrice | null; savings: number } => {
  const filtered = products.filter((p) =>
    p.product.toLowerCase().includes(productName.toLowerCase())
  );

  if (filtered.length === 0) {
    return { best: null, worst: null, savings: 0 };
  }

  const sorted = [...filtered].sort((a, b) => a.pricePerKg - b.pricePerKg);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const savings = worst.pricePerKg - best.pricePerKg;

  return { best, worst, savings };
};

/**
 * Calcula total de retenciones en un periodo
 */
export const calculateTotalRetention = (retentions: RetentionData[]): number => {
  return retentions.reduce((sum, r) => sum + r.retention, 0);
};
