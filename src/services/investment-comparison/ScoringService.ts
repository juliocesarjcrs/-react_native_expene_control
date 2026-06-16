/**
 * MÓDULO DE SCORING
 * Calcula puntuaciones (0-100) para cada escenario
 * Separado del InvestmentComparisonService principal
 */

import {
  ScenarioScore,
  ScenarioType,
  UserProfile,
  RiskProfile,
  UserPriority,
  SavingsScenario,
  SavingsResult,
  FuturePropertyScenario,
  FuturePropertyResult,
  ImmediateRentScenario,
  ImmediateRentResult,
  ExistingPropertyScenario,
  ExistingPropertyResult
} from '~/shared/types/services/Investment-comparison.types';

export class ScoringService {
  // ============================================
  // SCORING: AHORRO/INVERSIÓN
  // ============================================

  static scoreSavingsScenario(
    scenario: SavingsScenario,
    result: SavingsResult,
    profile: UserProfile
  ): ScenarioScore {
    const profitability = Math.min((result.effectiveAnnualRate / 15) * 100, 100);
    const liquidity = 100; // Máxima - retiro inmediato
    const security = 85; // Alta - depósitos bancarios
    const cashFlow = 20; // Bajo - no genera ingresos periódicos

    const totalScore = this.calculateWeightedScore(
      { profitability, liquidity, security, cashFlow },
      profile
    );

    return {
      scenarioType: ScenarioType.SAVINGS,
      totalScore,
      scores: { profitability, liquidity, security, cashFlow },
      adjustedReturn: result.effectiveAnnualRate
    };
  }

  // ============================================
  // SCORING: VIVIENDA A FUTURO
  // ============================================

  static scoreFuturePropertyScenario(
    scenario: FuturePropertyScenario,
    result: FuturePropertyResult,
    profile: UserProfile
  ): ScenarioScore {
    const profitability = Math.min((result.annualizedReturn / 20) * 100, 100);
    const liquidity = 30; // Baja - inmueble ilíquido
    const security = 70; // Media-alta - activo tangible
    const cashFlow = Math.min((result.netRentalIncome / result.totalInvested) * 100 * 5, 80);

    const totalScore = this.calculateWeightedScore(
      { profitability, liquidity, security, cashFlow },
      profile
    );

    return {
      scenarioType: ScenarioType.FUTURE_PROPERTY,
      totalScore,
      scores: { profitability, liquidity, security, cashFlow },
      adjustedReturn: result.annualizedReturn
    };
  }

  // ============================================
  // SCORING: COMPRA INMEDIATA
  // ============================================

  static scoreImmediateRentScenario(
    scenario: ImmediateRentScenario,
    result: ImmediateRentResult,
    profile: UserProfile
  ): ScenarioScore {
    const profitability = Math.min((result.annualizedReturn / 20) * 100, 100);
    const liquidity = 25; // Muy baja - capital bloqueado
    const security = 65; // Media - riesgos varios
    const cashFlow = Math.min((result.cashOnCashReturn / 10) * 100, 100);

    const totalScore = this.calculateWeightedScore(
      { profitability, liquidity, security, cashFlow },
      profile
    );

    return {
      scenarioType: ScenarioType.IMMEDIATE_RENT,
      totalScore,
      scores: { profitability, liquidity, security, cashFlow },
      adjustedReturn: result.annualizedReturn
    };
  }

  // ============================================
  // SCORING: PROPIEDAD EXISTENTE
  // ============================================

  static scoreExistingPropertyScenario(
    scenario: ExistingPropertyScenario,
    result: ExistingPropertyResult,
    profile: UserProfile
  ): ScenarioScore {
    const maintainResult = result.maintain;

    // Rentabilidad: basada en retorno anualizado
    const profitability = Math.min((maintainResult.annualizedReturn / 15) * 100, 100);

    // Liquidez: baja-media (40) - es inmueble pero ya lo tienes
    const liquidity = 40;

    // Seguridad: alta (85) - activo tangible que ya posees
    const security = 85;

    // Flujo de caja: basado en flujo neto mensual promedio
    const monthlyCashFlow = maintainResult.totalNetCashFlow / (scenario.horizonYears * 12);
    const monthlyInvestment = scenario.currentValue / (scenario.horizonYears * 12);
    const cashFlowRatio = (monthlyCashFlow / monthlyInvestment) * 100;
    const cashFlow = Math.min(Math.max(cashFlowRatio * 5, 0), 100);

    const totalScore = this.calculateWeightedScore(
      { profitability, liquidity, security, cashFlow },
      profile
    );

    return {
      scenarioType: ScenarioType.EXISTING_PROPERTY,
      totalScore,
      scores: { profitability, liquidity, security, cashFlow },
      adjustedReturn: maintainResult.annualizedReturn
    };
  }

  // ============================================
  // PONDERACIÓN
  // ============================================

  private static calculateWeightedScore(
    scores: { profitability: number; liquidity: number; security: number; cashFlow: number },
    profile: UserProfile
  ): number {
    const weights = this.getWeights(profile);
    return (
      scores.profitability * weights.profitability +
      scores.liquidity * weights.liquidity +
      scores.security * weights.security +
      scores.cashFlow * weights.cashFlow
    );
  }

  private static getWeights(profile: UserProfile): {
    profitability: number;
    liquidity: number;
    security: number;
    cashFlow: number;
  } {
    // Pesos base según perfil de riesgo
    let weights = { profitability: 0.3, liquidity: 0.2, security: 0.3, cashFlow: 0.2 };

    if (profile.riskProfile === RiskProfile.CONSERVATIVE) {
      weights = { profitability: 0.2, liquidity: 0.3, security: 0.4, cashFlow: 0.1 };
    } else if (profile.riskProfile === RiskProfile.AGGRESSIVE) {
      weights = { profitability: 0.4, liquidity: 0.1, security: 0.2, cashFlow: 0.3 };
    }

    // Ajustar según prioridades
    profile.priorities.forEach((priority, index) => {
      const boost = (3 - index) * 0.05;
      if (priority === UserPriority.PROFITABILITY) weights.profitability += boost;
      else if (priority === UserPriority.LIQUIDITY) weights.liquidity += boost;
      else if (priority === UserPriority.SECURITY) weights.security += boost;
      else if (priority === UserPriority.CASH_FLOW) weights.cashFlow += boost;
    });

    // Normalizar
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach((key) => {
      weights[key as keyof typeof weights] /= total;
    });

    return weights;
  }
}
