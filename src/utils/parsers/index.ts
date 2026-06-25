/**
 * extractProducts.ts
 *
 * Punto de entrada unificado para extraer productos de texto OCR
 * proveniente de imagen o PDF.
 *
 * Imagen → parsers existentes sin cambios
 * PDF    → parsers específicos por tienda (parseD1Pdf, etc.)
 */

import { Product } from '~/shared/types/components/receipt-scanner.type';
import { parseCarulla } from './carulla';
import { parseD1 } from './d1';
import { parseGeneric } from './parseGeneric';
import { parseDollarCity } from './dollarCity';
import { parseAra } from './ara';
import { parseCruzVerde } from './cruzVerde';
import { isSuperCarnesJH, parseSuperCarnesJH } from './superCarnesJH';
import { isFruverLaGranja, parseFruverLaGranja } from './fruverLaGranja';
import { parsePdfText, detectPdfStore } from './pdfNormalizer';

export type SourceType = 'image' | 'pdf';

export interface ExtractOptions {
  storeHint?: 'Carulla' | 'Exito' | string;
  sourceType?: SourceType;
  existingCanonicals?: string[];
}

// ─── Flujo imagen (sin cambios) ───────────────────────────────────────────────

function extractFromImage(ocr: string, storeHint?: string): Product[] {
  const lines = ocr
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, ' ').trim())
    .filter(Boolean);
  const joined = lines.join(' ');

  const isD1 = ocr.includes('CAN ') || ocr.includes('DESCRIPCION');
  const isCarulla = ocr.includes('PLU') || ocr.includes('DETALLE');
  const isDollarCity = ocr.includes('@');
  const isAra = ocr.includes('Artículo') || ocr.includes('Articulo');
  const isCruzVerde = ocr.includes('TARIFA') && ocr.includes('IVA');
  const isSuperCarnes = isSuperCarnesJH(ocr);
  const isFruver = isFruverLaGranja(ocr);

  if (isFruver) return parseFruverLaGranja(lines, joined);
  if (isSuperCarnes) return parseSuperCarnesJH(lines, joined);
  if (isCruzVerde) return parseCruzVerde(lines);
  if (isCarulla)
    return parseCarulla(lines, joined, [], storeHint as 'Carulla' | 'Exito' | undefined);
  if (isD1) return parseD1(lines, joined);
  if (isDollarCity) return parseDollarCity(lines);
  if (isAra) return parseAra(lines);
  return parseGeneric(lines, joined);
}

// ─── Punto de entrada público ─────────────────────────────────────────────────

/**
 * @param ocr        - Texto crudo devuelto por OCR.space
 * @param options    - { storeHint, sourceType, existingCanonicals }
 *
 * Compatibilidad hacia atrás: acepta storeHint como segundo argumento string.
 */
export function extractProducts(
  ocr: string,
  optionsOrHint?: ExtractOptions | 'Carulla' | 'Exito'
): Product[] {
  const options: ExtractOptions =
    typeof optionsOrHint === 'string' ? { storeHint: optionsOrHint } : (optionsOrHint ?? {});

  const { storeHint, sourceType = 'image', existingCanonicals = [] } = options;

  if (sourceType === 'pdf') {
    return parsePdfText(ocr, storeHint, existingCanonicals);
  }

  return extractFromImage(ocr, storeHint);
}
