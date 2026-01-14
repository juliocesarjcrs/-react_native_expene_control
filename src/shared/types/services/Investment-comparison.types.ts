// ~/types/InvestmentComparisonTypes.ts

/**
 * TIPOS PARA COMPARADOR DE INVERSIONES
 * Sistema de comparación financiera para Colombia
 */

// ============================================
// ENUMS Y CONSTANTES
// ============================================

export enum ScenarioType {
  SAVINGS = 'savings',
  FUTURE_PROPERTY = 'futureProperty',
  IMMEDIATE_RENT = 'immediateRent'
}

export enum RiskProfile {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive'
}

export enum TimeHorizon {
  SHORT = 'short', // < 1 año
  MEDIUM = 'medium', // 1-5 años
  LONG = 'long' // > 5 años
}

export enum UserPriority {
  LIQUIDITY = 'liquidity',
  PROFITABILITY = 'profitability',
  SECURITY = 'security',
  CASH_FLOW = 'cashFlow'
}

export enum CapitalizationFrequency {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual'
}

// ============================================
// ESCENARIO A: AHORRO/INVERSIÓN
// ============================================

export interface SavingsScenario {
  id: string;
  name: string;
  initialCapital: number;
  monthlyContribution: number;
  annualRate: number; // Tasa E.A. en %
  horizonMonths: number;
  capitalizationFrequency: CapitalizationFrequency;
  apply4x1000: boolean;
  withholdingTax: number; // % retención en la fuente (default: 7%)
  inflation: number; // % anual (default: 5.5%)
  reinvest: boolean;
  productType?: 'cajitas' | 'cdt';
  cdtCapital?: number;
  cdtTermDays?: number;
}

export interface SavingsResult {
  totalDeposited: number;
  grossEarnings: number;
  fourPerThousandCharge: number; // 4x1000 al entrar y salir
  withholdingAmount: number;
  netEarnings: number;
  finalAmount: number;
  realReturn: number; // Ajustado por inflación
  effectiveAnnualRate: number; // Tasa efectiva después de impuestos
}

// ============================================
// ESCENARIO B: VIVIENDA A FUTURO
// ============================================

export interface FuturePropertyScenario {
  id: string;
  name: string;
  propertyPrice: number;
  downPaymentPercent: number; // % cuota inicial (default: 30% VIS)
  savingMonths: number; // Tiempo acumulando cuota inicial
  monthlyContribution: number;
  savingsRate: number; // Rendimiento del dinero mientras se ahorra
  // Gastos de compra (VIS)
  notaryFees: number; // % (default: 0.54%)
  registrationFees: number; // % (default: 1.67%)
  beneficiaryTax: number; // % (default: 1%)
  ivaPercent: number; // % (default: 0% para VIS)
  // Gastos de adecuación
  refurbishmentCost: number; // default: 30M o % del inmueble
  refurbishmentMonths: number; // Tiempo de adecuación (default: 2)
  // Renta
  monthlyRent: number;
  vacancyMonthsPerYear: number; // default: 1
  monthlyAdministration: number; // Valor fijo (default: 300k)
  administrationAnnualIncrease: number; // % (default: 5%)
  maintenancePercent: number; // % valor inmueble/año (default: 1%)
  propertyTaxPercent: number; // Predial % (default: 0.5-1%)
  rentalIncomeTax: number; // % impuesto renta (default: 0% VIS o 15%)
  propertyAppreciation: number; // % anual (default: 5%)
  horizonMonths: number; // Tiempo total de inversión después de comprar
}

export interface FuturePropertyResult {
  // Fase 1: Ahorro
  savingsPhase: {
    totalSaved: number;
    earningsWhileSaving: number;
    netSavings: number;
  };
  // Fase 2: Compra
  purchasePhase: {
    downPayment: number;
    purchaseCosts: number;
    refurbishmentCost: number;
    totalInitialInvestment: number;
  };
  // Fase 3: Renta
  rentalPhase: {
    totalGrossRent: number;
    totalVacancyCost: number;
    totalAdministration: number;
    totalMaintenance: number;
    totalPropertyTax: number;
    totalIncomeTax: number;
    netRentalIncome: number;
  };
  // Resumen final
  propertyValueAtEnd: number;
  totalCashFlow: number; // Renta neta recibida
  totalInvested: number;
  totalReturn: number; // Valor inmueble + renta neta - inversión
  roi: number; // %
  annualizedReturn: number; // %
  paybackMonths: number; // Meses para recuperar inversión
  netRentalIncome: number;
}

// ============================================
// ESCENARIO C: COMPRA INMEDIATA PARA RENTA
// ============================================

export interface ImmediateRentScenario {
  id: string;
  name: string;
  availableCapital: number; // default: 100M
  propertyPrice: number; // default: 250-350M
  downPaymentPercent: number; // % (default: 30%)
  // Si hay crédito
  mortgageTerm: number; // Meses de crédito (0 si es cash)
  mortgageRate: number; // Tasa E.A. del crédito
  // Gastos de compra
  notaryFees: number; // %
  registrationFees: number; // %
  beneficiaryTax: number; // %
  ivaPercent: number; // %
  // Gastos de adecuación
  refurbishmentCost: number;
  refurbishmentMonths: number;
  // Renta
  monthlyRent: number; // default: 1.3M
  vacancyMonthsPerYear: number; // default: 1
  monthlyAdministration: number; // default: 300k
  administrationAnnualIncrease: number; // %
  maintenancePercent: number; // %
  propertyTaxPercent: number; // %
  rentalIncomeTax: number; // %
  propertyAppreciation: number; // %
  horizonMonths: number; // Horizonte de inversión
}

export interface ImmediateRentResult {
  // Inversión inicial
  downPayment: number;
  mortgageAmount: number;
  purchaseCosts: number;
  refurbishmentCost: number;
  totalInitialInvestment: number;
  // Flujo de caja mensual
  monthlyInflows: number; // Arriendo
  monthlyMortgagePayment: number;
  monthlyOutflows: number; // Admin + mantenimiento + predial + impuestos
  netMonthlyCashFlow: number;
  // Acumulado
  totalGrossRent: number;
  totalMortgagePaid: number;
  totalOperatingExpenses: number;
  totalNetCashFlow: number;
  // Valor final
  propertyValueAtEnd: number;
  mortgageBalanceAtEnd: number;
  equity: number; // Valor inmueble - deuda restante
  // Métricas
  roi: number; // %
  annualizedReturn: number; // %
  paybackMonths: number;
  cashOnCashReturn: number; // % (flujo anual / inversión inicial)
}

// ============================================
// PERFIL DE USUARIO
// ============================================

export interface UserProfile {
  riskProfile: RiskProfile;
  timeHorizon: TimeHorizon;
  priorities: UserPriority[]; // Ordenadas por importancia
}

// ============================================
// COMPARACIÓN Y RECOMENDACIÓN
// ============================================

export interface ComparisonData {
  id: string;
  createdAt: Date;
  userProfile: UserProfile;
  scenarios: {
    savings?: SavingsScenario;
    futureProperty?: FuturePropertyScenario;
    immediateRent?: ImmediateRentScenario;
  };
  results: {
    savings?: SavingsResult;
    futureProperty?: FuturePropertyResult;
    immediateRent?: ImmediateRentResult;
  };
}

export interface ScenarioScore {
  scenarioType: ScenarioType;
  totalScore: number; // 0-100
  scores: {
    profitability: number; // 0-100
    liquidity: number; // 0-100
    security: number; // 0-100
    cashFlow: number; // 0-100
  };
  adjustedReturn: number; // Retorno ajustado por riesgo
}

export interface Recommendation {
  recommendedScenario: ScenarioType;
  scores: ScenarioScore[];
  reasoning: string[]; // Lista de razones de la recomendación
  warnings: string[]; // Advertencias o consideraciones
  alternatives: string[]; // Sugerencias alternativas
}

export interface ComparisonResult {
  comparison: ComparisonData;
  recommendation: Recommendation;
}

// ============================================
// DEFAULTS COLOMBIA 2025
// ============================================

export const DEFAULTS = {
  // Ahorro/Inversión
  NUBANK_CAJITAS_RATE: 8.25, // E.A.
  NUBANK_CDT_RATE: 9.7, // E.A.
  WITHHOLDING_TAX_SAVINGS: 7, // %
  FOUR_PER_THOUSAND: 0.4, // %
  INFLATION_COLOMBIA: 5.5, // %
  UVT_VALUE: 49799, // Valor UVT 2024
  MIN_DAILY_INTEREST_UVT: 0.055, // Umbral mínimo para retención en la fuente

  // Vivienda VIS
  VIS_MAX_VALUE: 239_300_000, // 2025 (actualizar según SMMLV)
  VIS_DOWN_PAYMENT: 30, // %
  VIS_NOTARY_FEES: 0.54, // %
  VIS_REGISTRATION: 1.67, // %
  VIS_BENEFICIARY_TAX: 1, // %
  VIS_IVA: 0, // % (exento para VIS)
  VIS_REFURBISHMENT: 3_000_0000, // COP
  VIS_REFURBISHMENT_MONTHS: 2,

  // Renta
  DEFAULT_RENT: 1300000, // COP
  DEFAULT_ADMINISTRATION: 300000, // COP
  ADMINISTRATION_INCREASE: 5, // % anual
  VACANCY_MONTHS: 1,
  MAINTENANCE_PERCENT: 1, // % del valor del inmueble/año
  PROPERTY_TAX: 0.5, // % (promedio, varía por municipio)
  RENTAL_INCOME_TAX: 15, // % (0% para VIS)
  PROPERTY_APPRECIATION: 5, // % anual

  // Capital y precios
  DEFAULT_CAPITAL: 100000000, // 100M
  PROPERTY_PRICE_MIN: 250000000, // 250M
  PROPERTY_PRICE_MAX: 350000000 // 350M
};
