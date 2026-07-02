/**
 * pdfNormalizer.ts
 *
 * Orquestador de parsers PDF por tienda.
 *
 * A diferencia de la versión anterior que normalizaba texto tabular → líneas,
 * ahora cada tienda tiene su propio parser que trabaja directamente con
 * la estructura multilinea del OCR del PDF.
 *
 * Para agregar una tienda nueva:
 *   1. Crear parsers/parseXxxPdf.ts con función parseXxxPdf(lines, canonicals)
 *   2. Registrarla en PDF_PARSERS abajo
 *   3. Agregar detección en detectPdfStore() si hace falta
 */

import { Product } from '~/shared/types/components/receipt-scanner.type';
import { parseD1Pdf } from './parseD1Pdf';

// ─── Tipo de parser PDF ───────────────────────────────────────────────────────

type PdfParser = (lines: string[], existingCanonicals?: string[]) => Product[];

// ─── Registro de parsers ──────────────────────────────────────────────────────

type StoreKey = 'D1' | 'Generic';

const PDF_PARSERS: Partial<Record<StoreKey, PdfParser>> = {
  D1: parseD1Pdf
  // Carulla: parseCarullaPdf,  ← agregar cuando se implemente
};

// ─── Detección de tienda ──────────────────────────────────────────────────────

export function detectPdfStore(raw: string): StoreKey {
  const upper = raw.toUpperCase();
  if (upper.includes('DI S A S') || upper.includes('900276962') || upper.includes('TIENDA D1')) {
    return 'D1';
  }
  return 'Generic';
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────

/**
 * Parsea texto de PDF a productos usando el parser específico de la tienda.
 */
export function parsePdfText(
  raw: string,
  storeHint?: string,
  existingCanonicals: string[] = []
): Product[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, ' ').trim())
    .filter(Boolean);

  const store = (storeHint as StoreKey) ?? detectPdfStore(raw);
  const parser = PDF_PARSERS[store];

  if (parser) {
    const products = parser(lines, existingCanonicals);
    if (products.length > 0) return products;
  }

  // Fallback genérico: buscar cualquier línea con código de barras y precio
  return parseGenericPdf(lines);
}

// ─── Parser genérico (fallback) ───────────────────────────────────────────────

function parseGenericPdf(lines: string[]): Product[] {
  const results: Product[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const match = line.match(
      /(\d{1,3}(?:\.\d{3})+,\d{2})\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúña-z0-9\s'\/\-]{2,})/i
    );
    if (match) {
      const [, priceRaw, , descRaw] = match;
      const description = descRaw.trim().replace(/\s{2,}/g, ' ');
      const price = parseInt(priceRaw.replace(/\./g, '').replace(',', ''), 10);
      const key = `${description}-${price}`;
      if (price > 0 && price < 10_000_000 && !seen.has(key)) {
        seen.add(key);
        results.push({ description, price });
      }
    }
  }

  return results;
}
