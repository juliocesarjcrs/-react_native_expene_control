/**
 * Tipos internos para los parsers OCR
 * Se integra con los tipos existentes del proyecto en receipt-scanner.type.ts
 */

import { Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';

/**
 * Mapeo de ReceiptType a nombres de tienda para el formato estándar
 */
export const STORE_NAME_MAP: Record<ReceiptType, string> = {
  SuperCarnesJH: 'SuperCarnesJH',
  FruverLaGranja: 'FruverLaGranja',
  Carulla: 'Carulla',
  Exito: 'Exito',
  D1: 'D1',
  DollarCity: 'DollarCity',
  Ara: 'Ara',
  Falabella: 'Falabella',
  CruzVerde: 'CruzVerde',
  Otros: 'Otros'
};

/**
 * Tipos de tiendas que soportan información de peso
 */
export const STORES_WITH_WEIGHT: ReceiptType[] = [
  'SuperCarnesJH',
  'FruverLaGranja',
  'Carulla',
  'Exito'
];

/**
 * Tipos de tiendas que soportan descuentos
 */
export const STORES_WITH_DISCOUNTS: ReceiptType[] = ['Carulla', 'Exito'];

/**
 * Unidades de medida soportadas
 */
export type Unit = 'kg' | 'un';

/**
 * Información de descuento (Carulla/Éxito)
 */
export interface DiscountInfo {
  /** Precio original por kg */
  originalPricePerKg: number;

  /** Precio final por kg */
  finalPricePerKg: number;

  /** Ahorro total en pesos */
  savingsAmount: number;

  /** Porcentaje de descuento */
  savingsPercentage: number;
}

/**
 * Opciones de formateo para descripciones
 */
export interface FormatOptions {
  /** Incluir tag de tienda (default: true) */
  includeStoreTag?: boolean;

  /** Locale para formateo de números (default: 'es-CO') */
  locale?: string;

  /** Decimales para cantidades (default: 3) */
  quantityDecimals?: number;

  /** Redondear precios (default: true) */
  roundPrices?: boolean;
}

/**
 * Constantes de formato estándar colombiano
 */
export const FORMAT_CONSTANTS = {
  /** Separador entre nombre y detalles */
  SEPARATOR: '—',

  /** Símbolo de precio */
  PRICE_SYMBOL: '@',

  /** Símbolo de moneda */
  CURRENCY: '$',

  /** Locale colombiano */
  LOCALE: 'es-CO',

  /** Tags de tienda */
  STORE_TAGS: {
    SuperCarnesJH: '[SuperCarnesJH]',
    FruverLaGranja: '[FruverLaGranja]',
    Carulla: '[Carulla]',
    Exito: '[Exito]',
    D1: '[D1]',
    DollarCity: '[DollarCity]',
    Ara: '[Ara]',
    Falabella: '[Falabella]',
    CruzVerde: '[CruzVerde]',
    Otros: '[Otros]'
  } as const
} as const;

/**
 * Expresiones regulares comunes para parsers
 */
export const REGEX_PATTERNS = {
  /** Patrón para productos con peso y descuento (Carulla/Éxito) */
  KGM_PATTERN: /(\d+(?:\.\s?\d+)?)\/(KGM)\s+[x*]\s+([\d.,]+)\s+V\.\s+Ahorro\s+([\d.,]+)/i,

  /** Patrón para productos con peso simple */
  SIMPLE_KG_PATTERN: /(\d+\.?\d*)\s*kg\s*a\s*\$?([\d.,]+)\s*\/kg/i,

  /** Patrón para productos por unidad */
  UNIT_PATTERN: /(\d+)\s*un\s*a\s*\$?([\d.,]+)/i,

  /** Patrón para detectar Éxito */
  EXITO_PATTERN: /EXITO|ALMACENES.*EXITO/i,

  /** Patrón para limpiar precios */
  PRICE_CLEAN: /[.,]/g,

  /** Patrón para punto final */
  TRAILING_PERIOD: /\.$/,

  /** Patrón para espacios múltiples */
  MULTIPLE_SPACES: /\s{2,}/g
} as const;

/**
 * Función de parsing genérica
 */
export type ParserFunction = (lines: string[], joined: string) => Product[];

/**
 * Configuración de parser por tipo de recibo
 */
export interface ParserConfig {
  /** Tipo de recibo */
  type: ReceiptType;

  /** Función de parsing */
  parse: ParserFunction;

  /** Patrones de detección */
  detectionPatterns?: RegExp[];

  /** Soporta productos con peso */
  supportsWeight: boolean;

  /** Soporta descuentos */
  supportsDiscounts: boolean;
}

/**
 * Ejemplos de formato para cada tipo de producto
 */
export const FORMAT_EXAMPLES = {
  weighted: 'Hígado — 0.525 kg @ $22.000/kg [SuperCarnesJH]',
  unit: 'Leche Entera — 1 un @ $2.400 [Carulla]',
  discounted: 'Remolacha — 0.305 kg @ $6.540/kg (antes $9.340/kg, -30%) [Carulla]',
  simple: 'Harina De Mai [D1]'
} as const;
