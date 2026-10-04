/**
 * Tipos de la analítica de bienes (Fase 2)
 * Ubicación: src/shared/types/utils/commentaryParser/asset-metrics.types.ts
 */

/** Forma mínima de un gasto/ingreso tal como lo devuelve el backend. */
export interface AssetRecord {
  id: number;
  cost: number;
  commentary: string;
  nature: 'investment' | 'operational';
  /** ISO "YYYY-MM-DD" (o con hora). Solo se usan año y mes. */
  date: string;
}

export type OpexBucket =
  'admin' | 'taxes' | 'insurance' | 'repairs' | 'commissions' | 'utilities' | 'other';

export type AssetWarningCode =
  | 'natureMismatch' //     el concepto espera otra nature que la guardada
  | 'unparsed' //           comentario sin formato (se clasifica solo por nature)
  | 'missingPeriod' //      concepto recurrente sin período con año
  | 'wrongDirection' //     concepto de ingreso en un gasto o viceversa
  | 'debtBalanceMissing' // hay préstamo pero ningún [Saldo $...]
  | 'annualized' //         ventana < 12 meses: cifras anualizadas
  | 'unassignedIncome' //   ingresos de la categoría sin [Bien: ...] (o sin formato)
  | 'badDate' //            fecha no reconocida: cuenta como costo pero no entra a los meses
  | 'ignored'; //           concepto sin efecto (p. ej. Venta)

export interface AssetWarning {
  code: AssetWarningCode;
  id?: number;
  /** De qué lista viene `id` (los ids de gastos e ingresos pueden coincidir) */
  source?: 'expense' | 'income';
  message: string;
}

export interface AssetMonthRow {
  /** "YYYY-MM" */
  month: string;
  rent: number;
  opex: Record<OpexBucket, number>;
  /** Suma de opex SIN intereses */
  opexTotal: number;
  interest: number;
  /** rent − opexTotal */
  net: number;
  /** net − interest */
  netAfterInterest: number;
}

export interface AssetMetrics {
  cost: {
    /** Promesa + Abono + Saldo */
    purchase: number;
    /** Escrituración + 4x1000 de compra */
    acquisitionCosts: number;
    improvements: number;
    /** investment sin formato (p. ej. "Cuota # 18/23"): cuenta como costo */
    unclassified: number;
    total: number;
    /** Último [Valor escritura $...] registrado */
    deedValue: number | null;
    /** purchase + unclassified */
    paidTowardPrice: number;
    /** deedValue − paidTowardPrice (>0: faltan pagos por registrar) */
    purchaseGap: number | null;
  };
  debt: {
    hasLoan: boolean;
    /** null = hay préstamo pero no se registró [Saldo $...] */
    balance: number | null;
    asOfDate: string | null;
    interestPaid: number;
    principalPaid: number;
  };
  /** costo total − deuda. null si la deuda es desconocida */
  equity: number | null;
  /** Depósitos en garantía recibidos (NO son ingreso) */
  depositsHeld: number;
  monthly: AssetMonthRow[];
  window: { start: string | null; end: string; months: number; annualized: boolean };
  /** Valores de la ventana, anualizados (×12/months) */
  annual: {
    rent: number;
    opex: number;
    opexByBucket: Record<OpexBucket, number>;
    interest: number;
    net: number;
    netAfterInterest: number;
    averageMonthlyNet: number;
  };
  yields: {
    /** renta anual / costo total */
    gross: number | null;
    /** (renta − opex) / costo total — antes de intereses */
    net: number | null;
    /** (renta − opex − intereses) / costo total */
    netAfterInterest: number | null;
    /** (renta − opex − intereses) / capital propio */
    onEquity: number | null;
  };
  payback: {
    /** costo total / neto anual (antes de intereses) */
    years: number | null;
    /** capital propio / neto anual después de intereses */
    equityYears: number | null;
  };
  warnings: AssetWarning[];
}

export interface ComputeAssetMetricsInput {
  expenses: AssetRecord[];
  incomes: AssetRecord[];
  /** ISO de "hoy" — se pasa explícito para que el cálculo sea determinista */
  asOf: string;
  /** 'accrual' reparte por período cubierto (default); 'cash' usa la fecha de pago */
  basis?: 'accrual' | 'cash';
  /** Incluir el mes de asOf en la ventana (default false: solo meses completos) */
  includeCurrentMonth?: boolean;
  /**
   * Nombres del bien tal como van en [Bien: ...]. Si se pasan, de `incomes` solo cuentan
   * los que traen una etiqueta que coincida; sin ellos se cuentan todos.
   */
  propertyAliases?: string[];
}
