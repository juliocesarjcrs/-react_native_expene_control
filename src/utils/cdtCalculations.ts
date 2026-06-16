import { DEFAULTS } from '~/shared/types/services/Investment-comparison.types';

/**
 * UTILIDADES DE CÁLCULO PARA CDT (Certificados de Depósito a Término)
 * CDT Nu Colombia - Interés simple pagado al vencimiento
 */

// ============================================
// TASAS CDT NU (Vigentes 2 enero 2026)
// ============================================

export const CDT_RATES: Record<number, number> = {
  60: 9.0,
  90: 9.1,
  120: 9.2,
  180: 9.3,
  270: 9.4,
  540: 9.6,
  720: 9.7,
  1080: 9.7
};

export const CDT_TERMS = Object.keys(CDT_RATES).map(Number);

// ============================================
// TIPOS
// ============================================

export interface CDTCalculationInput {
  capitalAmount: number;
  termDays: number;
  annualRate?: number;
  apply4x1000?: boolean;
  withholdingTax?: number;
  inflation?: number;
}

export interface CDTCalculationResult {
  capitalAmount: number;
  grossInterest: number;
  withholdingAmount: number;
  netInterest: number;
  fourPerThousandEntry: number;
  fourPerThousandExit: number;
  fourPerThousandTotal: number;
  totalBeforeTaxes: number;
  totalAfterWithholding: number;
  finalAmount: number;
  effectiveAnnualRate: number;
  realReturn: number;
  termDays: number;
  nominalRate: number;
}

// ============================================
// FUNCIÓN PRINCIPAL: CALCULAR CDT
// ============================================

/**
 * Calcula rendimientos de CDT con interés SIMPLE
 * Método CDT: Interés sobre capital inicial, pagado al vencimiento
 * Retención: 4% sobre intereses al final
 *
 * Fórmula: FV = P × (1 + r)^(días/365)
 * donde r es la tasa efectiva anual
 *
 * @param input Parámetros del CDT
 * @returns Resultado detallado con todos los cálculos
 */
export function calculateCDT(input: CDTCalculationInput): CDTCalculationResult {
  try {
    const {
      capitalAmount,
      termDays,
      annualRate,
      apply4x1000 = false,
      withholdingTax = 4,
      inflation = DEFAULTS.INFLATION_COLOMBIA || 5.5
    } = input;

    // Validar parámetros básicos
    if (!capitalAmount || capitalAmount <= 0) {
      throw new Error(`Capital inválido: ${capitalAmount}`);
    }
    if (!termDays || termDays <= 0) {
      throw new Error(`Plazo inválido: ${termDays}`);
    }

    // ============================================
    // 1. OBTENER TASA SEGÚN PLAZO
    // ============================================
    const nominalRate = annualRate || CDT_RATES[termDays] || 9.0;
    const rateDecimal = nominalRate / 100;

    // ============================================
    // 2. CALCULAR INTERÉS SIMPLE
    // ============================================
    // Fórmula CDT: FV = P × (1 + r)^(días/365)
    // Interés = FV - P
    const futureValue = capitalAmount * Math.pow(1 + rateDecimal, termDays / 365);
    const grossInterest = futureValue - capitalAmount;

    // ============================================
    // 3. CALCULAR RETENCIÓN EN LA FUENTE
    // ============================================
    // 4% sobre los intereses generados (no sobre el capital)
    const withholdingAmount = grossInterest * (withholdingTax / 100);
    const netInterest = grossInterest - withholdingAmount;

    // ============================================
    // 4. CALCULAR 4x1000
    // ============================================
    let fourPerThousandEntry = 0;
    let fourPerThousandExit = 0;

    if (apply4x1000) {
      const FOUR_PER_THOUSAND = DEFAULTS.FOUR_PER_THOUSAND || 0.4;

      // 4x1000 al depositar (sobre capital inicial)
      fourPerThousandEntry = capitalAmount * (FOUR_PER_THOUSAND / 100);

      // 4x1000 al retirar (sobre total después de retención)
      const totalAfterWithholding = capitalAmount + netInterest;
      fourPerThousandExit = totalAfterWithholding * (FOUR_PER_THOUSAND / 100);
    }

    const fourPerThousandTotal = fourPerThousandEntry + fourPerThousandExit;

    // ============================================
    // 5. CALCULAR MONTOS FINALES
    // ============================================
    const totalBeforeTaxes = capitalAmount + grossInterest;
    const totalAfterWithholding = capitalAmount + netInterest;
    const finalAmount = totalAfterWithholding - fourPerThousandExit;

    // ============================================
    // 6. CALCULAR TASA EFECTIVA ANUAL (post-impuestos)
    // ============================================
    // Anualizar el retorno efectivo obtenido
    const periodReturn = finalAmount / capitalAmount - 1;
    const effectiveAnnualRate = (Math.pow(1 + periodReturn, 365 / termDays) - 1) * 100;

    // ============================================
    // 7. CALCULAR RETORNO REAL (ajustado por inflación)
    // ============================================
    const inflationDecimal = (inflation || 5.5) / 100;
    const inflationPeriod = Math.pow(1 + inflationDecimal, termDays / 365) - 1;
    const realReturn = ((1 + periodReturn) / (1 + inflationPeriod) - 1) * 100;

    // ============================================
    // 8. RETORNAR RESULTADO
    // ============================================
    return {
      capitalAmount,
      grossInterest,
      withholdingAmount,
      netInterest,
      fourPerThousandEntry,
      fourPerThousandExit,
      fourPerThousandTotal,
      totalBeforeTaxes,
      totalAfterWithholding,
      finalAmount,
      effectiveAnnualRate,
      realReturn,
      termDays,
      nominalRate
    };
  } catch (error) {
    throw error;
  }
}

// ============================================
// FUNCIÓN AUXILIAR: OBTENER TASA POR PLAZO
// ============================================

/**
 * Obtiene la tasa E.A. según el plazo del CDT
 * @param termDays Plazo en días
 * @returns Tasa E.A. en porcentaje
 */
export function getCDTRate(termDays: number): number {
  return CDT_RATES[termDays] || 9.0;
}

/**
 * Obtiene el plazo más cercano válido
 * @param days Días deseados
 * @returns Plazo válido más cercano
 */
export function getClosestCDTTerm(days: number): number {
  const terms = CDT_TERMS;
  return terms.reduce((prev, curr) =>
    Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
  );
}

// ============================================
// FUNCIÓN DE TEST: VERIFICAR CON EJEMPLOS
// ============================================

/**
 * Test con ejemplos de CDT
 */
export function testCDTExamples() {
  // Ejemplo 1: $1M a 90 días al 9.10%
  const test1 = calculateCDT({
    capitalAmount: 1000000,
    termDays: 90,
    apply4x1000: false
  });

  // Ejemplo 2: $5M a 180 días al 9.30%
  const test2 = calculateCDT({
    capitalAmount: 5000000,
    termDays: 180,
    apply4x1000: false
  });

  // Ejemplo 3: $10M a 720 días al 9.70% con 4x1000
  const test3 = calculateCDT({
    capitalAmount: 10000000,
    termDays: 720,
    apply4x1000: true
  });

  return { test1, test2, test3 };
}
