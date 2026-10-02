/**
 * Detectores, chips y validación para bienes (apartamentos, lotes)
 * Ubicación: src/utils/commentary/assetTemplates.utils.ts
 *
 * Se consulta PRIMERO en getDefaultTemplateConfig(): si devuelve config, ya está;
 * si devuelve null, sigue la cadena normal de detectores.
 *
 * NO importa commentaryTemplates.utils (evita ciclo). Solo depende de
 * commentaryDate.utils y assetConcepts.
 */
import dayjs from 'dayjs';
import {
  SubcategoryTemplateConfig,
  TemplateChip,
  CommentaryValidationResult
} from '~/shared/types/screens/settings/commentary-templates.types';
import { ASSET_CONCEPTS, resolveAssetConcept } from '~/utils/commentaryParser/assetConcepts';
import { normalizeMonthAbbr } from './commentaryDate.utils';

// ============================================================
// DETECCIÓN
// ============================================================

/**
 * Debe coincidir con INCOME_CATEGORY_OFFSET (CreateIncomeScreen).
 * Los ids de ingreso son categoryId + 100000.
 * TODO: importar la constante real en lugar de duplicarla.
 */
const INCOME_ID_THRESHOLD = 100000;

/**
 * Un gasto es de un bien solo si el NOMBRE de la subcategoría trae una palabra de
 * esta lista (opt-in). Con la lista inversa (excluir lo que no es bien) se colaban
 * subcategorías como "Emigrar" o "Declaración renta".
 * Para un bien nuevo con otro tipo de nombre, agrega la palabra aquí.
 */
export const ASSET_NAME_KEYWORDS = [
  'apt',
  'apto',
  'apartamento',
  'torre',
  'lote',
  'casa',
  'finca',
  'bodega',
  'parqueadero',
  'oficina'
];

/**
 * Nombres que, aunque traigan una palabra de arriba, conservan su plantilla actual:
 *  - cuotas de crédito/hipoteca (siguen con el chip "Cuota # n/N")
 *  - "Compra Apto": pagos por cuotas previos a la escritura (isMortgage)
 */
export const ASSET_EXCLUDED_NAMES = [
  'cuota',
  'prestamo',
  'préstamo',
  'credito',
  'crédito',
  'hipotec',
  'compra apto'
];

/** Palabra completa (los \b de JS no manejan tildes): "Torre 2 Apt 1102" ✓, "adaptación" ✗ */
const hasAssetKeyword = (n: string): boolean =>
  ASSET_NAME_KEYWORDS.some((k) => new RegExp(`(^|[^a-záéíóúñ])${k}([^a-záéíóúñ]|$)`).test(n));

export const isAssetExpense = (subcategoryId: number, n: string, cat: string): boolean =>
  subcategoryId < INCOME_ID_THRESHOLD &&
  cat.includes('bancario') &&
  cat.includes('inversi') &&
  hasAssetKeyword(n) &&
  !ASSET_EXCLUDED_NAMES.some((k) => n.includes(k));

/** Ingreso de un bien: categoría de ingreso (id con offset) cuyo nombre contiene "arriendo". */
export const isAssetIncome = (subcategoryId: number, n: string): boolean =>
  subcategoryId >= INCOME_ID_THRESHOLD && (n.includes('arriendo') || n.includes('arrendamiento'));

// ============================================================
// CHIPS
// ============================================================

const monthYear = (): string => {
  const today = dayjs();
  return `${normalizeMonthAbbr(today.format('MMM'))} ${today.year()}`;
};

const buildExpenseChips = (): TemplateChip[] => {
  const my = monthYear();
  const year = dayjs().year();

  return [
    // ── Adquisición (investment) ──
    {
      label: 'Abono',
      icon: 'cash-plus',
      template: 'Abono: antes de escrituras',
      hint: 'Pago parcial antes de firmar escrituras'
    },
    {
      label: 'Saldo',
      icon: 'cash-check',
      template: 'Saldo: firma de escrituras',
      hint: 'Pago restante el día de la firma'
    },
    {
      label: 'Promesa',
      icon: 'file-sign',
      template: 'Promesa: compraventa',
      hint: 'Pago de la promesa de compraventa'
    },
    {
      label: 'Escrituración',
      icon: 'file-certificate',
      template: 'Escrituración: notariales 2,3% [Valor escritura $130.000.000]',
      hint: 'Gastos notariales/registro + valor de la escritura entre corchetes'
    },
    {
      label: '4x1000',
      icon: 'bank-transfer',
      template: '4x1000: Nubank a Bancolombia $73.000.000',
      hint: 'Monto transferido al final. Hereda la naturaleza del pago (inversión u operación)'
    },
    {
      label: 'Mejora',
      icon: 'hammer',
      template: 'Mejora: descripción',
      hint: 'Obra que aumenta el valor del bien (cuenta como capital)'
    },
    // ── Préstamo del bien ──
    {
      label: 'Intereses',
      icon: 'cash-minus',
      template: `Intereses: ${my} [Tasa 14,5% EA] [Saldo $85.000.000]`,
      hint: 'Intereses del mes (operación). Saldo = capital que queda debiendo según el extracto'
    },
    {
      label: 'Abono capital',
      icon: 'bank-transfer-in',
      template: `Abono capital: ${my} [Saldo $70.000.000]`,
      hint: 'Pago a la deuda — NO es costo del bien. Saldo = lo que queda debiendo'
    },
    // ── Operación (operational) ──
    {
      label: 'Administración',
      icon: 'office-building',
      template: `Administración: ${my}`,
      hint: 'Cuota de administración — indica el mes que cubre'
    },
    {
      label: 'Predial',
      icon: 'file-percent',
      template: `Predial: ${year}`,
      hint: 'Impuesto predial — indica el año que cubre'
    },
    {
      label: 'Seguro',
      icon: 'shield-home',
      template: `Seguro: Incendio y terremoto ${year}`,
      hint: 'Póliza del bien — indica el período que cubre'
    },
    {
      label: 'Mantenimiento',
      icon: 'wrench',
      template: 'Mantenimiento: descripción',
      hint: 'Reparación o arreglo que restaura algo existente'
    },
    {
      label: 'Comisión',
      icon: 'percent',
      template: `Comisión: inmobiliaria ${my}`,
      hint: 'Comisión de administración de arriendo'
    },
    {
      label: 'Otros',
      icon: 'dots-horizontal',
      template: 'Otros: descripción',
      hint: 'Gasto operativo que no encaja en los anteriores'
    }
  ];
};

const buildIncomeChips = (): TemplateChip[] => {
  const my = monthYear();

  return [
    {
      label: 'Arriendo',
      icon: 'home-account',
      template: `Arriendo: ${my}`,
      hint: 'Canon del mes completo'
    },
    {
      label: 'Parcial',
      icon: 'calendar-range',
      template: `Arriendo: 15 días ${my} [Parcial]`,
      hint: 'Canon proporcional por días'
    },
    {
      label: 'Reembolso',
      icon: 'cash-refund',
      template: `Reembolso: administración ${my}`,
      hint: 'El inquilino reembolsa un gasto (se resta de esa cubeta)'
    },
    {
      label: 'Depósito',
      icon: 'safe',
      template: 'Depósito: garantía [Inquilino]',
      hint: 'Depósito en garantía — NO cuenta como ingreso'
    }
  ];
};

// ============================================================
// CONFIGS
// ============================================================

const buildAssetExpenseConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => ({
  subcategoryId,
  subcategoryName,
  categoryName,
  assistanceLevel: 'structured',
  parserType: 'asset',
  chips: buildExpenseChips(),
  smartPlaceholder: `Ej: Administración: ${monthYear()}`,
  enableValidation: true
});

const buildAssetIncomeConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig => ({
  subcategoryId,
  subcategoryName,
  categoryName,
  assistanceLevel: 'structured',
  parserType: 'asset',
  chips: buildIncomeChips(),
  smartPlaceholder: `Ej: Arriendo: ${monthYear()}`,
  enableValidation: true
});

/** Punto de entrada: config de bien (gasto o ingreso) o null si no es un bien. */
export const getAssetTemplateConfig = (
  subcategoryId: number,
  subcategoryName: string,
  categoryName: string
): SubcategoryTemplateConfig | null => {
  const n = subcategoryName.toLowerCase().trim();
  const cat = categoryName.toLowerCase().trim();

  if (isAssetExpense(subcategoryId, n, cat))
    return buildAssetExpenseConfig(subcategoryId, subcategoryName, categoryName);
  if (isAssetIncome(subcategoryId, n))
    return buildAssetIncomeConfig(subcategoryId, subcategoryName, categoryName);
  return null;
};

// ============================================================
// VALIDACIÓN (regex liviano, sin importar el parser completo)
// ============================================================

export const validateAssetCommentary = (text: string): CommentaryValidationResult => {
  const head = text.match(/^([^:\n]{1,30}):\s*(\S[\s\S]*)$/);
  if (!head) return { state: 'warning', message: 'Formato: Concepto: detalle [período]' };

  const concept = resolveAssetConcept(head[1]);
  if (!concept) return { state: 'warning', message: `Concepto no reconocido: "${head[1].trim()}"` };

  if (ASSET_CONCEPTS[concept].recurring && !/\b20\d{2}\b/.test(head[2]))
    return { state: 'warning', message: 'Falta el período con año (ej: Mar 2026 o 2026)' };

  if (concept === 'downPayment' && /capital/i.test(head[2]))
    return { state: 'warning', message: 'Para pagos a la deuda usa "Abono capital:"' };

  return { state: 'valid' };
};
