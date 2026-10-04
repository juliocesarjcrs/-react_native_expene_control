/**
 * Catálogo de conceptos de bienes — fuente única para parser, chips y validación.
 * Ubicación: src/utils/commentaryParser/assetConcepts.ts
 *
 * Sin dependencias (solo tipos) para poder importarlo desde cualquier capa
 * sin crear ciclos.
 */
import {
  AssetBucket,
  AssetConcept,
  AssetDirection,
  AssetExpectedNature
} from '~/shared/types/utils/commentaryParser/asset-analysis.types';

export interface AssetConceptInfo {
  /** Etiqueta canónica (la que escriben los chips) */
  label: string;
  /** Alias normalizados: minúsculas, sin tildes, sin espacios */
  aliases: string[];
  bucket: AssetBucket;
  direction: AssetDirection;
  expectedNature: AssetExpectedNature;
  /** Exige período en el comentario */
  recurring: boolean;
  /**
   * Papel en el capital del bien (solo para nature = investment):
   *  'cost'          → suma al costo total del bien
   *  'debtRepayment' → paga deuda: NO suma al costo (la compra ya lo incluye)
   *  null            → no aplica (operación, ingresos, o hereda como el 4x1000)
   */
  capitalRole: 'cost' | 'debtRepayment' | null;
}

export const ASSET_CONCEPTS: Record<AssetConcept, AssetConceptInfo> = {
  // ── Adquisición ──
  promise: {
    label: 'Promesa',
    aliases: ['promesa'],
    bucket: 'purchase',
    direction: 'expense',
    expectedNature: 'investment',
    recurring: false,
    capitalRole: 'cost'
  },
  downPayment: {
    label: 'Abono',
    aliases: ['abono'],
    bucket: 'purchase',
    direction: 'expense',
    expectedNature: 'investment',
    recurring: false,
    capitalRole: 'cost'
  },
  balance: {
    label: 'Saldo',
    aliases: ['saldo', 'restante'],
    bucket: 'purchase',
    direction: 'expense',
    expectedNature: 'investment',
    recurring: false,
    capitalRole: 'cost'
  },
  closingCosts: {
    label: 'Escrituración',
    aliases: ['escrituracion', 'escritura'],
    bucket: 'acquisitionCosts',
    direction: 'expense',
    expectedNature: 'investment',
    recurring: false,
    capitalRole: 'cost'
  },
  bankTax: {
    label: '4x1000',
    aliases: ['4x1000', '4xmil', '4pormil', 'gmf'],
    bucket: 'acquisitionCosts',
    direction: 'expense',
    expectedNature: null, // hereda la nature del pago que lo originó
    recurring: false,
    capitalRole: null
  },
  improvement: {
    label: 'Mejora',
    aliases: ['mejora', 'remodelacion'],
    bucket: 'improvement',
    direction: 'expense',
    expectedNature: 'investment',
    recurring: false,
    capitalRole: 'cost'
  },
  // ── Operación ──
  adminFee: {
    label: 'Administración',
    aliases: ['administracion'],
    bucket: 'admin',
    direction: 'expense',
    expectedNature: 'operational',
    recurring: true,
    capitalRole: null
  },
  propertyTax: {
    label: 'Predial',
    aliases: ['predial', 'impuesto', 'impuestos', 'impuestopredial'],
    bucket: 'taxes',
    direction: 'expense',
    expectedNature: 'operational',
    recurring: true,
    capitalRole: null
  },
  insurance: {
    label: 'Seguro',
    aliases: ['seguro'],
    bucket: 'insurance',
    direction: 'expense',
    expectedNature: 'operational',
    recurring: true,
    capitalRole: null
  },
  maintenance: {
    label: 'Mantenimiento',
    aliases: ['mantenimiento', 'reparacion'],
    bucket: 'repairs',
    direction: 'expense',
    expectedNature: 'operational',
    recurring: false,
    capitalRole: null
  },
  commission: {
    label: 'Comisión',
    aliases: ['comision'],
    bucket: 'commissions',
    direction: 'expense',
    expectedNature: 'operational',
    recurring: true,
    capitalRole: null
  },
  utilities: {
    label: 'Servicios',
    aliases: ['servicios', 'servicio'],
    bucket: 'utilities',
    direction: 'expense',
    expectedNature: 'operational',
    recurring: true,
    capitalRole: null
  },
  other: {
    label: 'Otros',
    aliases: ['otros', 'otro'],
    bucket: 'other',
    direction: 'expense',
    expectedNature: 'operational',
    recurring: false,
    capitalRole: null
  },
  // ── Financiación ──
  interest: {
    label: 'Intereses',
    aliases: ['intereses', 'interes'],
    bucket: 'interest',
    direction: 'expense',
    expectedNature: 'operational',
    recurring: true,
    capitalRole: null
  },
  principalPayment: {
    label: 'Abono capital',
    aliases: ['abonocapital', 'abonoacapital'],
    bucket: 'principal',
    direction: 'expense',
    expectedNature: 'investment',
    recurring: true,
    capitalRole: 'debtRepayment'
  },
  // ── Ingresos ──
  rentIncome: {
    label: 'Arriendo',
    aliases: ['arriendo'],
    bucket: 'rent',
    direction: 'income',
    expectedNature: null,
    recurring: true,
    capitalRole: null
  },
  reimbursement: {
    label: 'Reembolso',
    aliases: ['reembolso'],
    bucket: 'reimbursement',
    direction: 'income',
    expectedNature: null,
    recurring: true,
    capitalRole: null
  },
  securityDeposit: {
    label: 'Depósito',
    aliases: ['deposito'],
    bucket: 'deposit',
    direction: 'income',
    expectedNature: null,
    recurring: false,
    capitalRole: null
  },
  sale: {
    label: 'Venta',
    aliases: ['venta'],
    bucket: 'sale',
    direction: 'income',
    expectedNature: null,
    recurring: false,
    capitalRole: null
  }
};

/** minúsculas + sin tildes + sin espacios: "4 x mil" → "4xmil", "Escrituración" → "escrituracion" */
export const normalizeConceptKey = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/×/g, 'x') // el teclado del celular escribe "4× mil"
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')
    .replace(/\s+/g, '');

/** Para comparar nombres de bienes: "Apt. 1102" y "APT 1102" son el mismo. */
export const normalizeAlias = (raw: string): string =>
  normalizeConceptKey(raw).replace(/[^a-z0-9ñ]/g, '');

/** Devuelve el concepto para un prefijo de comentario o null si no se reconoce. */
export const resolveAssetConcept = (rawLabel: string): AssetConcept | null => {
  const key = normalizeConceptKey(rawLabel);
  const entries = Object.entries(ASSET_CONCEPTS) as [AssetConcept, AssetConceptInfo][];
  for (const [concept, info] of entries) {
    if (info.aliases.includes(key)) return concept;
  }
  return null;
};
