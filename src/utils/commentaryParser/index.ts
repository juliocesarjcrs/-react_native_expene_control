/**
 * Parsers de comentarios: punto de entrada único
 * Ubicación: src/utils/commentaryParser/index.ts
 *
 * Re-exporta los parsers y define ParserType.
 *
 * Qué parser corresponde a cada subcategoría NO se decide aquí:
 *   - las pantallas llaman al parser que les toca (ej. useProductData → parseProductCommentary)
 *   - los chips y la validación detectan por NOMBRE de subcategoría
 *     (commentary/commentaryTemplates.utils.ts)
 *   - COMMENTARY_REGISTRY conecta parser → pantalla → ejemplo
 *
 * Uso:
 *   import { parseCopagoCommentary } from '~/utils/commentaryParser';
 */

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
export {
  ACT_LABELS,
  ACT_LABELS_PLURAL,
  DEFAULT_PATIENT,
  COPAGO_FORMAT_HINT,
  COPAGO_FORMAT_HINT_SHORT,
  getCopagoGroupIcon
} from './copagoCatalog';

export {
  parseCopagoCommentary,
  getSeriesStats,
  getTotalByInstitution,
  getMonthlySpending,
  getPendingCycles,
  getPatientOptions
} from './copagoParser';

export {
  parseVacationCommentary,
  getDestinationSummaries,
  getLodgingComparisons
} from './vacationParser';

export {
  parseRestaurantCommentary,
  getRestaurantStats,
  getDishHistory,
  getSimilarRestaurants
} from './restaurantParser';

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
  | 'asset'
  | 'restaurant'
  | 'none';
