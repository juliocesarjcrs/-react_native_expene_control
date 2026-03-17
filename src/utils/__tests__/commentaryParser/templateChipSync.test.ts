/**
 * templateChipSync.test.ts
 *
 * Fuente de verdad: COMMENTARY_REGISTRY
 *
 * Este test NO hardcodea nombres ni IDs de subcategorías.
 * Al agregar una entry al registry, este test la cubre automáticamente.
 *
 * Garantiza tres cosas:
 *   1. El exampleCommentary de cada entry es parseado correctamente
 *   2. Cada subcategoryDetector activa el parserType correcto en getDefaultTemplateConfig
 *   3. Los chips de subcategorías 'structured' producen texto parseable
 *
 * Ubicación: src/utils/__tests__/commentaryParser/templateChipSync.test.ts
 */

import {
  COMMENTARY_REGISTRY,
  CommentaryAnalysisEntry
} from '~/shared/types/utils/commentaryParser/commentary-registry';
import { getDefaultTemplateConfig } from '~/utils/commentary/commentaryTemplates.utils';

import { parseUtilityCommentary } from '~/utils/commentaryParser/utilityParser';
import { parseProductCommentary } from '~/utils/commentaryParser/productParser';
import { parseRetentionCommentary } from '~/utils/commentaryParser/retentionParser';
import { parseTransportCommentary } from '~/utils/commentaryParser/transportParser';
import { parseFamilyAidCommentary } from '~/utils/commentaryParser/familyAidParser';
import { parseNutritionCommentary } from '~/utils/commentaryParser/nutritionParser';
import { parseSportsCommentary } from '~/utils/commentaryParser/sportsParser';
import { parseRentCommentary } from '~/utils/commentaryParser/rentParser';
import { ParserType } from '~/utils/commentaryParser';

// ─────────────────────────────────────────────
// CONSTANTES DE TEST
// ─────────────────────────────────────────────

const MOCK_COST = 50_000;
const MOCK_DATE = '2026-03-09';
const MOCK_CATEGORY = 'TestCategoria';

/**
 * ID ficticio usado en getDefaultTemplateConfig durante tests.
 * No importa el valor — la detección es por nombre, no por ID.
 */
const TEST_SUBCATEGORY_ID = 9999;

// ─────────────────────────────────────────────
// HELPER: invocar el parser correcto por parserType
//
// No usamos parseCommentary() del orquestador porque este requiere
// un subcategoryId del SUBCATEGORY_PARSER_MAP (IDs reales de BD).
// En tests queremos probar por parserType directamente.
// ─────────────────────────────────────────────

const parseByType = (
  parserType: Exclude<ParserType, 'none'>,
  commentary: string
): object | null => {
  switch (parserType) {
    case 'utility':
      return parseUtilityCommentary(commentary, MOCK_COST, MOCK_DATE);
    case 'product':
      return parseProductCommentary(commentary, MOCK_COST, MOCK_DATE);
    case 'retention':
      return parseRetentionCommentary(commentary, MOCK_COST, MOCK_DATE, MOCK_CATEGORY);
    case 'transport':
      return parseTransportCommentary(commentary, MOCK_COST, MOCK_DATE);
    case 'familyAid':
      return parseFamilyAidCommentary(commentary, MOCK_COST, MOCK_DATE);
    case 'nutrition':
      return parseNutritionCommentary(commentary, MOCK_COST, MOCK_DATE);
    case 'sports':
      return parseSportsCommentary(commentary, MOCK_COST, MOCK_DATE);
    case 'rent':
      return parseRentCommentary(commentary, MOCK_COST, MOCK_DATE);
  }
};

// ─────────────────────────────────────────────
// HELPER: reemplazar placeholders editables en chips
//
// Los chips usan palabras genéricas ("Producto", "Origen")
// para que el usuario las reemplace. Aquí ponemos valores
// reales para que el parser pueda interpretarlos.
// ─────────────────────────────────────────────

const hydrate = (template: string): string =>
  template
    .replace(/\bProducto\b/g, 'Pechuga')
    .replace('Origen a Destino', 'Villa Verde a Centro')
    .replace('Ida y vuelta Origen a Destino', 'Ida y vuelta Villa Verde a Centro')
    .replace('2 pasajes Origen a Destino', '2 pasajes Villa Verde a Centro')
    .replace(/\bPersona\b/g, 'Papá Jairo')
    .replace('Lugar deporte', 'Canaan futbol 8')
    .replace('apt descripción', 'apt 1004 Mirador Villa Verde');

// ─────────────────────────────────────────────
// TEST 1: exampleCommentary del registry
//
// Si falla → el campo exampleCommentary tiene un formato
// que el parser no puede leer. Corregir en el registry.
// ─────────────────────────────────────────────

describe('Registry — exampleCommentary es parseable por su parser', () => {
  COMMENTARY_REGISTRY.forEach((entry: CommentaryAnalysisEntry) => {
    it(`[${entry.parserType}] "${entry.exampleCommentary}"`, () => {
      const result = parseByType(entry.parserType, entry.exampleCommentary);
      expect(result).not.toBeNull();
    });
  });
});

// ─────────────────────────────────────────────
// TEST 2: subcategoryDetectors activan el parserType correcto
//
// Si falla → el nombre en subcategoryDetectors no es detectado
// por getDefaultTemplateConfig. Corregir el detector en
// commentaryTemplates.utils.ts o el nombre en el registry.
// ─────────────────────────────────────────────

describe('Registry — subcategoryDetectors activan el parserType correcto en getDefaultTemplateConfig', () => {
  COMMENTARY_REGISTRY.forEach((entry: CommentaryAnalysisEntry) => {
    entry.subcategoryDetectors.forEach((subcategoryName) => {
      it(`[${entry.parserType}] detector "${subcategoryName}" → parserType correcto`, () => {
        const config = getDefaultTemplateConfig(TEST_SUBCATEGORY_ID, subcategoryName, 'TestCat');

        // Los parsers semi-estructurados usan parserType 'custom' en el template
        // porque no tienen validación estricta de formato (solo chips de guía).
        // utility, product y retention usan su propio parserType directamente.
        const isStructured = ['utility', 'product', 'retention'].includes(entry.parserType);
        const expectedParserTypes = isStructured
          ? [entry.parserType]
          : [entry.parserType, 'custom'];

        expect(expectedParserTypes).toContain(config.parserType);

        // Adicionalmente: el assistanceLevel nunca debe ser 'free' si hay un parser
        expect(config.assistanceLevel).not.toBe('free');
      });
    });
  });
});

// ─────────────────────────────────────────────
// TEST 3: chips de subcategorías structured parsean sin null
//
// Solo aplica a parserType 'utility', 'product', 'retention'
// porque son los únicos con assistanceLevel: 'structured'.
// Los chips 'semi' no se validan aquí (formato libre guiado).
//
// Excepción documentada: chips "Solo tienda" en product son
// formato simplificado — el parser retorna null intencionalmente.
// ─────────────────────────────────────────────

describe('Chips structured — texto generado es parseable por su parser', () => {
  const STRUCTURED_PARSERS: Array<Exclude<ParserType, 'none'>> = [
    'utility',
    'product',
    'retention'
  ];

  COMMENTARY_REGISTRY.filter((entry) => STRUCTURED_PARSERS.includes(entry.parserType)).forEach(
    (entry: CommentaryAnalysisEntry) => {
      entry.subcategoryDetectors.forEach((subcategoryName) => {
        const config = getDefaultTemplateConfig(TEST_SUBCATEGORY_ID, subcategoryName, 'TestCat');

        config.chips.forEach((chip) => {
          const isSimplifiedFormat = chip.label === 'Solo tienda';

          if (isSimplifiedFormat) {
            // Formato simplificado — documentado como no-parseable intencionalmente.
            // El parser retorna null pero el texto sigue siendo válido visualmente.
            it(`[${entry.parserType}] "${subcategoryName}" chip "${chip.label}" → formato simplificado (null esperado, tag de tienda requerido)`, () => {
              const text = hydrate(chip.template);
              expect(text).toMatch(/\[.+\]/);
            });
          } else {
            it(`[${entry.parserType}] "${subcategoryName}" chip "${chip.label}" → parser retorna datos`, () => {
              const text = hydrate(chip.template);
              const result = parseByType(entry.parserType, text);
              expect(result).not.toBeNull();
            });
          }
        });
      });
    }
  );
});

// ─────────────────────────────────────────────
// TEST 4: integridad estructural del registry
//
// Verifica que cada entry tenga todos los campos requeridos
// y sin valores undefined/NaN que indiquen errores de build.
// También garantiza que parserType y route sean únicos.
// ─────────────────────────────────────────────

describe('Registry — integridad estructural', () => {
  it('el registry no está vacío', () => {
    expect(COMMENTARY_REGISTRY.length).toBeGreaterThan(0);
  });

  COMMENTARY_REGISTRY.forEach((entry: CommentaryAnalysisEntry) => {
    describe(`entry [${entry.parserType}]`, () => {
      it('todos los campos requeridos están presentes y no son vacíos', () => {
        expect(entry.parserType).toBeTruthy();
        expect(entry.displayName).toBeTruthy();
        expect(entry.subtitle).toBeTruthy();
        expect(entry.icon).toBeTruthy();
        expect(entry.iconColorKey).toBeTruthy();
        expect(entry.route).toBeTruthy();
        expect(entry.subcategoryDetectors.length).toBeGreaterThan(0);
        expect(entry.exampleCommentary).toBeTruthy();
      });

      it('exampleCommentary no contiene valores corruptos (undefined, NaN)', () => {
        expect(entry.exampleCommentary).not.toContain('undefined');
        expect(entry.exampleCommentary).not.toContain('NaN');
      });

      it('parserType es único en el registry (sin duplicados)', () => {
        const duplicates = COMMENTARY_REGISTRY.filter((e) => e.parserType === entry.parserType);
        expect(duplicates.length).toBe(1);
      });

      it('route es única en el registry (sin duplicados)', () => {
        const duplicates = COMMENTARY_REGISTRY.filter((e) => e.route === entry.route);
        expect(duplicates.length).toBe(1);
      });
    });
  });
});
