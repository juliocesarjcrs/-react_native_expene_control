/**
 * Orquestador principal de parsers de comentarios
 * Ubicación: src/utils/commentaryParser/index.ts
 *
 * Punto de entrada único para parsear cualquier comentario.
 * Detecta automáticamente qué parser aplica según la categoría/subcategoría.
 *
 * Uso:
 *   import { parseCommentary, getParserType } from '~/utils/commentaryParser';
 */

// ─────────────────────────────────────────────
// RE-EXPORTS — importar desde aquí, no desde cada parser
// ─────────────────────────────────────────────

import { UtilityConsumption } from '~/shared/types/utils/commentaryParser/utility-analysis.types';
import { ProductPrice } from '~/shared/types/utils/commentaryParser/product-analysis.types';
import { RetentionData } from '~/shared/types/utils/commentaryParser/retention-analysis.types';
import { TransportData } from '~/shared/types/utils/commentaryParser/transport-analysis.types';
import { FamilyAidData } from '~/shared/types/utils/commentaryParser/family-aid-analysis.types';
import { NutritionData } from '~/shared/types/utils/commentaryParser/nutrition-analysis.types';
import { SportsData } from '~/shared/types/utils/commentaryParser/sports-analysis.types';
import { RentData } from '~/shared/types/utils/commentaryParser/rent-analysis.types';
import { CopagoData } from '~/shared/types/utils/commentaryParser/copago-analysis.types';
import { VacationData } from '~/shared/types/utils/commentaryParser/vacation-analysis.types';

import { parseUtilityCommentary } from './utilityParser';
import { parseProductCommentary } from './productParser';
import { parseRetentionCommentary } from './retentionParser';
import { parseTransportCommentary } from './transportParser';
import { parseFamilyAidCommentary } from './familyAidParser';
import { parseNutritionCommentary } from './nutritionParser';
import { parseSportsCommentary } from './sportsParser';
import { parseRentCommentary } from './rentParser';
import { parseCopagoCommentary } from './copagoParser';
import { parseVacationCommentary } from './vacationParser';

export { parseUtilityCommentary, calculateConsumptionPerPerson } from './utilityParser';
export { parseProductCommentary } from './productParser';
export {
  parseRetentionCommentary,
  calculateTotalRetention,
  calculateTotalRetentionWithPrimas,
  calculateIncapacidadStats
} from './retentionParser';
export { parseTransportCommentary, getMostFrequentRoutes } from './transportParser';
export { parseFamilyAidCommentary, getTotalByPerson } from './familyAidParser';
export { parseNutritionCommentary, getAvgCostPerWeek } from './nutritionParser';
export { parseSportsCommentary, getTotalByExpenseType } from './sportsParser';
export { parseRentCommentary } from './rentParser';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type ParserType =
  | 'utility'
  | 'product'
  | 'retention'
  | 'transport'
  | 'familyAid'
  | 'nutrition'
  | 'sports'
  | 'rent'
  | 'copago'
  | 'vacation'
  | 'none';

export type ParsedCommentary =
  | { type: 'utility'; data: UtilityConsumption }
  | { type: 'product'; data: ProductPrice }
  | { type: 'retention'; data: RetentionData }
  | { type: 'transport'; data: TransportData }
  | { type: 'familyAid'; data: FamilyAidData }
  | { type: 'nutrition'; data: NutritionData }
  | { type: 'sports'; data: SportsData }
  | { type: 'rent'; data: RentData }
  | { type: 'copago'; data: CopagoData }
  | { type: 'vacation'; data: VacationData }
  | { type: 'none'; data: null };

// ─────────────────────────────────────────────
// MAPA: subcategoryId → ParserType
//
// Añade aquí cada subcategoría que tenga parser.
// IDs sacados del historial real (commentary_history_{id}).
// ─────────────────────────────────────────────

const SUBCATEGORY_PARSER_MAP: Record<number, ParserType> = {
  // ── Vivienda ──────────────────────────────
  // Luz
  674: 'utility',
  // Agua
  664: 'utility',
  // Gas
  984: 'utility',
  // Arriendo
  624: 'rent',

  // ── Alimentación ─────────────────────────
  // Proteínas
  1473: 'product',
  // Mercado
  694: 'product',
  // Licores
  944: 'product',

  // ── Nómina / Retenciones ─────────────────
  // Retenciones Julio
  300: 'retention',
  // Retenciones Silvia
  301: 'retention',

  // ── Transporte ────────────────────────────
  // Taxi
  724: 'transport',
  // Bus / Metrolinea
  734: 'transport',
  // Uber / Beat / InDrive
  714: 'transport',
  // Transporte del Trabajo
  894: 'transport',
  // Transporte a clase inglés
  1467: 'transport',

  // ── Regalos ───────────────────────────────
  // Ayuda/regalos familiares (ID real del historial)
  1154: 'familyAid',

  // ── Salud ─────────────────────────────────
  // Nutrición
  1465: 'nutrition',
  1444: 'copago',

  // ── Cultura / Deportes ────────────────────
  // Deportes
  1344: 'sports'
};

// ─────────────────────────────────────────────
// API PÚBLICA
// ─────────────────────────────────────────────

/**
 * Devuelve el ParserType asociado a una subcategoría.
 * Útil para saber qué parser aplica antes de llamar a parseCommentary().
 */
export const getParserType = (subcategoryId: number): ParserType =>
  SUBCATEGORY_PARSER_MAP[subcategoryId] ?? 'none';

/**
 * Parsea un comentario usando el parser correcto para la subcategoría.
 *
 * @param subcategoryId  ID de la subcategoría del gasto
 * @param commentary     Texto del comentario
 * @param cost           Monto del gasto
 * @param date           Fecha ISO del gasto
 * @param category       Nombre de la categoría (requerido para retenciones)
 * @param baseSalary     Salario base (opcional, solo para retenciones)
 */
export const parseCommentary = (
  subcategoryId: number,
  commentary: string,
  cost: number,
  date: string,
  category?: string,
  baseSalary?: number
): ParsedCommentary => {
  console.log('[subcategoryId]', subcategoryId);
  const parserType = getParserType(subcategoryId);

  switch (parserType) {
    case 'utility': {
      const data = parseUtilityCommentary(commentary, cost, date);
      return data ? { type: 'utility', data } : { type: 'none', data: null };
    }
    case 'product': {
      const data = parseProductCommentary(commentary, cost, date);
      return data ? { type: 'product', data } : { type: 'none', data: null };
    }
    case 'retention': {
      const data = parseRetentionCommentary(commentary, cost, date, category ?? '', baseSalary);
      return data ? { type: 'retention', data } : { type: 'none', data: null };
    }
    case 'transport': {
      const data = parseTransportCommentary(commentary, cost, date);
      return data ? { type: 'transport', data } : { type: 'none', data: null };
    }
    case 'familyAid': {
      const data = parseFamilyAidCommentary(commentary, cost, date);
      return data ? { type: 'familyAid', data } : { type: 'none', data: null };
    }
    case 'copago': {
      const data = parseCopagoCommentary(commentary, cost, date);
      return data ? { type: 'copago', data } : { type: 'none', data: null };
    }
    case 'nutrition': {
      const data = parseNutritionCommentary(commentary, cost, date);
      return data ? { type: 'nutrition', data } : { type: 'none', data: null };
    }
    case 'sports': {
      const data = parseSportsCommentary(commentary, cost, date);
      return data ? { type: 'sports', data } : { type: 'none', data: null };
    }
    case 'rent': {
      const data = parseRentCommentary(commentary, cost, date);
      return data ? { type: 'rent', data } : { type: 'none', data: null };
    }
    case 'vacation': {
      const data = parseVacationCommentary(commentary, cost, date);
      return data ? { type: 'vacation', data } : { type: 'none', data: null };
    }

    default:
      return { type: 'none', data: null };
  }
};

/**
 * Registra o actualiza la asociación subcategoría → parser.
 * Útil si los IDs reales difieren del mapa inicial.
 *
 * Llamar en la inicialización de la app o desde Settings si fuera necesario.
 */
export const registerSubcategoryParser = (subcategoryId: number, parserType: ParserType): void => {
  SUBCATEGORY_PARSER_MAP[subcategoryId] = parserType;
};
