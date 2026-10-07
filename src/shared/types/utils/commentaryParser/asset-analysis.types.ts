/**
 * Tipos del parser de bienes (apartamentos, lotes)
 * Ubicación: src/shared/types/utils/commentaryParser/asset-analysis.types.ts
 *
 * Gramática del comentario:  Concepto: detalle [Período] [Etiqueta]
 */

/** Concepto = prefijo del comentario (antes de los dos puntos). */
export type AssetConcept =
  // ── Adquisición (nature: investment) ──
  | 'promise' //         Promesa
  | 'downPayment' //     Abono
  | 'balance' //         Saldo
  | 'closingCosts' //    Escrituración
  | 'bankTax' //         4x1000 (hereda la nature del pago que lo causó)
  | 'improvement' //     Mejora
  // ── Operación (nature: operational) ──
  | 'adminFee' //        Administración
  | 'propertyTax' //     Predial / Impuesto
  | 'insurance' //       Seguro
  | 'maintenance' //     Mantenimiento / Reparación
  | 'commission' //      Comisión
  | 'utilities' //       Servicios
  | 'other' //           Otros
  // ── Hereda la nature del gasto (compra → costo del bien; operación → gasto) ──
  | 'procedure' //       Trámite / Autenticar (notaría, copias, certificados)
  // ── Financiación (préstamo del bien) ──
  | 'interest' //        Intereses (operational)
  | 'principalPayment' // Abono capital (reduce deuda; NO es costo del bien)
  // ── Ingresos ──
  | 'rentIncome' //      Arriendo
  | 'reimbursement' //   Reembolso
  | 'securityDeposit' // Depósito (NO es ingreso, es pasivo)
  | 'sale'; //           Venta (reservado)

/** Cubeta de análisis: agrupa conceptos para las estadísticas. */
export type AssetBucket =
  | 'purchase'
  | 'acquisitionCosts'
  | 'improvement'
  | 'admin'
  | 'taxes'
  | 'insurance'
  | 'repairs'
  | 'commissions'
  | 'utilities'
  | 'other'
  | 'interest'
  | 'principal'
  | 'rent'
  | 'reimbursement'
  | 'deposit'
  | 'sale';

export type AssetDirection = 'expense' | 'income';

/** `null` = no aplica o hereda (4x1000) / es ingreso. */
export type AssetExpectedNature = 'investment' | 'operational' | null;

/** Período cubierto por el comentario (no es la fecha de pago). */
export interface AssetPeriod {
  startYear: number;
  startMonth: number; // 1-12
  endYear: number;
  endMonth: number; // 1-12
  /** Cantidad de meses cubiertos (Predial 2026 → 12) */
  months: number;
  /** true cuando el comentario solo trae el año ("Predial: 2026") */
  isAnnual: boolean;
  /**
   * Reparto por días entre los meses del período (suma 1), alineado con los meses
   * desde startYear/startMonth. Solo existe cuando el comentario trae fechas
   * ("15 Oct - 14 Nov 2026"); sin él, el reparto es en partes iguales.
   */
  weights?: number[];
}

export interface AssetData {
  concept: AssetConcept;
  bucket: AssetBucket;
  direction: AssetDirection;
  expectedNature: AssetExpectedNature;
  /** El concepto exige período (Administración, Predial, Arriendo...) */
  recurring: boolean;

  cost: number;
  /** Fecha ISO del gasto/ingreso (fallback cuando no hay período) */
  date: string;

  /** Texto después de "Concepto:" sin etiquetas [..] */
  detail: string;
  period?: AssetPeriod;

  /** [Valor escritura $320.000.000] — valor de compra del bien */
  deedValue?: number;
  /** Primer monto "$..." dentro del detalle (ej: monto transferido en 4x1000) */
  referenceAmount?: number;
  /** Porcentaje del detalle (ej: 2,3% notariales) */
  percentage?: number;

  /** [Bien: Apt 1102] — a qué bien pertenece (ingresos de una categoría compartida) */
  property?: string;

  /** Arriendo proporcional */
  isPartial: boolean;
  partialDays?: number;

  /** [Saldo $85.000.000] — capital que queda debiendo (Intereses / Abono capital) */
  debtBalance?: number;
  /** [Tasa 14,5% EA] — tasa tal como se escribió (14.5) y su base ("EA") */
  rate?: number;
  rateType?: string;

  /** Etiquetas [..] sin incluir las que se extraen a campos propios */
  tags: string[];
}
