/**
 * Vínculo bien ↔ categoría de ingreso (el arriendo), recordado en AsyncStorage.
 * Ubicación: src/utils/commentary/assetLinks.utils.ts
 *
 * Los ingresos solo tienen categoryId (no subcategoría), así que la pantalla de
 * bienes pregunta UNA vez cuál es la categoría de ingreso del bien y la recuerda.
 *
 * Clave: asset_link_{ids de subcategoría ordenados y unidos con "-"}
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeAlias } from '~/utils/commentaryParser/assetConcepts';

const PREFIX = 'asset_link_';

export type AssetLink =
  | {
      kind: 'income';
      categoryId: number;
      categoryName: string;
      /** Nombres del bien tal como van en [Bien: ...]. Sin ellos se cuentan todos los ingresos */
      aliases?: string[];
    }
  /** El bien no genera arriendo (p. ej. un lote): no volver a preguntar */
  | { kind: 'none' };

export const assetLinkKey = (subcategoryIds: number[]): string =>
  `${PREFIX}${[...subcategoryIds].sort((a, b) => a - b).join('-')}`;

const isValidLink = (v: unknown): v is AssetLink => {
  if (!v || typeof v !== 'object') return false;
  const l = v as Record<string, unknown>;
  if (l.kind === 'none') return true;
  return (
    l.kind === 'income' &&
    typeof l.categoryId === 'number' &&
    Number.isFinite(l.categoryId) &&
    typeof l.categoryName === 'string' &&
    (l.aliases === undefined ||
      (Array.isArray(l.aliases) && l.aliases.every((a) => typeof a === 'string')))
  );
};

/** "Apt 1102, Apto 1102" → ["Apt 1102", "Apto 1102"] (sin vacíos ni repetidos) */
export const parseAliasInput = (text: string): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of text.split(',')) {
    const alias = part.trim();
    const key = normalizeAlias(alias);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(alias);
    }
  }
  return out;
};

/** null = todavía no se ha vinculado (o el dato guardado está corrupto). */
export const getAssetLink = async (subcategoryIds: number[]): Promise<AssetLink | null> => {
  try {
    const raw = await AsyncStorage.getItem(assetLinkKey(subcategoryIds));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidLink(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveAssetLink = async (subcategoryIds: number[], link: AssetLink): Promise<void> => {
  await AsyncStorage.setItem(assetLinkKey(subcategoryIds), JSON.stringify(link));
};

export const clearAssetLink = async (subcategoryIds: number[]): Promise<void> => {
  await AsyncStorage.removeItem(assetLinkKey(subcategoryIds));
};
