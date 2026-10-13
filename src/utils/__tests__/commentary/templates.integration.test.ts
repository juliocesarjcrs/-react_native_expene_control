/**
 * Pruebas de integración de plantillas — protegen la CADENA COMPLETA:
 *   getTemplateConfig (storage) → getDefaultTemplateConfig (detectores) → chips
 *
 * Ubicación: junto a commentaryTemplates.utils.ts y templateStorage.utils.ts
 * (ajusta los imports relativos si tus archivos viven en otra carpeta).
 *
 * Cuando agregues un detector/parser nuevo: añade sus casos a CASES.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as templates from '~/utils/commentary/commentaryTemplates.utils';
import { CONFIG_VERSION, getTemplateConfig } from '~/utils/commentary/templateStorage.utils';

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

// El mock expone su almacén interno para poder inspeccionarlo y vaciarlo
type MockedStorage = typeof AsyncStorage & { __store: Record<string, string> };
const store = (AsyncStorage as MockedStorage).__store;

const clearStore = () => {
  for (const k of Object.keys(store)) delete store[k];
};

// Escribe directamente en el almacén (simula cachés viejas o corruptas)
const writeRaw = (key: string, value: string) => {
  store[key] = value;
};

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
    expect(templates.getDefaultTemplateConfig(id, name, cat).parserType).toBe(expected);
  });
});

describe('getDefaultTemplateConfig — robustez', () => {
  const names = ['', ' ', 'ÁÉÍÓÚ ñ', 'x'.repeat(500), 'Lote', 'Apt', '4× mil'];
  const cats = ['', BANK, 'Ingresos', 'Vivienda'];
  const ids = [0, 1, 99999, 100000, 100001];

  it('nunca lanza, sea cual sea la combinación', () => {
    const throwing: string[] = [];

    for (const id of ids)
      for (const n of names)
        for (const c of cats) {
          try {
            templates.getDefaultTemplateConfig(id, n, c);
          } catch {
            throwing.push(`#${id} "${n.slice(0, 20)}" (${c})`);
          }
        }

    expect(throwing).toEqual([]);
  });

  it.each(CASES)('#%i "%s" (%s): chips válidos', (id, name, cat) => {
    const cfg = templates.getDefaultTemplateConfig(id, name, cat);

    // Una config "structured" debe traer chips
    expect(cfg.assistanceLevel !== 'structured' || cfg.chips.length > 0).toBe(true);

    // Labels únicos (son las keys de la UI)
    const labels = cfg.chips.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);

    // Ningún campo del chip vacío
    const emptyChips = cfg.chips
      .filter((c) => !c.label.trim() || !c.icon.trim() || !c.template.trim())
      .map((c) => c.label);
    expect(emptyChips).toEqual([]);
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
    clearStore();
    jest.restoreAllMocks();
  });

  it('sin caché → default de bien', async () => {
    const cfg = await getTemplateConfig(ID, NAME, BANK);
    expect(cfg.parserType).toBe('asset');
    expect(cfg.chips.length).toBeGreaterThan(10);
  });

  it('caché de versión anterior sin chips → se regenera y se persiste en la versión actual', async () => {
    writeRaw(
      key,
      JSON.stringify({
        subcategoryId: ID,
        subcategoryName: NAME,
        categoryName: BANK,
        assistanceLevel: 'free',
        parserType: 'none',
        chips: [],
        enableValidation: false,
        configVersion: CONFIG_VERSION - 1
      })
    );
    const cfg = await getTemplateConfig(ID, NAME, BANK);
    await flush();
    expect(cfg.parserType).toBe('asset');
    expect(JSON.parse(store[key]).configVersion).toBe(CONFIG_VERSION);
  });

  it('caché actual de tipo asset pero sin chips → se considera obsoleta', async () => {
    writeRaw(
      key,
      JSON.stringify({
        subcategoryId: ID,
        subcategoryName: NAME,
        categoryName: BANK,
        assistanceLevel: 'structured',
        parserType: 'asset',
        chips: [],
        enableValidation: true,
        configVersion: CONFIG_VERSION
      })
    );
    expect((await getTemplateConfig(ID, NAME, BANK)).chips.length).toBeGreaterThan(10);
  });

  it('caché de la versión actual personalizada → se respeta tal cual', async () => {
    writeRaw(
      key,
      JSON.stringify({
        subcategoryId: ID,
        subcategoryName: NAME,
        categoryName: BANK,
        assistanceLevel: 'structured',
        parserType: 'asset',
        chips: [{ label: 'Mío', icon: 'star', template: 'Otros: mío' }],
        enableValidation: true,
        isCustomized: true,
        configVersion: CONFIG_VERSION
      })
    );
    expect((await getTemplateConfig(ID, NAME, BANK)).chips[0].label).toBe('Mío');
  });

  it('chips de ingreso guardados con la versión anterior (sin [Bien: ...]) se regeneran', async () => {
    writeRaw(
      'template_config_100554',
      JSON.stringify({
        subcategoryId: 100554,
        subcategoryName: 'Arriendos',
        categoryName: 'Ingresos',
        assistanceLevel: 'structured',
        parserType: 'asset',
        chips: [{ label: 'Arriendo', icon: 'home-account', template: 'Arriendo: Oct 2026' }],
        enableValidation: true,
        configVersion: CONFIG_VERSION - 1
      })
    );
    const cfg = await getTemplateConfig(100554, 'Arriendos', 'Ingresos');
    const withoutProperty = cfg.chips.filter((c) => !c.template.includes('[Bien:'));
    expect(withoutProperty).toEqual([]);
  });

  it('JSON corrupto → default, sin lanzar', async () => {
    writeRaw(key, '{no es json');
    expect((await getTemplateConfig(ID, NAME, BANK)).parserType).toBe('asset');
  });

  it('si getDefaultTemplateConfig lanza → la promesa NO se rechaza (config libre + warn)', async () => {
    jest.spyOn(templates, 'getDefaultTemplateConfig').mockImplementation(() => {
      throw new Error('boom');
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const cfg = await getTemplateConfig(ID, NAME, BANK);
    expect(cfg.parserType).toBe('none');
    expect(warn).toHaveBeenCalled();
  });
});
