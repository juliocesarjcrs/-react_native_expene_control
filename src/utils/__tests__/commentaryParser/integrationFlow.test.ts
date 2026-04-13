/**
 * integrationFlow.test.ts
 * Ubicación: src/utils/__tests__/commentaryParser/integrationFlow.test.ts
 *
 * Verifica el flujo completo del sistema de comentarios:
 *   1. Primera vez → sin config en AsyncStorage → chips del default
 *   2. Guardar gasto → saveCommentaryToHistory + registerDefaultTemplateConfig
 *   3. Segunda vez → config en AsyncStorage → chips cargados desde cache
 *   4. Al escribir → historial filtrado aparece como sugerencias
 *   5. Config obsoleta (sin configVersion) → se descarta y regenera
 *
 * Usa el mock de AsyncStorage en __mocks__/@react-native-async-storage/async-storage.js
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTemplateConfig,
  registerDefaultTemplateConfig
} from '~/utils/commentary/templateStorage.utils';
import {
  saveCommentaryToHistory,
  getCachedHistory,
  mergeHistorySuggestions,
  filterSuggestions
} from '~/utils/commentary/commentaryHistory.utils';
import { getDefaultTemplateConfig } from '~/utils/commentary/commentaryTemplates.utils';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const SUBCATEGORY_ID = 1444;
const SUBCATEGORY_NAME = 'Cuota moderadora';
const CATEGORY_NAME = 'Salud';

const REAL_COMMENTARY = 'Copago Colmedica terapia física #11/20';
const REAL_COST = 43900;
const REAL_DATE = '2026-04-10';

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// FLUJO 1: Primera vez — sin nada en AsyncStorage
// ─────────────────────────────────────────────

describe('Flujo 1 — primera vez sin config en AsyncStorage', () => {
  test('getTemplateConfig retorna chips del default cuando AsyncStorage está vacío', async () => {
    // Sin config guardada
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);

    const config = await getTemplateConfig(SUBCATEGORY_ID, SUBCATEGORY_NAME, CATEGORY_NAME);

    // Debe retornar config de copago con chips
    expect(config.parserType).toBe('copago');
    expect(config.assistanceLevel).toBe('structured');
    expect(config.chips.length).toBeGreaterThan(0);
    expect(config.chips[0].label).toBeTruthy();
    expect(config.chips[0].template).toBeTruthy();
  });

  test('los chips del default para copago tienen el formato correcto', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);

    const config = await getTemplateConfig(SUBCATEGORY_ID, SUBCATEGORY_NAME, CATEGORY_NAME);

    // Todos los chips deben tener template que empiece con "Copago"
    config.chips.forEach((chip) => {
      expect(chip.template).toMatch(/^Copago/i);
      expect(chip.icon).toBeTruthy();
      expect(chip.label).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────
// FLUJO 2: Guardar gasto
// ─────────────────────────────────────────────

describe('Flujo 2 — guardar gasto persiste historial y config', () => {
  test('saveCommentaryToHistory guarda el comentario en AsyncStorage', async () => {
    // Sin historial previo
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);
    mockAsyncStorage.setItem.mockResolvedValueOnce(undefined as any);

    await saveCommentaryToHistory(SUBCATEGORY_ID, REAL_COMMENTARY, REAL_COST, REAL_DATE);

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      `commentary_history_${SUBCATEGORY_ID}`,
      expect.stringContaining(REAL_COMMENTARY)
    );
  });

  test('saveCommentaryToHistory evita duplicados exactos', async () => {
    // Historial con el mismo comentario ya guardado
    const existingHistory = JSON.stringify({
      subcategoryId: SUBCATEGORY_ID,
      entries: [
        { commentary: REAL_COMMENTARY, date: REAL_DATE, cost: REAL_COST, source: 'cached' }
      ],
      savedAt: new Date().toISOString()
    });
    mockAsyncStorage.getItem.mockResolvedValueOnce(existingHistory);

    await saveCommentaryToHistory(SUBCATEGORY_ID, REAL_COMMENTARY, REAL_COST, REAL_DATE);

    // No debe llamar setItem porque es duplicado
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  test('registerDefaultTemplateConfig persiste la config con configVersion', async () => {
    mockAsyncStorage.setItem.mockResolvedValueOnce(undefined as any);

    const defaultConfig = getDefaultTemplateConfig(SUBCATEGORY_ID, SUBCATEGORY_NAME, CATEGORY_NAME);
    await registerDefaultTemplateConfig(defaultConfig);

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      `template_config_${SUBCATEGORY_ID}`,
      expect.stringContaining('"configVersion"')
    );

    // Verificar que NO marca isCustomized: true
    const savedArg = mockAsyncStorage.setItem.mock.calls[0][1] as string;
    const saved = JSON.parse(savedArg);
    expect(saved.isCustomized).toBe(false);
    expect(saved.configVersion).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// FLUJO 3: Segunda vez — config en AsyncStorage
// ─────────────────────────────────────────────

describe('Flujo 3 — segunda vez con config guardada en AsyncStorage', () => {
  test('getTemplateConfig retorna la config guardada cuando configVersion es vigente', async () => {
    const savedConfig = {
      ...getDefaultTemplateConfig(SUBCATEGORY_ID, SUBCATEGORY_NAME, CATEGORY_NAME),
      isCustomized: false,
      configVersion: 2 // versión actual
    };
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(savedConfig));

    const config = await getTemplateConfig(SUBCATEGORY_ID, SUBCATEGORY_NAME, CATEGORY_NAME);

    expect(config.parserType).toBe('copago');
    expect(config.chips.length).toBeGreaterThan(0);
    // No debe llamar setItem porque la config es vigente
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// FLUJO 4: Al escribir → historial filtrado
// ─────────────────────────────────────────────

describe('Flujo 4 — historial filtrado al escribir', () => {
  test('getCachedHistory retorna entradas guardadas', async () => {
    const cachedHistory = JSON.stringify({
      subcategoryId: SUBCATEGORY_ID,
      entries: [
        { commentary: REAL_COMMENTARY, date: REAL_DATE, cost: REAL_COST, source: 'cached' },
        {
          commentary: 'Copago Colmedica consulta neurología',
          date: '2026-03-10',
          cost: 43900,
          source: 'cached'
        }
      ],
      savedAt: new Date().toISOString()
    });
    mockAsyncStorage.getItem.mockResolvedValueOnce(cachedHistory);

    const history = await getCachedHistory(SUBCATEGORY_ID);

    expect(history).toHaveLength(2);
    expect(history[0].commentary).toBe(REAL_COMMENTARY);
    expect(history[0].source).toBe('cached');
  });

  test('mergeHistorySuggestions prioriza backend (live) sobre cache', () => {
    const liveExpenses = [
      {
        id: 1,
        commentary: 'Copago Colmedica terapia física #12/20',
        date: '2026-04-15',
        cost: 43900
      }
    ];
    const cached = [
      { commentary: REAL_COMMENTARY, date: REAL_DATE, cost: REAL_COST, source: 'cached' as const },
      {
        commentary: 'Copago Colmedica consulta neurología',
        date: '2026-03-10',
        cost: 43900,
        source: 'cached' as const
      }
    ];

    const merged = mergeHistorySuggestions(liveExpenses, cached);

    // El primero debe ser el del backend
    expect(merged[0].source).toBe('live');
    expect(merged[0].commentary).toContain('#12/20');
    // Los del cache deben seguir
    expect(merged.length).toBeGreaterThan(1);
  });

  test('mergeHistorySuggestions deduplica por texto', () => {
    const liveExpenses = [{ id: 1, commentary: REAL_COMMENTARY, date: '2026-04-15', cost: 43900 }];
    const cached = [
      { commentary: REAL_COMMENTARY, date: REAL_DATE, cost: REAL_COST, source: 'cached' as const }
    ];

    const merged = mergeHistorySuggestions(liveExpenses, cached);

    // Solo debe aparecer una vez aunque esté en ambas fuentes
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe('live'); // live tiene prioridad
  });

  test('filterSuggestions filtra por texto escrito', () => {
    const suggestions = [
      {
        commentary: 'Copago Colmedica terapia física #11/20',
        date: REAL_DATE,
        cost: 43900,
        source: 'cached' as const
      },
      {
        commentary: 'Copago Colmedica consulta neurología',
        date: REAL_DATE,
        cost: 43900,
        source: 'cached' as const
      },
      {
        commentary: 'Copago fisiatría #1/10',
        date: REAL_DATE,
        cost: 43900,
        source: 'cached' as const
      }
    ];

    const filtered = filterSuggestions(suggestions, 'terapia');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].commentary).toContain('terapia');
  });

  test('filterSuggestions retorna todas si query está vacío', () => {
    const suggestions = [
      { commentary: 'A', date: REAL_DATE, cost: 0, source: 'cached' as const },
      { commentary: 'B', date: REAL_DATE, cost: 0, source: 'cached' as const }
    ];

    expect(filterSuggestions(suggestions, '')).toHaveLength(2);
    expect(filterSuggestions(suggestions, '   ')).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────
// FLUJO 5: Config obsoleta → se regenera
// ─────────────────────────────────────────────

describe('Flujo 5 — config obsoleta se descarta y regenera', () => {
  test('config sin configVersion (pre-versionado) → retorna default fresco', async () => {
    // Config vieja guardada en producción sin configVersion
    const staleConfig = {
      subcategoryId: SUBCATEGORY_ID,
      subcategoryName: SUBCATEGORY_NAME,
      categoryName: CATEGORY_NAME,
      assistanceLevel: 'semi',
      parserType: 'custom', // ← era 'custom' antes del fix de copago
      chips: [], // ← estaba vacío
      enableValidation: false
      // sin configVersion ← señal de config obsoleta
    };
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(staleConfig));
    mockAsyncStorage.setItem.mockResolvedValueOnce(undefined as any);

    const config = await getTemplateConfig(SUBCATEGORY_ID, SUBCATEGORY_NAME, CATEGORY_NAME);

    // Debe retornar config fresca con chips de copago, no la obsoleta
    expect(config.parserType).toBe('copago');
    expect(config.chips.length).toBeGreaterThan(0);

    // Debe persistir en background con configVersion actualizada
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      `template_config_${SUBCATEGORY_ID}`,
      expect.stringContaining('"configVersion"')
    );
  });

  test('config con chips vacíos para parser structured → se descarta', async () => {
    const staleConfig = {
      subcategoryId: SUBCATEGORY_ID,
      subcategoryName: SUBCATEGORY_NAME,
      categoryName: CATEGORY_NAME,
      assistanceLevel: 'structured',
      parserType: 'copago',
      chips: [], // ← structured nunca debería tener chips vacíos
      enableValidation: true,
      configVersion: 1 // versión antigua
    };
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(staleConfig));
    mockAsyncStorage.setItem.mockResolvedValueOnce(undefined as any);

    const config = await getTemplateConfig(SUBCATEGORY_ID, SUBCATEGORY_NAME, CATEGORY_NAME);

    expect(config.chips.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// FLUJO COMPLETO END-TO-END
// ─────────────────────────────────────────────

describe('Flujo completo — crear gasto y volver a la subcategoría', () => {
  test('ciclo completo: sin config → guardar → recargar con chips', async () => {
    // --- PASO 1: Primera vez, sin nada en AsyncStorage ---
    mockAsyncStorage.getItem.mockResolvedValueOnce(null); // getTemplateConfig
    const configPrimeraVez = await getTemplateConfig(
      SUBCATEGORY_ID,
      SUBCATEGORY_NAME,
      CATEGORY_NAME
    );
    expect(configPrimeraVez.chips.length).toBeGreaterThan(0); // chips del default

    // --- PASO 2: Usuario guarda un gasto ---
    // saveCommentaryToHistory
    mockAsyncStorage.getItem.mockResolvedValueOnce(null); // sin historial previo
    mockAsyncStorage.setItem.mockResolvedValueOnce(undefined as any);
    await saveCommentaryToHistory(SUBCATEGORY_ID, REAL_COMMENTARY, REAL_COST, REAL_DATE);

    // registerDefaultTemplateConfig
    mockAsyncStorage.setItem.mockResolvedValueOnce(undefined as any);
    const defaultConfig = getDefaultTemplateConfig(SUBCATEGORY_ID, SUBCATEGORY_NAME, CATEGORY_NAME);
    await registerDefaultTemplateConfig(defaultConfig);

    // Verificar que se guardó el historial
    const historySaved = mockAsyncStorage.setItem.mock.calls[0];
    expect(historySaved[0]).toBe(`commentary_history_${SUBCATEGORY_ID}`);
    expect(historySaved[1]).toContain(REAL_COMMENTARY);

    // Verificar que se guardó la config con configVersion
    const configSaved = mockAsyncStorage.setItem.mock.calls[1];
    expect(configSaved[0]).toBe(`template_config_${SUBCATEGORY_ID}`);
    const savedConfig = JSON.parse(configSaved[1] as string);
    expect(savedConfig.isCustomized).toBe(false);
    expect(savedConfig.configVersion).toBeGreaterThan(0);
    expect(savedConfig.chips.length).toBeGreaterThan(0);

    // --- PASO 3: Segunda vez → carga desde AsyncStorage ---
    mockAsyncStorage.getItem.mockResolvedValueOnce(configSaved[1]); // config guardada
    const configSegundaVez = await getTemplateConfig(
      SUBCATEGORY_ID,
      SUBCATEGORY_NAME,
      CATEGORY_NAME
    );
    expect(configSegundaVez.chips.length).toBeGreaterThan(0);
    expect(configSegundaVez.parserType).toBe('copago');

    // --- PASO 4: Historial disponible para sugerencias ---
    const cachedEntry = JSON.stringify({
      subcategoryId: SUBCATEGORY_ID,
      entries: [
        { commentary: REAL_COMMENTARY, date: REAL_DATE, cost: REAL_COST, source: 'cached' }
      ],
      savedAt: new Date().toISOString()
    });
    mockAsyncStorage.getItem.mockResolvedValueOnce(cachedEntry);
    const history = await getCachedHistory(SUBCATEGORY_ID);

    const merged = mergeHistorySuggestions([], history);
    expect(merged).toHaveLength(1);
    expect(merged[0].commentary).toBe(REAL_COMMENTARY);

    // --- PASO 5: Al escribir "terapia" → filtra el historial ---
    const filtered = filterSuggestions(merged, 'terapia');
    expect(filtered).toHaveLength(1);

    // --- PASO 6: Al escribir "consulta" → sin resultados ---
    const filteredEmpty = filterSuggestions(merged, 'consulta');
    expect(filteredEmpty).toHaveLength(0);
  });
});
