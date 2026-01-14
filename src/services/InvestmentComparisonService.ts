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
  CapitalizationFrequency
} from '~/shared/types/services/Investment-comparison.types';
import { calculateCDT } from '~/utils/cdtCalculations_original';
import { calculateSavings } from '~/utils/investmentCalculations';

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

  /**
   * Calcula rendimientos de ahorro/inversión (Cajitas o CDT)
   * Usa las funciones centralizadas según el tipo de producto
   */
  calculateSavingsScenario(scenario: SavingsScenario): SavingsResult {
    console.log('🔵 [Service] Calculando escenario:', scenario);

    const productType = (scenario as any).productType || 'cajitas';

    if (productType === 'cdt') {
      const cdtCapital = (scenario as any).cdtCapital || 0;
      const cdtTermDays = (scenario as any).cdtTermDays || 90;

      const result = calculateCDT({
        capitalAmount: cdtCapital,
        termDays: cdtTermDays,
        apply4x1000: scenario.apply4x1000,
        withholdingTax: 4,
        inflation: scenario.inflation
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
        initialCapital: scenario.initialCapital,
        monthlyContribution: scenario.monthlyContribution || 0,
        annualRate: scenario.annualRate,
        horizonMonths: scenario.horizonMonths,
        apply4x1000: scenario.apply4x1000,
        withholdingTax: scenario.withholdingTax || 7,
        inflation: scenario.inflation
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
  }
  // ============================================
  // CÁLCULOS ESCENARIO B: VIVIENDA A FUTURO
  // ============================================

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
    }
  ): Recommendation {
    const { userProfile, scenarios } = comparison;
    const scores: ScenarioScore[] = [];

    // Calcular score para cada escenario configurado
    if (scenarios.savings && results.savings) {
      scores.push(this.scoreSavingsScenario(scenarios.savings, results.savings, userProfile));
    }
    if (scenarios.futureProperty && results.futureProperty) {
      scores.push(
        this.scoreFuturePropertyScenario(
          scenarios.futureProperty,
          results.futureProperty,
          userProfile
        )
      );
    }
    if (scenarios.immediateRent && results.immediateRent) {
      scores.push(
        this.scoreImmediateRentScenario(scenarios.immediateRent, results.immediateRent, userProfile)
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
    // Rentabilidad: basada en tasa efectiva
    const profitability = Math.min((result.effectiveAnnualRate / 15) * 100, 100);

    // Liquidez: máxima (100) - no tiene penalidades por retiro
    const liquidity = 100;

    // Seguridad: alta (80-90) - depósitos bancarios están respaldados
    const security = 85;

    // Flujo de caja: bajo (20) - no genera ingresos periódicos
    const cashFlow = 20;

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

  private scoreFuturePropertyScenario(
    scenario: FuturePropertyScenario,
    result: FuturePropertyResult,
    profile: UserProfile
  ): ScenarioScore {
    const profitability = Math.min((result.annualizedReturn / 20) * 100, 100);
    const liquidity = 30; // Baja - inmueble es ilíquido
    const security = 70; // Media-alta - activo tangible pero con riesgos
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

  private scoreImmediateRentScenario(
    scenario: ImmediateRentScenario,
    result: ImmediateRentResult,
    profile: UserProfile
  ): ScenarioScore {
    const profitability = Math.min((result.annualizedReturn / 20) * 100, 100);
    const liquidity = 25; // Muy baja - capital bloqueado
    const security = 65; // Media - riesgos de vacancia, mantenimiento
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

  private calculateWeightedScore(
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

  private getWeights(profile: UserProfile): {
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

    // Ajustar según prioridades del usuario
    profile.priorities.forEach((priority, index) => {
      const boost = (3 - index) * 0.05; // Primera prioridad +0.15, segunda +0.10, etc.
      if (priority === UserPriority.PROFITABILITY) weights.profitability += boost;
      else if (priority === UserPriority.LIQUIDITY) weights.liquidity += boost;
      else if (priority === UserPriority.SECURITY) weights.security += boost;
      else if (priority === UserPriority.CASH_FLOW) weights.cashFlow += boost;
    });

    // Normalizar a que sumen 1
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach((key) => {
      weights[key as keyof typeof weights] /= total;
    });

    return weights;
  }

  private generateReasoning(scores: ScenarioScore[], profile: UserProfile): string[] {
    const best = scores[0];
    const reasoning: string[] = [];

    const scenarioNames = {
      [ScenarioType.SAVINGS]: 'Ahorro/Inversión',
      [ScenarioType.FUTURE_PROPERTY]: 'Vivienda a Futuro',
      [ScenarioType.IMMEDIATE_RENT]: 'Compra Inmediata para Renta'
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

    return warnings;
  }

  private generateAlternatives(scores: ScenarioScore[]): string[] {
    if (scores.length < 2) return [];

    const alternatives: string[] = [];
    const second = scores[1];

    const scenarioNames = {
      [ScenarioType.SAVINGS]: 'Ahorro/Inversión',
      [ScenarioType.FUTURE_PROPERTY]: 'Vivienda a Futuro',
      [ScenarioType.IMMEDIATE_RENT]: 'Compra Inmediata para Renta'
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

  // Preparado para migrar a API en el futuro
  // async saveComparisonToAPI(comparison: ComparisonData): Promise<void> {
  //   const response = await fetch('/api/comparisons', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(comparison),
  //   });
  //   if (!response.ok) throw new Error('Failed to save comparison');
  // }
}

export default new InvestmentComparisonService();
