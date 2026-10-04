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

const PREFIX = 'asset_link_';

export type AssetLink =
  | { kind: 'income'; categoryId: number; categoryName: string }
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
    typeof l.categoryName === 'string'
  );
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
