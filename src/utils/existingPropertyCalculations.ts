// ~/utils/existingPropertyCalculations.ts

import { calculateCDT } from './cdtCalculations';
import { EXISTING_PROPERTY_DEFAULTS } from '~/shared/types/services/Investment-comparison.types';

/**
 * CÁLCULOS PARA PROPIEDAD EXISTENTE
 * Compara: Mantener vs Vender y poner en CDT
 */

export interface ExistingPropertyInput {
  // Datos de la propiedad
  initialInvestment: number;
  yearsOwned: number;
  currentValue: number;
  ownershipPercent: number;

  // Ingresos
  monthlyRent: number;
  monthsRentedPerYear: number;

  // Gastos anuales
  annualAdministration: number;
  administrationAnnualIncrease: number;
  annualPropertyTax: number;
  annualMaintenance: number;
  annualExtraExpenses: number;

  // Proyección
  propertyAppreciation: number;
  horizonYears: number;
  inflation: number;

  // Comparación con venta
  compareWithSale: boolean;
  cdtTermDays?: number;
  cdtRate?: number;
  apply4x1000?: boolean;
}

export interface YearlyBreakdown {
  year: number;
  grossRent: number;
  expenses: number;
  netCashFlow: number;
  propertyValue: number;
}

export interface MaintainOption {
  totalGrossRent: number;
  totalExpenses: number;
  totalNetCashFlow: number;
  propertyValueAtEnd: number;
  capitalGain: number;
  totalReturn: number;
  roi: number;
  annualizedReturn: number;
  cashOnCashReturn: number;
  yearlyBreakdown: YearlyBreakdown[];
}

export interface SellOption {
  saleAmount: number;
  cdtInterest: number;
  cdtTaxes: number;
  finalAmount: number;
  totalReturn: number;
  roi: number;
  annualizedReturn: number;
}

export interface ComparisonResult {
  maintainBetter: boolean;
  difference: number;
  differencePercent: number;
  recommendation: string;
}

export interface ExistingPropertyResult {
  maintain: MaintainOption;
  sell?: SellOption;
  comparison?: ComparisonResult;
}

/**
 * Calcula el escenario de mantener la propiedad actual
 */
export function calculateExistingProperty(input: ExistingPropertyInput): ExistingPropertyResult {
  try {
    const {
      initialInvestment,
      currentValue,
      monthlyRent,
      monthsRentedPerYear,
      annualAdministration,
      administrationAnnualIncrease,
      annualPropertyTax,
      annualMaintenance,
      annualExtraExpenses,
      propertyAppreciation,
      horizonYears,
      inflation,
      compareWithSale,
      cdtTermDays,
      cdtRate,
      apply4x1000
    } = input;

    // ============================================
    // OPCIÓN A: MANTENER PROPIEDAD
    // ============================================

    const yearlyBreakdown: YearlyBreakdown[] = [];
    let totalGrossRent = 0;
    let totalExpenses = 0;
    let propertyValue = currentValue;

    // Calcular año por año
    for (let year = 1; year <= horizonYears; year++) {
      // Ingresos del año
      const grossRent = monthlyRent * monthsRentedPerYear;

      // Gastos del año (con incremento)
      const yearMultiplier = Math.pow(1 + administrationAnnualIncrease / 100, year - 1);
      const administration = annualAdministration * yearMultiplier;
      const propertyTax = annualPropertyTax * yearMultiplier;
      const maintenance = annualMaintenance;
      const extraExpenses = annualExtraExpenses;

      const totalYearExpenses = administration + propertyTax + maintenance + extraExpenses;

      // Flujo neto del año
      const netCashFlow = grossRent - totalYearExpenses;

      // Valorización de la propiedad
      propertyValue = propertyValue * (1 + propertyAppreciation / 100);

      // Acumular totales
      totalGrossRent += grossRent;
      totalExpenses += totalYearExpenses;

      // Guardar desglose
      yearlyBreakdown.push({
        year,
        grossRent,
        expenses: totalYearExpenses,
        netCashFlow,
        propertyValue
      });
    }

    const totalNetCashFlow = totalGrossRent - totalExpenses;
    const propertyValueAtEnd = propertyValue;
    const capitalGain = propertyValueAtEnd - currentValue;
    const totalReturn = totalNetCashFlow + capitalGain;

    // Métricas
    const roi = (totalReturn / currentValue) * 100;
    const annualizedReturn = (Math.pow(1 + totalReturn / currentValue, 1 / horizonYears) - 1) * 100;
    const cashOnCashReturn = (totalNetCashFlow / initialInvestment) * 100;

    const maintain: MaintainOption = {
      totalGrossRent,
      totalExpenses,
      totalNetCashFlow,
      propertyValueAtEnd,
      capitalGain,
      totalReturn,
      roi,
      annualizedReturn,
      cashOnCashReturn,
      yearlyBreakdown
    };

    // ============================================
    // OPCIÓN B: VENDER Y CDT (si aplica)
    // ============================================
    let sell: SellOption | undefined;
    let comparison: ComparisonResult | undefined;

    if (compareWithSale) {
      const saleAmount = currentValue;
      const termDays = cdtTermDays || EXISTING_PROPERTY_DEFAULTS.CDT_TERM_DAYS;
      const rate = cdtRate || EXISTING_PROPERTY_DEFAULTS.CDT_RATE;

      // Calcular cuántos períodos de CDT caben en el horizonte
      const totalDays = horizonYears * 365;
      const cdtPeriods = Math.floor(totalDays / termDays);
      const remainingDays = totalDays % termDays;

      // Simular reinversión de CDTs
      let currentBalance = saleAmount;
      let totalCdtInterest = 0;
      let totalCdtTaxes = 0;

      for (let period = 0; period < cdtPeriods; period++) {
        const cdtResult = calculateCDT({
          capitalAmount: currentBalance,
          termDays,
          annualRate: rate,
          apply4x1000: apply4x1000 || false,
          withholdingTax: 4,
          inflation
        });

        totalCdtInterest += cdtResult.grossInterest;
        totalCdtTaxes += cdtResult.withholdingAmount + cdtResult.fourPerThousandTotal;
        currentBalance = cdtResult.finalAmount; // Reinvertir
      }

      // Si sobran días, calcular proporcionalmente
      if (remainingDays > 0) {
        const partialResult = calculateCDT({
          capitalAmount: currentBalance,
          termDays: remainingDays,
          annualRate: rate,
          apply4x1000: false, // No 4x1000 en período parcial
          withholdingTax: 4,
          inflation
        });

        totalCdtInterest += partialResult.grossInterest;
        totalCdtTaxes += partialResult.withholdingAmount;
        currentBalance = partialResult.finalAmount;
      }

      const finalAmount = currentBalance;
      const totalReturn = finalAmount - saleAmount;
      const roi = (totalReturn / saleAmount) * 100;
      const annualizedReturn = (Math.pow(finalAmount / saleAmount, 1 / horizonYears) - 1) * 100;

      sell = {
        saleAmount,
        cdtInterest: totalCdtInterest,
        cdtTaxes: totalCdtTaxes,
        finalAmount,
        totalReturn,
        roi,
        annualizedReturn
      };

      // ============================================
      // COMPARACIÓN
      // ============================================

      const maintainTotal = maintain.totalReturn;
      const sellTotal = sell.totalReturn;
      const maintainBetter = maintainTotal > sellTotal;
      const difference = Math.abs(maintainTotal - sellTotal);
      const differencePercent = (difference / (maintainBetter ? sellTotal : maintainTotal)) * 100;

      let recommendation = '';
      if (maintainBetter) {
        recommendation = `💡 MANTENER la propiedad genera $${difference.toLocaleString('es-CO', { maximumFractionDigits: 0 })} MÁS (${differencePercent.toFixed(1)}%) que vender y meter en CDT. Además, mantienes el activo físico que puede seguir valorizándose.`;
      } else {
        recommendation = `💡 VENDER y poner en CDT genera $${difference.toLocaleString('es-CO', { maximumFractionDigits: 0 })} MÁS (${differencePercent.toFixed(1)}%) que mantener la propiedad. Ganarías liquidez y eliminarías gastos de administración.`;
      }

      comparison = {
        maintainBetter,
        difference,
        differencePercent,
        recommendation
      };
    }

    // ============================================
    // RETORNAR RESULTADO
    // ============================================
    const result: ExistingPropertyResult = {
      maintain,
      sell,
      comparison
    };

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Formatea el resultado para mostrar
 */
export function formatExistingPropertyResult(result: ExistingPropertyResult) {
  return {
    maintain: {
      ...result.maintain,
      totalGrossRent: Math.round(result.maintain.totalGrossRent),
      totalExpenses: Math.round(result.maintain.totalExpenses),
      totalNetCashFlow: Math.round(result.maintain.totalNetCashFlow),
      propertyValueAtEnd: Math.round(result.maintain.propertyValueAtEnd),
      capitalGain: Math.round(result.maintain.capitalGain),
      totalReturn: Math.round(result.maintain.totalReturn),
      roi: Math.round(result.maintain.roi * 100) / 100,
      annualizedReturn: Math.round(result.maintain.annualizedReturn * 100) / 100,
      cashOnCashReturn: Math.round(result.maintain.cashOnCashReturn * 100) / 100
    },
    sell: result.sell
      ? {
          ...result.sell,
          saleAmount: Math.round(result.sell.saleAmount),
          cdtInterest: Math.round(result.sell.cdtInterest),
          cdtTaxes: Math.round(result.sell.cdtTaxes),
          finalAmount: Math.round(result.sell.finalAmount),
          totalReturn: Math.round(result.sell.totalReturn),
          roi: Math.round(result.sell.roi * 100) / 100,
          annualizedReturn: Math.round(result.sell.annualizedReturn * 100) / 100
        }
      : undefined,
    comparison: result.comparison
  };
}
