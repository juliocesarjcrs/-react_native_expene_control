import { SYNONYM_INDEX } from './synonymDictionary';
import { baseNormalize, stripOcrNoise, toTitleCase } from './normalizer';
import { isTruncationOf } from './prefixMatcher';

/**
 * Resuelve el nombre canónico de un producto.
 *
 * Pasos en orden de prioridad:
 *   1. Sinónimo exacto del nombre base             → canónico del diccionario
 *   2. Sinónimo exacto tras limpiar ruido OCR      → canónico del diccionario
 *   3. isTruncationOf contra existingCanonicals    → nombre ya en BD
 *   4. Sin match → toTitleCase limpio              → nuevo nombre normalizado
 *
 * La separación en pasos 1 y 2 permite que sinónimos que ya incluyen
 * el sufijo OCR ("tomate chonto ca") sigan funcionando exactamente igual,
 * y que los nuevos ("Tomate Chonto CA") sean resueltos por stripOcrNoise.
 *
 * @param rawDescription     - Texto crudo del OCR o entrada manual.
 *                             Ej: "Tomate Chonto CA — 0,5 kg @ $4.200 [Carulla]"
 * @param existingCanonicals - Nombres canónicos ya presentes en tu BD,
 *                             para detectar truncamientos de registros previos.
 */
export function canonicalize(rawDescription: string, existingCanonicals: string[] = []): string {
  // ── Desensamblar el string en sus tres partes ────────────────────────────
  //
  //   "Lechuga Batavia — 0.480 kg @ $5.026/kg (antes $7.180/kg, -30%) [Carulla]"
  //    ↑ namePart        ↑ weightSuffix                                 ↑ storeSuffix

  const storeMatch = rawDescription.match(/(\s*\[[^\]]+\])$/);
  const storeSuffix = storeMatch ? storeMatch[1] : '';
  const withoutStore = storeMatch ? rawDescription.slice(0, -storeSuffix.length) : rawDescription;

  const dashIndex = withoutStore.indexOf(' — ');
  const namePart = dashIndex !== -1 ? withoutStore.slice(0, dashIndex) : withoutStore;
  const weightSuffix = dashIndex !== -1 ? withoutStore.slice(dashIndex) : '';

  // ── Paso 1: lookup exacto (comportamiento original) ──────────────────────
  const normalized = baseNormalize(namePart);
  if (SYNONYM_INDEX.has(normalized)) {
    return `${SYNONYM_INDEX.get(normalized)!}${weightSuffix}${storeSuffix}`;
  }

  // ── Paso 2: lookup tras limpiar ruido OCR ────────────────────────────────
  //
  // stripOcrNoise quita sufijos como "CA", "AG", "Fracci", "M", etc.
  // que el OCR añade al nombre real pero que no son parte del producto.
  // Se aplica SOLO si el lookup exacto falló, para no degradar precisión.
  const cleanedName = stripOcrNoise(namePart);
  const normalizedCleaned = baseNormalize(cleanedName);

  if (normalizedCleaned !== normalized && SYNONYM_INDEX.has(normalizedCleaned)) {
    return `${SYNONYM_INDEX.get(normalizedCleaned)!}${weightSuffix}${storeSuffix}`;
  }

  // ── Paso 3: truncamiento contra existentes en BD ─────────────────────────
  //
  // Usa el nombre limpio (sin ruido OCR) para comparar con los existentes,
  // así "Tomate Chonto CA" compara como "Tomate Chonto" contra la BD.
  const nameForTruncation = cleanedName || namePart;
  const match = existingCanonicals.find((existing) => {
    const existingBase = existing
      .split(' — ')[0]
      .replace(/\s*\[[^\]]+\]$/, '')
      .trim();
    return isTruncationOf(nameForTruncation, existingBase);
  });

  if (match) {
    const canonicalName = match
      .split(' — ')[0]
      .replace(/\s*\[[^\]]+\]$/, '')
      .trim();
    return `${canonicalName}${weightSuffix}${storeSuffix}`;
  }

  // ── Paso 4: fallback → TitleCase del nombre limpio ──────────────────────
  const fallbackName = toTitleCase(
    nameForTruncation
      .replace(/[()[\]*]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );

  return `${fallbackName}${weightSuffix}${storeSuffix}`;
}
