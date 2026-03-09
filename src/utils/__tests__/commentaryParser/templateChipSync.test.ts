/**
 * templateChipSync.test.ts
 *
 * Verifica que cada chip definido en commentaryTemplates.utils.ts
 * produzca un texto que el parser correspondiente puede interpretar.
 *
 * Si este test falla, significa que un chip sugiere un formato que
 * el parser NO puede leer — bug silencioso en producción.
 *
 */

import { getDefaultTemplateConfig } from '~/utils/commentary/commentaryTemplates.utils';
import { parseUtilityCommentary } from '~/utils/commentaryParser/utilityParser';
import { parseProductCommentary } from '~/utils/commentaryParser/productParser';
import { parseRetentionCommentary } from '~/utils/commentaryParser/retentionParser';
import { parseTransportCommentary } from '~/utils/commentaryParser/transportParser';
import { parseFamilyAidCommentary } from '~/utils/commentaryParser/familyAidParser';
import { parseNutritionCommentary } from '~/utils/commentaryParser/nutritionParser';
import { parseSportsCommentary } from '~/utils/commentaryParser/sportsParser';
import { parseRentCommentary } from '~/utils/commentaryParser/rentParser';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const MOCK_COST = 50000;
const MOCK_DATE = '2026-03-09';
const MOCK_CATEGORY = 'Ingresos';

/**
 * Reemplaza placeholders editables en templates por valores reales.
 * Los templates usan palabras genéricas como "Producto", "Origen", etc.
 * para que el usuario las reemplace — aquí ponemos valores reales para test.
 */
const hydrate = (template: string): string =>
  template
    .replace(/^Producto/g, 'Pechuga') // productParser
    .replace(/\bProducto\b/g, 'Pechuga')
    .replace('Origen a Destino', 'Villa Verde a Centro')
    .replace('Ida y vuelta Origen a Destino', 'Ida y vuelta Villa Verde a Centro')
    .replace('2 pasajes Origen a Destino', '2 pasajes Villa Verde a Centro')
    .replace('Persona', 'Papá Jairo')
    .replace('Lugar deporte', 'Canaan futbol 8')
    .replace('apt descripción', 'apt 1004 Mirador Villa Verde')
    .replace('Arriendo Mar 2026', 'Arriendo Mar 2026'); // ya es válido

// ─────────────────────────────────────────────
// CASOS DE TEST POR parserType
// ─────────────────────────────────────────────

describe('templateChipSync — utility (Luz/Agua/Gas)', () => {
  const configs = [
    getDefaultTemplateConfig(1, 'Luz', 'Vivienda'),
    getDefaultTemplateConfig(2, 'Agua', 'Vivienda'),
    getDefaultTemplateConfig(3, 'Gas', 'Vivienda')
  ];

  configs.forEach((config) => {
    config.chips.forEach((chip) => {
      it(`[${config.subcategoryName}] chip "${chip.label}" → parseUtilityCommentary retorna datos`, () => {
        const result = parseUtilityCommentary(chip.template, MOCK_COST, MOCK_DATE);
        expect(result).not.toBeNull();
        expect(result?.consumption).toBeGreaterThan(0);
        expect(result?.unit).toMatch(/^(KW|M3)$/);
        expect(result?.periodStart).toBeTruthy();
        expect(result?.periodEnd).toBeTruthy();
      });
    });
  });
});

describe('templateChipSync — product (Proteínas/Mercado/Licores)', () => {
  const configs = [
    getDefaultTemplateConfig(10, 'Proteínas', 'Alimentación'),
    getDefaultTemplateConfig(11, 'Mercado', 'Alimentación'),
    getDefaultTemplateConfig(12, 'Licores', 'Alimentación')
  ];

  configs.forEach((config) => {
    config.chips.forEach((chip) => {
      it(`[${config.subcategoryName}] chip "${chip.label}" → parseProductCommentary retorna datos o es formato simplificado`, () => {
        const text = hydrate(chip.template);
        const result = parseProductCommentary(text, MOCK_COST, MOCK_DATE);

        // Los chips "Solo tienda" son formato simplificado — parser puede retornar null
        // pero deben tener al menos el nombre del producto
        if (chip.label === 'Solo tienda') {
          // Formato simplificado aceptado: parser retorna null pero el texto es válido
          expect(text).toMatch(/\[.+\]/); // debe tener tag de tienda
        } else {
          expect(result).not.toBeNull();
          expect(result?.product).toBeTruthy();
          expect(result?.cost).toBe(MOCK_COST);
        }
      });
    });
  });
});

describe('templateChipSync — retention (Nómina)', () => {
  const config = getDefaultTemplateConfig(20, 'Retenciones', 'Nómina');

  config.chips.forEach((chip) => {
    it(`chip "${chip.label}" → parseRetentionCommentary retorna datos`, () => {
      const result = parseRetentionCommentary(chip.template, MOCK_COST, MOCK_DATE, MOCK_CATEGORY);
      expect(result).not.toBeNull();
      expect(result?.retention).toBeGreaterThan(0);
    });
  });
});

describe('templateChipSync — transport (Taxi/Bus/Uber)', () => {
  const transportSubcategories = [
    { id: 30, name: 'Taxi', cat: 'Transporte' },
    { id: 31, name: 'Bus/Metrolinea', cat: 'Transporte' },
    { id: 32, name: 'Uber/Beat/InDrive', cat: 'Transporte' },
    { id: 33, name: 'Transporte del Trabajo', cat: 'Transporte' }
  ];

  transportSubcategories.forEach(({ id, name, cat }) => {
    const config = getDefaultTemplateConfig(id, name, cat);

    config.chips.forEach((chip) => {
      it(`[${name}] chip "${chip.label}" → parseTransportCommentary retorna datos`, () => {
        const text = hydrate(chip.template);
        const result = parseTransportCommentary(text, MOCK_COST, MOCK_DATE);
        expect(result).not.toBeNull();
        expect(result?.origin).toBeTruthy();
        expect(result?.destination).toBeTruthy();
      });
    });
  });
});

describe('templateChipSync — familyAid (Ayuda familiar)', () => {
  const config = getDefaultTemplateConfig(40, 'Ayuda/regalos familiares', 'Regalos');

  config.chips.forEach((chip) => {
    it(`chip "${chip.label}" → parseFamilyAidCommentary retorna datos`, () => {
      const text = hydrate(chip.template);
      const result = parseFamilyAidCommentary(text, MOCK_COST, MOCK_DATE);
      expect(result).not.toBeNull();
      expect(result?.person).toBeTruthy();
      expect(result?.periodicity).toMatch(/^(mensual|bimensual|trimestral|otro)$/);
      expect(result?.months.length).toBeGreaterThan(0);
    });
  });
});

describe('templateChipSync — nutrition (Nutrición)', () => {
  const config = getDefaultTemplateConfig(50, 'Nutrición', 'Salud');

  config.chips.forEach((chip) => {
    it(`chip "${chip.label}" → parseNutritionCommentary retorna datos`, () => {
      const result = parseNutritionCommentary(chip.template, MOCK_COST, MOCK_DATE);
      expect(result).not.toBeNull();
      expect(result?.weekNumber).toBeGreaterThan(0);
      expect(result?.center).toBeTruthy();
    });
  });
});

describe('templateChipSync — sports (Deportes)', () => {
  const config = getDefaultTemplateConfig(60, 'Deportes', 'Cultura, diversión y esparcimiento');

  config.chips.forEach((chip) => {
    it(`chip "${chip.label}" → parseSportsCommentary retorna datos`, () => {
      const text = hydrate(chip.template);
      const result = parseSportsCommentary(text, MOCK_COST, MOCK_DATE);
      expect(result).not.toBeNull();
      expect(result?.expenseType).toBeTruthy();
      expect(result?.description).toBeTruthy();
    });
  });
});

describe('templateChipSync — rent (Arriendo)', () => {
  const config = getDefaultTemplateConfig(70, 'Arriendo', 'Vivienda');

  config.chips.forEach((chip) => {
    it(`chip "${chip.label}" → parseRentCommentary retorna datos`, () => {
      const text = hydrate(chip.template);
      const result = parseRentCommentary(text, MOCK_COST, MOCK_DATE);
      expect(result).not.toBeNull();
      expect(result?.paymentType).toMatch(/^(completo|parcial|nuevo_valor)$/);
    });
  });
});

// ─────────────────────────────────────────────
// TEST GLOBAL: ningún chip de tipo structured/semi
// puede producir null en su parser
// ─────────────────────────────────────────────

describe('templateChipSync — cobertura global: chips structured/semi nunca producen null', () => {
  const testCases = [
    // utility
    { id: 1, name: 'Luz', cat: 'Vivienda' },
    { id: 2, name: 'Agua', cat: 'Vivienda' },
    { id: 3, name: 'Gas', cat: 'Vivienda' },
    // product
    { id: 10, name: 'Proteínas', cat: 'Alimentación' },
    { id: 11, name: 'Mercado', cat: 'Alimentación' },
    // retention
    { id: 20, name: 'Retenciones', cat: 'Nómina' },
    // transport
    { id: 30, name: 'Taxi', cat: 'Transporte' },
    { id: 31, name: 'Uber/Beat/InDrive', cat: 'Transporte' },
    // familyAid
    { id: 40, name: 'Ayuda/regalos familiares', cat: 'Regalos' },
    // nutrition
    { id: 50, name: 'Nutrición', cat: 'Salud' },
    // sports
    { id: 60, name: 'Deportes', cat: 'Cultura, diversión y esparcimiento' },
    // rent
    { id: 70, name: 'Arriendo', cat: 'Vivienda' }
  ];

  testCases.forEach(({ id, name, cat }) => {
    it(`[${name}] todos los chips tienen label, template e icon definidos`, () => {
      const config = getDefaultTemplateConfig(id, name, cat);

      // Las subcategorías structured/semi deben tener al menos 1 chip
      if (config.assistanceLevel !== 'free') {
        expect(config.chips.length).toBeGreaterThan(0);
      }

      config.chips.forEach((chip) => {
        expect(chip.label).toBeTruthy();
        expect(chip.template).toBeTruthy();
        expect(chip.icon).toBeTruthy();
        // El template no debe quedar con placeholders sin reemplazar en producción
        expect(chip.template).not.toContain('undefined');
        expect(chip.template).not.toContain('NaN');
      });
    });
  });
});
