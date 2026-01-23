/**
 * MÓDULO DE CÁLCULOS
 * Orquesta los cálculos para cada escenario
 */

import {
  SavingsScenario,
  SavingsResult,
  FuturePropertyScenario,
  FuturePropertyResult,
  ImmediateRentScenario,
  ImmediateRentResult,
  ExistingPropertyScenario,
  ExistingPropertyResult
} from '~/shared/types/services/Investment-comparison.types';

import { calculateSavings } from '~/utils/investmentCalculations';
import { calculateCDT } from '~/utils/cdtCalculations';
import { calculateExistingProperty } from '~/utils/existingPropertyCalculations';

export class CalculationService {
  // ============================================
  // AHORRO/INVERSIÓN (Cajitas o CDT)
  // ============================================

  static calculateSavingsScenario(scenario: SavingsScenario): SavingsResult {
    console.log('🔵 [Calculation] Calculando Ahorro/Inversión...');

    try {
      const productType = (scenario as any).productType || 'cajitas';

      if (productType === 'cdt') {
        const cdtCapital = (scenario as any).cdtCapital || 0;
        const cdtTermDays = (scenario as any).cdtTermDays || 90;

        const result = calculateCDT({
          capitalAmount: cdtCapital,
          termDays: cdtTermDays,
          apply4x1000: scenario.apply4x1000,
          withholdingTax: 4,
          inflation: scenario.inflation || 5.5
        });

        return {
          totalDeposited: result.capitalAmount,
          grossEarnings: result.grossInterest,
          fourPerThousandCharge: result.fourPerThousandTotal,
          withholdingAmount: result.withholdingAmount,
          netEarnings: result.netInterest,
          finalAmount: result.finalAmount,
          realReturn: result.realReturn,
          effectiveAnnualRate: result.effectiveAnnualRate
        };
      } else {
        const result = calculateSavings({
          initialCapital: scenario.initialCapital || 0,
          monthlyContribution: scenario.monthlyContribution || 0,
          annualRate: scenario.annualRate || 8.25,
          horizonMonths: scenario.horizonMonths || 12,
          apply4x1000: scenario.apply4x1000 || false,
          withholdingTax: scenario.withholdingTax || 7,
          inflation: scenario.inflation || 5.5
        });

        return {
          totalDeposited: result.totalDeposited,
          grossEarnings: result.grossEarnings,
          fourPerThousandCharge: result.fourPerThousandTotal,
          withholdingAmount: result.withholdingAmount,
          netEarnings: result.netEarnings,
          finalAmount: result.finalAmount,
          realReturn: result.realReturn,
          effectiveAnnualRate: result.effectiveAnnualRate
        };
      }
    } catch (error) {
      console.error('🔴 [Calculation] ERROR en Savings:', error);
      throw error;
    }
  }

  // ============================================
  // PROPIEDAD EXISTENTE
  // ============================================

  static calculateExistingPropertyScenario(
    scenario: ExistingPropertyScenario
  ): ExistingPropertyResult {
    console.log('🔵 [Calculation] Calculando Propiedad Existente...');

    try {
      return calculateExistingProperty({
        initialInvestment: scenario.initialInvestment,
        yearsOwned: scenario.yearsOwned,
        currentValue: scenario.currentValue,
        ownershipPercent: scenario.ownershipPercent,
        monthlyRent: scenario.monthlyRent,
        monthsRentedPerYear: scenario.monthsRentedPerYear,
        annualAdministration: scenario.annualAdministration,
        administrationAnnualIncrease: scenario.administrationAnnualIncrease,
        annualPropertyTax: scenario.annualPropertyTax,
        annualMaintenance: scenario.annualMaintenance,
        annualExtraExpenses: scenario.annualExtraExpenses,
        propertyAppreciation: scenario.propertyAppreciation,
        horizonYears: scenario.horizonYears,
        inflation: scenario.inflation,
        compareWithSale: scenario.compareWithSale,
        cdtTermDays: scenario.cdtTermDays,
        cdtRate: scenario.cdtRate,
        apply4x1000: scenario.apply4x1000
      });
    } catch (error) {
      console.error('🔴 [Calculation] ERROR en ExistingProperty:', error);
      throw error;
    }
  }

  // Los otros métodos (FutureProperty, ImmediateRent)
  // se dejan en el InvestmentComparisonService original
  // para no romper funcionalidad existente
}
