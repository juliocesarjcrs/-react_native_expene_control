// ~/utils/investmentCalculations.ts

import { DEFAULTS } from '~/shared/types/services/Investment-comparison.types';

/**
 * UTILIDADES DE CÁLCULO FINANCIERO
 * Funciones reutilizables para cálculos de inversión
 * Basadas en las fórmulas reales de Nubank Colombia
 */

// ============================================
// TIPOS LOCALES
// ============================================

export interface SavingsCalculationInput {
  initialCapital: number;
  monthlyContribution?: number;
  annualRate: number; // % (ej: 8.25)
  horizonMonths: number;
  apply4x1000?: boolean;
  withholdingTax?: number; // % (ej: 7)
  inflation?: number; // % (ej: 5.5)
}

export interface SavingsCalculationResult {
  // Valores depositados
  totalDeposited: number;

  // Intereses
  grossEarnings: number; // Intereses brutos (sin descuentos)
  withholdingAmount: number; // Retención en la fuente
  netEarnings: number; // Ganancias netas

  // 4x1000
  fourPerThousandEntry: number;
  fourPerThousandExit: number;
  fourPerThousandTotal: number;

  // Saldos finales
  balanceBeforeTaxes: number; // Saldo antes de retención
  balanceAfterTaxes: number; // Saldo después de retención, antes de 4x1000
  finalAmount: number; // Monto final después de TODO

  // Métricas
  effectiveAnnualRate: number; // Tasa efectiva post-impuestos
  realReturn: number; // Retorno real ajustado por inflación

  // Desglose de umbral UVT (informativo)
  averageDailyInterest: number;
  dailyInterestInUVT: number;
  isAboveUVTThreshold: boolean;
}

// ============================================
// FUNCIÓN PRINCIPAL: CALCULAR AHORRO
// ============================================

// ============================================
// FUNCIÓN PRINCIPAL: CALCULAR AHORRO
// ============================================

/**
 * Calcula rendimientos de ahorro con capitalización DIARIA
 * Método Nubank: (1 + EA)^(1/365) - 1
 * Retención: Se aplica DIARIAMENTE solo si el interés del día > 0.055 UVT (~$2,333)
 *
 * @param input Parámetros del escenario de ahorro
 * @returns Resultado detallado con todos los cálculos
 */
export function calculateSavings(input: SavingsCalculationInput): SavingsCalculationResult {
  const {
    initialCapital,
    monthlyContribution = 0,
    annualRate,
    horizonMonths,
    apply4x1000 = true,
    withholdingTax = DEFAULTS.WITHHOLDING_TAX_SAVINGS,
    inflation = DEFAULTS.INFLATION_COLOMBIA
  } = input;

  // ============================================
  // 1. CONVERTIR TASAS A DECIMALES
  // ============================================
  const annualRateDecimal = annualRate / 100;
  const withholdingTaxDecimal = withholdingTax / 100;
  const inflationDecimal = inflation / 100;

  // ============================================
  // 2. CALCULAR TASA DIARIA (Capitalización diaria)
  // ============================================
  // Fórmula: dailyRate = (1 + EA)^(1/365) - 1
  const dailyRate = Math.pow(1 + annualRateDecimal, 1 / 365) - 1;

  // ============================================
  // 3. CALCULAR DÍAS TOTALES
  // ============================================
  const totalDays = Math.floor(horizonMonths * (365 / 12));

  // ============================================
  // 4. UMBRAL DE RETENCIÓN DIARIO (0.055 UVT)
  // ============================================
  const dailyThreshold = DEFAULTS.MIN_DAILY_INTEREST_UVT * DEFAULTS.UVT_VALUE; // ~$2,333 COP

  // ============================================
  // 5. SIMULACIÓN DÍA A DÍA
  // ============================================
  let currentBalance = initialCapital;
  let totalGrossEarnings = 0;
  let totalWithholdingAmount = 0;
  let daysAboveThreshold = 0;

  for (let day = 1; day <= totalDays; day++) {
    // Agregar aporte mensual cada ~30 días
    if (monthlyContribution > 0 && day > 0 && day % 30 === 0 && day <= totalDays - 1) {
      currentBalance += monthlyContribution;
    }

    // Calcular interés del día ANTES de retención
    const dailyInterest = currentBalance * dailyRate;
    totalGrossEarnings += dailyInterest;

    // Verificar si el interés del día supera el umbral
    let dailyWithholding = 0;
    if (dailyInterest > dailyThreshold) {
      // Aplicar retención solo sobre el interés de este día
      dailyWithholding = dailyInterest * withholdingTaxDecimal;
      totalWithholdingAmount += dailyWithholding;
      daysAboveThreshold++;
    }

    // Sumar al saldo el interés neto (interés - retención)
    currentBalance += dailyInterest - dailyWithholding;
  }

  // ============================================
  // 6. CALCULAR VALORES FINALES
  // ============================================
  const balanceBeforeTaxes = initialCapital + totalGrossEarnings;
  const balanceAfterTaxes = currentBalance;
  const grossEarnings = totalGrossEarnings;
  const withholdingAmount = totalWithholdingAmount;

  // ============================================
  // 7. MÉTRICAS DE UMBRAL (informativas)
  // ============================================
  const averageDailyInterest = grossEarnings / totalDays;
  const dailyInterestInUVT = averageDailyInterest / DEFAULTS.UVT_VALUE;
  const isAboveUVTThreshold = averageDailyInterest > dailyThreshold;

  // ============================================
  // 8. TOTAL DEPOSITADO
  // ============================================
  // Calcular cuántos aportes mensuales se hicieron realmente
  const numberOfContributions = Math.floor(totalDays / 30);
  const totalDeposited = initialCapital + monthlyContribution * numberOfContributions;

  // ============================================
  // 9. CALCULAR 4x1000
  // ============================================
  let fourPerThousandEntry = 0;
  let fourPerThousandExit = 0;

  if (apply4x1000) {
    // 4x1000 al entrar (sobre capital inicial)
    fourPerThousandEntry = initialCapital * (DEFAULTS.FOUR_PER_THOUSAND / 100);

    // 4x1000 al salir (sobre saldo después de retención)
    fourPerThousandExit = balanceAfterTaxes * (DEFAULTS.FOUR_PER_THOUSAND / 100);
  }

  const fourPerThousandTotal = fourPerThousandEntry + fourPerThousandExit;

  // ============================================
  // 10. CALCULAR GANANCIA NETA
  // ============================================
  // Ganancia neta = Interés bruto - Retención - 4x1000 total
  const netEarnings = grossEarnings - withholdingAmount - fourPerThousandTotal;

  // ============================================
  // 11. CALCULAR MONTO FINAL
  // ============================================
  // Monto final = Saldo después de retención - 4x1000 salida
  const finalAmount = balanceAfterTaxes - fourPerThousandExit;

  // ============================================
  // 12. CALCULAR TASA EFECTIVA ANUAL (post-impuestos)
  // ============================================
  let effectiveAnnualRate: number;

  if (horizonMonths === 12) {
    // Para 12 meses, es directo
    effectiveAnnualRate = (finalAmount / totalDeposited - 1) * 100;
  } else {
    // Para otros plazos, anualizar
    // Fórmula: ((1 + periodReturn)^(12/months) - 1) * 100
    const periodReturn = finalAmount / totalDeposited - 1;
    effectiveAnnualRate = (Math.pow(1 + periodReturn, 12 / horizonMonths) - 1) * 100;
  }

  // ============================================
  // 13. CALCULAR RETORNO REAL (ajustado por inflación)
  // ============================================
  // Retorno nominal
  const nominalReturn = finalAmount / totalDeposited - 1;

  // Retorno real usando Fórmula de Fisher:
  // realReturn = ((1 + nominalReturn) / (1 + inflation)) - 1
  const realReturn =
    ((1 + nominalReturn) / Math.pow(1 + inflationDecimal, horizonMonths / 12) - 1) * 100;

  // ============================================
  // 14. RETORNAR RESULTADO
  // ============================================
  return {
    totalDeposited,
    grossEarnings,
    withholdingAmount,
    netEarnings,
    fourPerThousandEntry,
    fourPerThousandExit,
    fourPerThousandTotal,
    balanceBeforeTaxes,
    balanceAfterTaxes,
    finalAmount,
    effectiveAnnualRate,
    realReturn,
    averageDailyInterest,
    dailyInterestInUVT,
    isAboveUVTThreshold
  };
}

// ============================================
// FUNCIÓN AUXILIAR: FORMATEAR RESULTADO PARA DISPLAY
// ============================================

/**
 * Formatea el resultado de cálculo para mostrar en UI
 * Redondea a 2 decimales y formatea montos
 */
export function formatCalculationResult(result: SavingsCalculationResult) {
  return {
    ...result,
    totalDeposited: Math.round(result.totalDeposited * 100) / 100,
    grossEarnings: Math.round(result.grossEarnings * 100) / 100,
    withholdingAmount: Math.round(result.withholdingAmount * 100) / 100,
    netEarnings: Math.round(result.netEarnings * 100) / 100,
    fourPerThousandEntry: Math.round(result.fourPerThousandEntry * 100) / 100,
    fourPerThousandExit: Math.round(result.fourPerThousandExit * 100) / 100,
    fourPerThousandTotal: Math.round(result.fourPerThousandTotal * 100) / 100,
    balanceBeforeTaxes: Math.round(result.balanceBeforeTaxes * 100) / 100,
    balanceAfterTaxes: Math.round(result.balanceAfterTaxes * 100) / 100,
    finalAmount: Math.round(result.finalAmount * 100) / 100,
    effectiveAnnualRate: Math.round(result.effectiveAnnualRate * 100) / 100,
    realReturn: Math.round(result.realReturn * 100) / 100
  };
}
