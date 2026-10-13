import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  assetLinkKey,
  getAssetLink,
  saveAssetLink,
  clearAssetLink,
  parseAliasInput
} from '~/utils/commentary/assetLinks.utils';

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

// Escribe directamente en el almacén (simula datos viejos o corruptos)
const writeRaw = (ids: number[], value: string) => {
  store[assetLinkKey(ids)] = value;
};

beforeEach(clearStore);

describe('assetLinkKey', () => {
  it('ordena los ids: el mismo bien siempre da la misma clave', () => {
    expect(assetLinkKey([3010, 3008])).toBe('asset_link_3008-3010');
    expect(assetLinkKey([3008, 3010])).toBe(assetLinkKey([3010, 3008]));
  });
  it('no muta el arreglo recibido', () => {
    const ids = [5, 1];
    assetLinkKey(ids);
    expect(ids).toEqual([5, 1]);
  });
});

describe('getAssetLink / saveAssetLink / clearAssetLink', () => {
  it('sin vínculo guardado → null (la pantalla debe preguntar)', async () => {
    expect(await getAssetLink([3008])).toBeNull();
  });

  it('guarda y recuerda una categoría de ingreso', async () => {
    await saveAssetLink([3008], {
      kind: 'income',
      categoryId: 554,
      categoryName: 'Arriendo Apt 1102'
    });
    expect(await getAssetLink([3008])).toEqual({
      kind: 'income',
      categoryId: 554,
      categoryName: 'Arriendo Apt 1102'
    });
  });

  it('recuerda "sin arriendo" (lote) para no volver a preguntar', async () => {
    await saveAssetLink([3007], { kind: 'none' });
    expect(await getAssetLink([3007])).toEqual({ kind: 'none' });
  });

  it('cada bien tiene su propio vínculo', async () => {
    await saveAssetLink([3008], { kind: 'income', categoryId: 554, categoryName: 'A' });
    await saveAssetLink([3007], { kind: 'none' });
    expect((await getAssetLink([3008]))?.kind).toBe('income');
    expect((await getAssetLink([3007]))?.kind).toBe('none');
  });

  it('clear borra solo ese vínculo', async () => {
    await saveAssetLink([3008], { kind: 'none' });
    await saveAssetLink([3007], { kind: 'none' });
    await clearAssetLink([3008]);
    expect(await getAssetLink([3008])).toBeNull();
    expect(await getAssetLink([3007])).not.toBeNull();
  });

  it('JSON corrupto → null, sin lanzar', async () => {
    writeRaw([1], '{no es json');
    expect(await getAssetLink([1])).toBeNull();
  });

  const invalidShapes: unknown[] = [
    { kind: 'income' },
    { kind: 'income', categoryId: '554', categoryName: 'x' },
    { kind: 'otro' },
    'texto',
    null
  ];

  it.each(invalidShapes)('forma inválida %j → null, sin lanzar', async (bad) => {
    writeRaw([2], JSON.stringify(bad));
    expect(await getAssetLink([2])).toBeNull();
  });
});

describe('vínculo con nombres del bien', () => {
  it('guarda y recuerda los nombres', async () => {
    await saveAssetLink([3008], {
      kind: 'income',
      categoryId: 9,
      categoryName: 'Arriendos',
      aliases: ['Apt 1102']
    });
    expect(await getAssetLink([3008])).toEqual({
      kind: 'income',
      categoryId: 9,
      categoryName: 'Arriendos',
      aliases: ['Apt 1102']
    });
  });

  it('un vínculo viejo sin nombres sigue siendo válido', async () => {
    writeRaw(
      [5],
      JSON.stringify({
        kind: 'income',
        categoryId: 9,
        categoryName: 'Arriendos'
      })
    );
    expect((await getAssetLink([5]))?.kind).toBe('income');
  });

  const invalidAliases: unknown[] = ['Apt 1102', [1, 2], [null]];

  it.each(invalidAliases)('nombres con forma inválida %j → null', async (aliases) => {
    writeRaw(
      [6],
      JSON.stringify({
        kind: 'income',
        categoryId: 9,
        categoryName: 'A',
        aliases
      })
    );
    expect(await getAssetLink([6])).toBeNull();
  });
});

describe('parseAliasInput', () => {
  it('separa por coma, recorta y quita vacíos', () => {
    expect(parseAliasInput(' Apt 1102 , Apto 1102 ,, ')).toEqual(['Apt 1102', 'Apto 1102']);
  });
  it('quita repetidos aunque cambien mayúsculas o puntuación', () => {
    expect(parseAliasInput('Apt 1102, APT. 1102, apt1102')).toEqual(['Apt 1102']);
  });
  it('texto vacío → ninguno', () => {
    expect(parseAliasInput('   ')).toEqual([]);
    expect(parseAliasInput('')).toEqual([]);
  });
});
