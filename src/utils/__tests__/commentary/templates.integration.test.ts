/**
 * Pruebas de integración de plantillas — protegen la CADENA COMPLETA:
 *   getTemplateConfig (storage) → getDefaultTemplateConfig (detectores) → chips
 *
 * Ubicación: junto a commentaryTemplates.utils.ts y templateStorage.utils.ts
 * (ajusta los imports relativos si tus archivos viven en otra carpeta).
 *
 * Cuando agregues un detector/parser nuevo: añade sus casos a CASES.
 */
import * as templates from '~/utils/commentary/commentaryTemplates.utils';
import { getDefaultTemplateConfig } from '~/utils/commentary/commentaryTemplates.utils';
import { getTemplateConfig } from '~/utils/commentary/templateStorage.utils';

// AsyncStorage en memoria
jest.mock(
  '@react-native-async-storage/async-storage',
  () => {
    const store: Record<string, string> = {};
    return {
      __esModule: true,
      default: {
        __store: store,
        getItem: jest.fn(async (k: string) => store[k] ?? null),
        setItem: jest.fn(async (k: string, v: string) => {
          store[k] = v;
        }),
        removeItem: jest.fn(async (k: string) => {
          delete store[k];
        })
      }
    };
  },
  { virtual: true }
);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const BANK = 'Bancarios y de inversión';

// ──────────────────────────────────────────────────────────────
// 1) Contrato: [id, subcategoría, categoría, parserType esperado]
//    Congela el comportamiento actual de tus subcategorías reales.
// ──────────────────────────────────────────────────────────────
const CASES: [number, string, string, string][] = [
  // Existentes (no deben cambiar nunca por culpa de bienes)
  [674, 'Luz', 'Vivienda', 'utility'],
  [664, 'Agua', 'Vivienda', 'utility'],
  [984, 'Gas', 'Vivienda', 'utility'],
  [1473, 'Proteínas', 'Alimentación', 'product'],
  [694, 'Mercado', 'Alimentación', 'product'],
  [944, 'Licores', 'Alimentación', 'product'],
  [300, 'Retenciones Julio', 'Nómina', 'retention'],
  [1444, 'Cuota moderadora', 'Salud', 'copago'],
  [624, 'Arriendo', 'Vivienda', 'custom'],
  [724, 'Taxi', 'Transporte', 'custom'],
  [1154, 'Ayuda familiar', 'Regalos', 'custom'],
  [1465, 'Nutrición', 'Salud', 'custom'],
  [1344, 'Deportes', 'Cultura', 'custom'],
  [1500, 'Vacaciones', 'Vacaciones', 'vacation'],
  [100300, 'Salario Julio', 'Ingresos', 'retention'],
  // Bancarios y de inversión — tus 8 subcategorías reales
  [3001, 'Compra Apto', BANK, 'custom'], //                    conserva "Cuota # n/N"
  [3002, 'Cuota manejo y 4× mil', BANK, 'custom'],
  [3003, 'Naturartes', BANK, 'none'],
  [3004, 'Emigrar', BANK, 'none'],
  [3005, 'Declaración renta', BANK, 'none'],
  [3006, 'Administración- impuesto local Piedecuesta', BANK, 'none'],
  // Bienes
  [3007, 'Lote La Coqueta #15 Alcala', BANK, 'asset'],
  [3008, 'Torre 2 Apt 1102 Mirador Villa Verde', BANK, 'asset'],
  [100554, 'Arriendo Apt 1102', 'Ingresos', 'asset']
];

describe('getDefaultTemplateConfig — contrato por subcategoría', () => {
  it.each(CASES)('#%i "%s" (%s) → %s', (id, name, cat, expected) => {
    expect(getDefaultTemplateConfig(id, name, cat).parserType).toBe(expected);
  });
});

describe('getDefaultTemplateConfig — robustez', () => {
  const names = ['', ' ', 'ÁÉÍÓÚ ñ', 'x'.repeat(500), 'Lote', 'Apt', '4× mil'];
  const cats = ['', BANK, 'Ingresos', 'Vivienda'];
  const ids = [0, 1, 99999, 100000, 100001];

  it('nunca lanza, sea cual sea la combinación', () => {
    for (const id of ids)
      for (const n of names)
        for (const c of cats) expect(() => getDefaultTemplateConfig(id, n, c)).not.toThrow();
  });

  it('toda config "structured" trae chips, y los chips son válidos', () => {
    for (const [id, name, cat] of CASES) {
      const cfg = getDefaultTemplateConfig(id, name, cat);
      if (cfg.assistanceLevel === 'structured') expect(cfg.chips.length).toBeGreaterThan(0);
      const labels = cfg.chips.map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length); // labels únicos (keys de la UI)
      for (const chip of cfg.chips) {
        expect(chip.label.trim()).not.toBe('');
        expect(chip.icon.trim()).not.toBe('');
        expect(chip.template.trim()).not.toBe('');
      }
    }
  });
});

// ──────────────────────────────────────────────────────────────
// 2) Storage: caché vieja, corrupta, personalizada y fallos
// ──────────────────────────────────────────────────────────────
describe('getTemplateConfig — storage', () => {
  const ID = 3008;
  const NAME = 'Torre 2 Apt 1102 Mirador Villa Verde';
  const key = `template_config_${ID}`;
  const flush = () => new Promise((r) => setImmediate(r));

  beforeEach(() => {
    for (const k of Object.keys(AsyncStorage.__store)) delete AsyncStorage.__store[k];
    jest.restoreAllMocks();
  });

  it('sin caché → default de bien', async () => {
    const cfg = await getTemplateConfig(ID, NAME, BANK);
    expect(cfg.parserType).toBe('asset');
    expect(cfg.chips.length).toBeGreaterThan(10);
  });

  it('caché v2 sin chips (config antigua) → se regenera y se persiste en v3', async () => {
    AsyncStorage.__store[key] = JSON.stringify({
      subcategoryId: ID,
      subcategoryName: NAME,
      categoryName: BANK,
      assistanceLevel: 'free',
      parserType: 'none',
      chips: [],
      enableValidation: false,
      configVersion: 2
    });
    const cfg = await getTemplateConfig(ID, NAME, BANK);
    await flush();
    expect(cfg.parserType).toBe('asset');
    expect(JSON.parse(AsyncStorage.__store[key]).configVersion).toBe(3);
  });

  it('caché v3 de tipo asset pero sin chips → se considera obsoleta', async () => {
    AsyncStorage.__store[key] = JSON.stringify({
      subcategoryId: ID,
      subcategoryName: NAME,
      categoryName: BANK,
      assistanceLevel: 'structured',
      parserType: 'asset',
      chips: [],
      enableValidation: true,
      configVersion: 3
    });
    expect((await getTemplateConfig(ID, NAME, BANK)).chips.length).toBeGreaterThan(10);
  });

  it('caché v3 personalizada → se respeta tal cual', async () => {
    const custom = {
      subcategoryId: ID,
      subcategoryName: NAME,
      categoryName: BANK,
      assistanceLevel: 'structured',
      parserType: 'asset',
      chips: [{ label: 'Mío', icon: 'star', template: 'Otros: mío' }],
      enableValidation: true,
      isCustomized: true,
      configVersion: 3
    };
    AsyncStorage.__store[key] = JSON.stringify(custom);
    expect((await getTemplateConfig(ID, NAME, BANK)).chips[0].label).toBe('Mío');
  });

  it('JSON corrupto → default, sin lanzar', async () => {
    AsyncStorage.__store[key] = '{no es json';
    expect((await getTemplateConfig(ID, NAME, BANK)).parserType).toBe('asset');
  });

  it('si getDefaultTemplateConfig lanza → la promesa NO se rechaza (config libre + warn)', async () => {
    jest.spyOn(templates, 'getDefaultTemplateConfig').mockImplementation(() => {
      throw new Error('boom');
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const cfg = await getTemplateConfig(ID, NAME, BANK);
    expect(cfg.parserType).toBe('none');
    expect(warn).toHaveBeenCalled();
  });
});
