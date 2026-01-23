import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ComparisonData,
  SavingsScenario,
  SavingsResult,
  FuturePropertyScenario,
  FuturePropertyResult,
  ImmediateRentScenario,
  ImmediateRentResult,
  Recommendation,
  ScenarioScore,
  ScenarioType,
  UserProfile,
  RiskProfile,
  UserPriority,
  CapitalizationFrequency,
  ExistingPropertyScenario,
  ExistingPropertyResult
} from '~/shared/types/services/Investment-comparison.types';
import { CalculationService, ScoringService } from './investment-comparison';

const STORAGE_KEYS = {
  COMPARISONS: '@investment_comparisons',
  RECENT_COMPARISONS: '@recent_comparisons',
  USER_DEFAULTS: '@user_defaults'
};

/**
 * SERVICIO DE COMPARACIÓN DE INVERSIONES
 * Maneja cálculos financieros, almacenamiento y recomendaciones
 */
class InvestmentComparisonService {
  // ============================================
  // CÁLCULOS ESCENARIO A: AHORRO/INVERSIÓN
  // ============================================

  calculateSavingsScenario(scenario: SavingsScenario): SavingsResult {
    return CalculationService.calculateSavingsScenario(scenario);
  }
  calculateFuturePropertyScenario(scenario: FuturePropertyScenario): FuturePropertyResult {
    const {
      propertyPrice,
      downPaymentPercent,
      savingMonths,
      monthlyContribution,
      savingsRate,
      notaryFees,
      registrationFees,
      beneficiaryTax,
      ivaPercent,
      refurbishmentCost,
      refurbishmentMonths,
      monthlyRent,
      vacancyMonthsPerYear,
      monthlyAdministration,
      administrationAnnualIncrease,
      maintenancePercent,
      propertyTaxPercent,
      rentalIncomeTax,
      propertyAppreciation,
      horizonMonths
    } = scenario;

    // FASE 1: AHORRO (acumulando cuota inicial)
    const downPayment = propertyPrice * (downPaymentPercent / 100);
    const monthlyRate = Math.pow(1 + savingsRate / 100, 1 / 12) - 1;

    let totalSaved = 0;
    for (let month = 1; month <= savingMonths; month++) {
      const monthsToEnd = savingMonths - month;
      totalSaved += monthlyContribution * Math.pow(1 + monthlyRate, monthsToEnd);
    }

    const earningsWhileSaving = totalSaved - monthlyContribution * savingMonths;
    const netSavings = totalSaved;

    // FASE 2: COMPRA
    const purchaseCosts =
      propertyPrice * (notaryFees / 100) +
      propertyPrice * (registrationFees / 100) +
      propertyPrice * (beneficiaryTax / 100) +
      propertyPrice * (ivaPercent / 100);

    const totalInitialInvestment = downPayment + purchaseCosts + refurbishmentCost;

    // FASE 3: RENTA (después de adecuación)
    const rentalMonths = horizonMonths - refurbishmentMonths;
    const rentalYears = rentalMonths / 12;

    let totalGrossRent = 0;
    let totalAdministration = 0;
    let currentAdministration = monthlyAdministration;

    for (let month = 1; month <= rentalMonths; month++) {
      totalGrossRent += monthlyRent;
      totalAdministration += currentAdministration;

      // Incrementar administración cada año
      if (month % 12 === 0) {
        currentAdministration *= 1 + administrationAnnualIncrease / 100;
      }
    }

    const totalVacancyCost = monthlyRent * vacancyMonthsPerYear * rentalYears;
    const totalMaintenance = propertyPrice * (maintenancePercent / 100) * rentalYears;
    const totalPropertyTax = propertyPrice * (propertyTaxPercent / 100) * rentalYears;

    const grossRentalIncome = totalGrossRent - totalVacancyCost;
    const totalIncomeTax = grossRentalIncome * (rentalIncomeTax / 100);

    const netRentalIncome =
      grossRentalIncome -
      totalAdministration -
      totalMaintenance -
      totalPropertyTax -
      totalIncomeTax;

    // Valor del inmueble al final
    const propertyValueAtEnd =
      propertyPrice * Math.pow(1 + propertyAppreciation / 100, rentalYears);

    // Resumen
    const totalInvested = totalInitialInvestment;
    const totalCashFlow = netRentalIncome;
    const totalReturn = propertyValueAtEnd + totalCashFlow - totalInvested;
    const roi = (totalReturn / totalInvested) * 100;
    const annualizedReturn = (Math.pow(1 + totalReturn / totalInvested, 1 / rentalYears) - 1) * 100;

    // Payback: meses para recuperar inversión con flujo de caja
    const avgMonthlyCashFlow = netRentalIncome / rentalMonths;
    const paybackMonths = avgMonthlyCashFlow > 0 ? totalInvested / avgMonthlyCashFlow : 999;

    return {
      savingsPhase: {
        totalSaved,
        earningsWhileSaving,
        netSavings
      },
      purchasePhase: {
        downPayment,
        purchaseCosts,
        refurbishmentCost,
        totalInitialInvestment
      },
      rentalPhase: {
        totalGrossRent,
        totalVacancyCost,
        totalAdministration,
        totalMaintenance,
        totalPropertyTax,
        totalIncomeTax,
        netRentalIncome
      },
      propertyValueAtEnd,
      totalCashFlow,
      totalInvested,
      totalReturn,
      roi,
      annualizedReturn,
      paybackMonths,
      netRentalIncome
    };
  }

  // ============================================
  // CÁLCULOS ESCENARIO C: COMPRA INMEDIATA
  // ============================================

  calculateImmediateRentScenario(scenario: ImmediateRentScenario): ImmediateRentResult {
    const {
      propertyPrice,
      downPaymentPercent,
      mortgageTerm,
      mortgageRate,
      notaryFees,
      registrationFees,
      beneficiaryTax,
      ivaPercent,
      refurbishmentCost,
      refurbishmentMonths,
      monthlyRent,
      vacancyMonthsPerYear,
      monthlyAdministration,
      administrationAnnualIncrease,
      maintenancePercent,
      propertyTaxPercent,
      rentalIncomeTax,
      propertyAppreciation,
      horizonMonths
    } = scenario;

    // Inversión inicial
    const downPayment = propertyPrice * (downPaymentPercent / 100);
    const mortgageAmount = mortgageTerm > 0 ? propertyPrice - downPayment : 0;

    const purchaseCosts =
      propertyPrice * (notaryFees / 100) +
      propertyPrice * (registrationFees / 100) +
      propertyPrice * (beneficiaryTax / 100) +
      propertyPrice * (ivaPercent / 100);

    const totalInitialInvestment = downPayment + purchaseCosts + refurbishmentCost;

    // Calcular cuota mensual de hipoteca (si aplica)
    let monthlyMortgagePayment = 0;
    let totalMortgagePaid = 0;
    let mortgageBalanceAtEnd = mortgageAmount;

    if (mortgageTerm > 0 && mortgageAmount > 0) {
      const monthlyMortgageRate = Math.pow(1 + mortgageRate / 100, 1 / 12) - 1;
      monthlyMortgagePayment =
        (mortgageAmount * monthlyMortgageRate * Math.pow(1 + monthlyMortgageRate, mortgageTerm)) /
        (Math.pow(1 + monthlyMortgageRate, mortgageTerm) - 1);

      const paymentsInHorizon = Math.min(horizonMonths - refurbishmentMonths, mortgageTerm);
      totalMortgagePaid = monthlyMortgagePayment * paymentsInHorizon;

      // Calcular saldo restante de la hipoteca
      if (paymentsInHorizon < mortgageTerm) {
        const remainingPayments = mortgageTerm - paymentsInHorizon;
        mortgageBalanceAtEnd =
          (monthlyMortgagePayment * (Math.pow(1 + monthlyMortgageRate, remainingPayments) - 1)) /
          (monthlyMortgageRate * Math.pow(1 + monthlyMortgageRate, remainingPayments));
      } else {
        mortgageBalanceAtEnd = 0;
      }
    }

    // Flujo de caja de renta (después de adecuación)
    const rentalMonths = horizonMonths - refurbishmentMonths;
    const rentalYears = rentalMonths / 12;

    let totalGrossRent = 0;
    let totalAdministration = 0;
    let currentAdministration = monthlyAdministration;

    for (let month = 1; month <= rentalMonths; month++) {
      totalGrossRent += monthlyRent;
      totalAdministration += currentAdministration;

      if (month % 12 === 0) {
        currentAdministration *= 1 + administrationAnnualIncrease / 100;
      }
    }

    const totalVacancyCost = monthlyRent * vacancyMonthsPerYear * rentalYears;
    const totalMaintenance = propertyPrice * (maintenancePercent / 100) * rentalYears;
    const totalPropertyTax = propertyPrice * (propertyTaxPercent / 100) * rentalYears;

    const grossRentalIncome = totalGrossRent - totalVacancyCost;
    const totalIncomeTax = grossRentalIncome * (rentalIncomeTax / 100);

    const totalOperatingExpenses =
      totalAdministration +
      totalMaintenance +
      totalPropertyTax +
      totalIncomeTax +
      totalMortgagePaid;

    const totalNetCashFlow = grossRentalIncome - totalOperatingExpenses;

    const monthlyInflows = monthlyRent;
    const monthlyOutflows =
      monthlyAdministration +
      (propertyPrice * (maintenancePercent / 100)) / 12 +
      (propertyPrice * (propertyTaxPercent / 100)) / 12 +
      monthlyMortgagePayment;
    const netMonthlyCashFlow = monthlyInflows - monthlyOutflows;

    // Valor final
    const propertyValueAtEnd =
      propertyPrice * Math.pow(1 + propertyAppreciation / 100, rentalYears);
    const equity = propertyValueAtEnd - mortgageBalanceAtEnd;

    // Métricas
    const totalReturn = equity + totalNetCashFlow - totalInitialInvestment;
    const roi = (totalReturn / totalInitialInvestment) * 100;
    const annualizedReturn =
      (Math.pow(1 + totalReturn / totalInitialInvestment, 1 / rentalYears) - 1) * 100;
    const cashOnCashReturn = (totalNetCashFlow / rentalYears / totalInitialInvestment) * 100;

    const avgMonthlyCashFlow = totalNetCashFlow / rentalMonths;
    const paybackMonths =
      avgMonthlyCashFlow > 0 ? totalInitialInvestment / avgMonthlyCashFlow : 999;

    return {
      downPayment,
      mortgageAmount,
      purchaseCosts,
      refurbishmentCost,
      totalInitialInvestment,
      monthlyInflows,
      monthlyMortgagePayment,
      monthlyOutflows,
      netMonthlyCashFlow,
      totalGrossRent,
      totalMortgagePaid,
      totalOperatingExpenses,
      totalNetCashFlow,
      propertyValueAtEnd,
      mortgageBalanceAtEnd,
      equity,
      roi,
      annualizedReturn,
      paybackMonths,
      cashOnCashReturn
    };
  }

  // ============================================
  // RECOMENDACIÓN Y SCORING
  // ============================================

  generateRecommendation(
    comparison: ComparisonData,
    results: {
      savings?: SavingsResult;
      futureProperty?: FuturePropertyResult;
      immediateRent?: ImmediateRentResult;
      existingProperty?: ExistingPropertyResult;
    }
  ): Recommendation {
    const { userProfile, scenarios } = comparison;
    const scores: ScenarioScore[] = [];

    // Calcular score para cada escenario configurado
    if (scenarios.savings && results.savings) {
      scores.push(
        ScoringService.scoreSavingsScenario(scenarios.savings, results.savings, userProfile)
      );
    }
    if (scenarios.futureProperty && results.futureProperty) {
      scores.push(
        ScoringService.scoreFuturePropertyScenario(
          scenarios.futureProperty,
          results.futureProperty,
          userProfile
        )
      );
    }
    if (scenarios.immediateRent && results.immediateRent) {
      scores.push(
        ScoringService.scoreImmediateRentScenario(
          scenarios.immediateRent,
          results.immediateRent,
          userProfile
        )
      );
    }
    if (scenarios.existingProperty && results.existingProperty) {
      console.log('🔵 [Service] Scoring existing property scenario...');
      scores.push(
        ScoringService.scoreExistingPropertyScenario(
          scenarios.existingProperty,
          results.existingProperty,
          userProfile
        )
      );
    }

    // Ordenar por score total
    scores.sort((a, b) => b.totalScore - a.totalScore);
    const recommendedScenario = scores[0].scenarioType;

    // Generar razonamiento
    const reasoning = this.generateReasoning(scores, userProfile);
    const warnings = this.generateWarnings(scores, userProfile);
    const alternatives = this.generateAlternatives(scores);

    return {
      recommendedScenario,
      scores,
      reasoning,
      warnings,
      alternatives
    };
  }

  private scoreSavingsScenario(
    scenario: SavingsScenario,
    result: SavingsResult,
    profile: UserProfile
  ): ScenarioScore {
    return ScoringService.scoreSavingsScenario(scenario, result, profile);
  }

  private scoreFuturePropertyScenario(
    scenario: FuturePropertyScenario,
    result: FuturePropertyResult,
    profile: UserProfile
  ): ScenarioScore {
    return ScoringService.scoreFuturePropertyScenario(scenario, result, profile);
  }

  private generateReasoning(scores: ScenarioScore[], profile: UserProfile): string[] {
    const best = scores[0];
    const reasoning: string[] = [];

    const scenarioNames = {
      [ScenarioType.SAVINGS]: 'Ahorro/Inversión',
      [ScenarioType.FUTURE_PROPERTY]: 'Vivienda a Futuro',
      [ScenarioType.IMMEDIATE_RENT]: 'Compra Inmediata para Renta',
      [ScenarioType.EXISTING_PROPERTY]: 'Propiedad Actual'
    };

    reasoning.push(
      `La opción "${scenarioNames[best.scenarioType]}" obtiene el mejor puntaje (${best.totalScore.toFixed(1)}/100) según tu perfil.`
    );

    // Analizar fortalezas
    const strongPoints: string[] = [];
    if (best.scores.profitability > 70) strongPoints.push('alta rentabilidad');
    if (best.scores.liquidity > 70) strongPoints.push('excelente liquidez');
    if (best.scores.security > 70) strongPoints.push('buena seguridad');
    if (best.scores.cashFlow > 70) strongPoints.push('flujo de caja positivo');

    if (strongPoints.length > 0) {
      reasoning.push(`Destaca por: ${strongPoints.join(', ')}.`);
    }

    // Considerar perfil
    if (profile.riskProfile === RiskProfile.CONSERVATIVE) {
      reasoning.push(
        'Como perfil conservador, priorizamos seguridad y liquidez sobre máxima rentabilidad.'
      );
    } else if (profile.riskProfile === RiskProfile.AGGRESSIVE) {
      reasoning.push(
        'Tu perfil agresivo permite buscar mayor rentabilidad aceptando menor liquidez.'
      );
    }

    // Retorno ajustado
    reasoning.push(`Retorno anualizado esperado: ${best.adjustedReturn.toFixed(2)}% E.A.`);

    return reasoning;
  }

  private generateWarnings(scores: ScenarioScore[], profile: UserProfile): string[] {
    const warnings: string[] = [];
    const best = scores[0];

    if (best.scores.liquidity < 40) {
      warnings.push('⚠️ Liquidez baja: Tendrás dificultad para acceder rápidamente a tu dinero.');
    }

    if (best.scores.security < 50) {
      warnings.push(
        '⚠️ Riesgo moderado-alto: Existe posibilidad de pérdidas o menor rentabilidad esperada.'
      );
    }

    if (best.scenarioType !== ScenarioType.SAVINGS) {
      warnings.push(
        '⚠️ Inversión en finca raíz: Considera gastos no previstos, vacancia y mantenimiento.'
      );
    }

    if (best.scores.cashFlow < 30 && profile.priorities.includes(UserPriority.CASH_FLOW)) {
      warnings.push(
        '⚠️ Bajo flujo de caja: Esta opción no generará ingresos mensuales significativos.'
      );
    }
    if (best.scenarioType === ScenarioType.EXISTING_PROPERTY) {
      warnings.push(
        '⚠️ Considera que mantener la propiedad implica continuar con gastos de administración, ' +
          'mantenimiento y otros costos operativos. Evalúa si estás dispuesto a seguir gestionando estos aspectos.'
      );

      if (best.scores.liquidity < 50) {
        warnings.push(
          '⚠️ La liquidez de una propiedad es limitada. Si necesitas el capital rápidamente, ' +
            'vender puede tomar varios meses. Considera tener un fondo de emergencia separado.'
        );
      }
    }

    return warnings;
  }

  private generateAlternatives(scores: ScenarioScore[]): string[] {
    if (scores.length < 2) return [];

    const alternatives: string[] = [];
    const second = scores[1];

    const scenarioNames = {
      [ScenarioType.SAVINGS]: 'Ahorro/Inversión',
      [ScenarioType.FUTURE_PROPERTY]: 'Vivienda a Futuro',
      [ScenarioType.IMMEDIATE_RENT]: 'Compra Inmediata para Renta',
      [ScenarioType.EXISTING_PROPERTY]: 'Propiedad Actual'
    };

    alternatives.push(
      `Como alternativa, "${scenarioNames[second.scenarioType]}" obtuvo ${second.totalScore.toFixed(1)}/100 puntos.`
    );

    // Sugerir diversificación
    if (scores.length >= 2) {
      alternatives.push(
        'Considera diversificar: combina ahorro líquido con inversión en finca raíz para balance entre liquidez y rentabilidad.'
      );
    }

    return alternatives;
  }

  // ============================================
  // HELPERS
  // ============================================

  private getPeriodsPerYear(frequency: CapitalizationFrequency): number {
    switch (frequency) {
      case CapitalizationFrequency.DAILY:
        return 365;
      case CapitalizationFrequency.MONTHLY:
        return 12;
      case CapitalizationFrequency.QUARTERLY:
        return 4;
      case CapitalizationFrequency.ANNUAL:
        return 1;
      default:
        return 12;
    }
  }

  // ============================================
  // PERSISTENCIA CON ASYNCSTORAGE
  // ============================================

  async saveComparison(comparison: ComparisonData): Promise<void> {
    try {
      // Guardar comparación completa
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.COMPARISONS}_${comparison.id}`,
        JSON.stringify(comparison)
      );

      // Actualizar lista de comparaciones recientes
      const recent = await this.getRecentComparisons();
      const updated = [comparison.id, ...recent.filter((id) => id !== comparison.id)].slice(0, 10);
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_COMPARISONS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving comparison:', error);
      throw error;
    }
  }

  async getComparison(id: string): Promise<ComparisonData | null> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.COMPARISONS}_${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting comparison:', error);
      return null;
    }
  }

  async getRecentComparisons(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_COMPARISONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting recent comparisons:', error);
      return [];
    }
  }

  async deleteComparison(id: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.COMPARISONS}_${id}`);
      const recent = await this.getRecentComparisons();
      const updated = recent.filter((compId) => compId !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_COMPARISONS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting comparison:', error);
      throw error;
    }
  }

  async clearAllComparisons(): Promise<void> {
    try {
      const recent = await this.getRecentComparisons();
      for (const id of recent) {
        await AsyncStorage.removeItem(`${STORAGE_KEYS.COMPARISONS}_${id}`);
      }
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_COMPARISONS);
    } catch (error) {
      console.error('Error clearing comparisons:', error);
      throw error;
    }
  }

  calculateExistingPropertyScenario(scenario: ExistingPropertyScenario): ExistingPropertyResult {
    return CalculationService.calculateExistingPropertyScenario(scenario);
  }
}

export default new InvestmentComparisonService();
