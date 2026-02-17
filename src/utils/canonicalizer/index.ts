import { SYNONYM_INDEX } from './synonymDictionary';
import { baseNormalize, toTitleCase } from './normalizer';
import { isTruncationOf } from './prefixMatcher';

/**
 * Resuelve el nombre canónico de un producto.
 *
 * Pasos en orden de prioridad:
 * 1. Sinónimo exacto → retorna el canónico del diccionario
 * 2. Match por prefijo contra nombres ya en BD → retorna el nombre existente
 * 3. Ningún match → retorna el nombre normalizado (TitleCase, sin basura OCR)
 *
 * @param rawName - Nombre crudo del OCR (ej: "TOMATE CHONTO (A")
 * @param existingCanonicals - Nombres canónicos ya presentes en tu BD,
 *                             para detectar truncamientos de registros previos
 */
export function canonicalize(rawDescription: string, existingCanonicals: string[] = []): string {
  // Separar las tres partes que arman los parsers:
  //   "Lechuga Batavia — 0.480 kg @ $5.026/kg (antes $7.180/kg, -30%) [Carulla]"
  //    ↑ nombre base    ↑ sufijo de peso/precio                        ↑ tienda

  const storeMatch = rawDescription.match(/(\s*\[[^\]]+\])$/);
  const storeSuffix = storeMatch ? storeMatch[1] : '';
  const withoutStore = storeMatch ? rawDescription.slice(0, -storeSuffix.length) : rawDescription;

  const dashIndex = withoutStore.indexOf(' — ');
  const namePart = dashIndex !== -1 ? withoutStore.slice(0, dashIndex) : withoutStore;
  const weightSuffix = dashIndex !== -1 ? withoutStore.slice(dashIndex) : '';

  // Solo canonicalizar el nombre base
  const normalized = baseNormalize(namePart);

  let canonicalName: string;

  if (SYNONYM_INDEX.has(normalized)) {
    canonicalName = SYNONYM_INDEX.get(normalized)!;
  } else {
    // Buscar truncamiento contra existentes
    const match = existingCanonicals.find((existing) => {
      const existingBase = existing
        .split(' — ')[0]
        .replace(/\s*\[[^\]]+\]$/, '')
        .trim();
      return isTruncationOf(namePart, existingBase);
    });
    canonicalName = match
      ? match
          .split(' — ')[0]
          .replace(/\s*\[[^\]]+\]$/, '')
          .trim()
      : toTitleCase(
          namePart
            .replace(/[()[\]*]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim()
        );
  }

  // Rearmar respetando lo que el parser construyó
  return `${canonicalName}${weightSuffix}${storeSuffix}`;
}
