/**
 * Test de integridad del commentary registry
 * Ubicación: src/utils/__tests__/commentaryParser/registry-integrity.test.ts
 */

import { parseUtilityCommentary } from '~/utils/commentaryParser/utilityParser';
import { parseProductCommentary } from '~/utils/commentaryParser/productParser';
import { parseRetentionCommentary } from '~/utils/commentaryParser/retentionParser';
import { parseTransportCommentary } from '~/utils/commentaryParser/transportParser';
import { parseFamilyAidCommentary } from '~/utils/commentaryParser/familyAidParser';
import { parseNutritionCommentary } from '~/utils/commentaryParser/nutritionParser';
import { parseSportsCommentary } from '~/utils/commentaryParser/sportsParser';
import { parseRentCommentary } from '~/utils/commentaryParser/rentParser';
import { parseCopagoCommentary } from '~/utils/commentaryParser/copagoParser';
import { ParserType } from '~/utils/commentaryParser';
import {
  COMMENTARY_REGISTRY,
  CommentaryAnalysisEntry
} from '~/shared/types/utils/commentaryParser/commentary-registry';

// ─────────────────────────────────────────────
// CONSTANTES DE TEST
// ─────────────────────────────────────────────

/** Rutas válidas según StatisticsStackParamList — mantener sincronizado con stack.type.ts */
const VALID_ROUTES = new Set([
  'statisticsHome',
  'comparePeriods',
  'commentaryAnalysis',
  'utilityAnalysis',
  'productPrices',
  'retentionAnalysis',
  'transportAnalysis',
  'familyAidAnalysis',
  'nutritionAnalysis',
  'sportsAnalysis',
  'rentAnalysis',
  'copagoAnalysis' // ← fix: ruta de copago
] as const);

/** ParserTypes válidos del union type (excluyendo 'none') */
const VALID_PARSER_TYPES = new Set<Exclude<ParserType, 'none'>>([
  'utility',
  'product',
  'retention',
  'transport',
  'familyAid',
  'nutrition',
  'sports',
  'rent',
  'copago' // ← fix: parserType de copago
]);

/** Fecha y costo ficticios para los parsers que los requieren */
const MOCK_COST = 100_000;
const MOCK_DATE = '2026-03-11';
const MOCK_CATEGORY = 'Nómina';

// ─────────────────────────────────────────────
// HELPER: invocar el parser correcto por parserType
// ─────────────────────────────────────────────

const invokeParser = (entry: CommentaryAnalysisEntry): object | null => {
  const { parserType, exampleCommentary } = entry;

  switch (parserType) {
    case 'utility':
      return parseUtilityCommentary(exampleCommentary, MOCK_COST, MOCK_DATE);
    case 'product':
      return parseProductCommentary(exampleCommentary, MOCK_COST, MOCK_DATE);
    case 'retention':
      return parseRetentionCommentary(exampleCommentary, MOCK_COST, MOCK_DATE, MOCK_CATEGORY);
    case 'transport':
      return parseTransportCommentary(exampleCommentary, MOCK_COST, MOCK_DATE);
    case 'familyAid':
      return parseFamilyAidCommentary(exampleCommentary, MOCK_COST, MOCK_DATE);
    case 'nutrition':
      return parseNutritionCommentary(exampleCommentary, MOCK_COST, MOCK_DATE);
    case 'sports':
      return parseSportsCommentary(exampleCommentary, MOCK_COST, MOCK_DATE);
    case 'rent':
      return parseRentCommentary(exampleCommentary, MOCK_COST, MOCK_DATE);
    case 'copago':
      return parseCopagoCommentary(exampleCommentary, MOCK_COST, MOCK_DATE);
  }
};

// ─────────────────────────────────────────────
// SUITE
// ─────────────────────────────────────────────

describe('COMMENTARY_REGISTRY — integridad estructural', () => {
  test('no está vacío', () => {
    expect(COMMENTARY_REGISTRY.length).toBeGreaterThan(0);
  });

  test('no hay parserTypes duplicados', () => {
    const seen = new Set<string>();
    for (const entry of COMMENTARY_REGISTRY) {
      expect(seen.has(entry.parserType)).toBe(false);
      seen.add(entry.parserType);
    }
  });

  test('todos los parserType son válidos (existen en el union ParserType)', () => {
    for (const entry of COMMENTARY_REGISTRY) {
      expect(VALID_PARSER_TYPES.has(entry.parserType)).toBe(true);
    }
  });

  test('todos los campos obligatorios están presentes y no vacíos', () => {
    for (const entry of COMMENTARY_REGISTRY) {
      expect(entry.displayName.trim()).not.toBe('');
      expect(entry.subtitle.trim()).not.toBe('');
      expect(entry.icon.trim()).not.toBe('');
      expect(entry.iconColorKey.trim()).not.toBe('');
      expect(entry.route.trim()).not.toBe('');
      expect(entry.subcategoryDetectors.length).toBeGreaterThan(0);
      expect(entry.exampleCommentary.trim()).not.toBe('');
    }
  });
});

describe('COMMENTARY_REGISTRY — rutas de navegación', () => {
  test.each(COMMENTARY_REGISTRY)(
    '$parserType → route "$route" existe en StatisticsStackParamList',
    (entry) => {
      expect(
        VALID_ROUTES.has(entry.route as typeof VALID_ROUTES extends Set<infer R> ? R : never)
      ).toBe(true);
    }
  );
});

describe('COMMENTARY_REGISTRY — parsers reales (smoke test)', () => {
  test.each(COMMENTARY_REGISTRY)(
    '$parserType parsea exampleCommentary sin retornar null',
    (entry) => {
      const result = invokeParser(entry);
      expect(result).not.toBeNull();
    }
  );
});
