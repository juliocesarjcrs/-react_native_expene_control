/**
 * araThermal.ts
 *
 * Parser para el tiquete térmico ACTUAL de Ara (OCR de imagen, isTable=true).
 * El formato viejo ("Artículo", código + precio en una línea) sigue en ara.ts.
 *
 * Cómo llega el OCR (observado en 1 muestra, ver fixture):
 *   - Cada producto se parte en fragmentos que NO conservan el orden por fila:
 *       "4.390"                                     ← VALOR/T suelto
 *       "1 7704259870192 HABAS TOTE X 10 J 1 UN 4.390"
 *       "1 UN 9.690 9.690"                          ← VALOR/U y VALOR/T, sin descripción
 *       "2 7622202860072 GLLTA OREO SURT J"
 *   - Los fragmentos de precio (sueltos o "CANT UM U T") aparecen en el MISMO
 *     orden que los productos, uno por producto. Se emparejan por orden.
 *   - El VALOR/T ya viene neto de descuento (ítem 3: 17.890 → 14.312).
 *   - La descripción viene truncada y termina en una letra suelta ("J").
 *   - El resumen ("-3.578 FACTURA= 50.062") puede quedar pegado a la línea de un producto.
 *
 * Validación: la suma de productos se compara con "FACTURA=" (total impreso).
 */

import { Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from '../formatDescription';
import { formatSimpleProduct } from '../helpers';

const RECEIPT_TYPE: ReceiptType = 'Ara';

const log = __DEV__
  ? (msg: string, data?: unknown) => console.log(`[parseAraThermal] ${msg}`, data ?? '')
  : () => {};

// "4.390", "14.312", "3. 990" (el OCR a veces deja un espacio tras el punto)
const PRICE = String.raw`\d{1,3}(?:\.\s?\d{3})*`;

const BARCODE_LINE = /^(?:(\d{1,3})\s+)?(\d{13,14})\s+(.+)$/;
const STANDALONE_PRICE = new RegExp(`^(${PRICE})$`);
const QTY_LINE = new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(?:UN|UND|KG)\\s+(${PRICE})(?:\\s+(${PRICE}))?$`, 'i');
const INLINE_QTY = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:UN|UND|KG)\\s+(${PRICE})(?:\\s+(${PRICE}))?\\s*$`, 'i');

function parsePrice(raw: string): number {
  return parseInt(raw.replace(/[.\s]/g, ''), 10);
}

function lineTotal(qtyRaw: string, p1: string, p2?: string): number {
  if (p2) return parsePrice(p2); // VALOR/T explícito (ya neto de descuento)
  const qty = parseFloat(qtyRaw.replace(',', '.'));
  return Math.round(parsePrice(p1) * (Number.isFinite(qty) ? qty : 1));
}

// ─── Detección ────────────────────────────────────────────────────────────────

/** Requiere 2 de 3 marcadores: el OCR deforma encabezados ("VALOR/1" en vez de "VALOR/T"). */
export function isAraThermal(ocr: string): boolean {
  const upper = ocr.toUpperCase();
  const markers = [
    /ID\s+CANT\s+UM/.test(upper),
    /VALOR\s*\/\s*[UT1]/.test(upper),
    /FACTURA\s*=/.test(upper) || /TOTALES\s*:\s*\*?\s*RECARGOS/.test(upper)
  ];
  return markers.filter(Boolean).length >= 2;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function cleanDescription(rest: string): string {
  return rest
    .replace(/-?\s*\d[\d.\s]*FACTURA\s*=.*$/i, '') // "-3.578 FACTURA= 50.062"
    .replace(/FACTURA\s*=.*$/i, '')
    .replace(new RegExp(`\\s+\\d+(?:[.,]\\d+)?\\s*(?:UN|UND|KG)\\s+[\\d.\\s-]*$`, 'i'), '') // "1 UN 4.390"
    .replace(new RegExp(`(?:\\s+-?${PRICE})+\\s*$`), '') // precios sueltos al final
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/\s+[A-Z]$/, ''); // letra suelta del truncado ("J"), tras el trim
}

/** Primera línea después del encabezado de la tabla (evita tomar NIT/dirección como precios). */
function findBodyStart(lines: string[]): number {
  let idx = -1;
  lines.forEach((l, i) => {
    if (/^CODIGO\b/i.test(l) || /^ID\s+CANT/i.test(l)) idx = i;
  });
  return idx + 1;
}

function findPrintedTotal(lines: string[]): number | null {
  for (const l of lines) {
    const m = l.match(new RegExp(`FACTURA\\s*=\\s*(${PRICE})`, 'i'));
    if (m) return parsePrice(m[1]);
  }
  return null;
}

// ─── Parser principal ─────────────────────────────────────────────────────────

export function parseAraThermal(lines: string[]): Product[] {
  const start = findBodyStart(lines);
  const items: { description: string; inlineTotal: number | null }[] = [];
  const totals: number[] = [];

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (/^TOTALES\b/i.test(line)) break;

    const item = line.match(BARCODE_LINE);
    if (item) {
      const description = cleanDescription(item[3]);
      const inline = item[3].match(INLINE_QTY);
      items.push({
        description,
        inlineTotal: inline ? lineTotal(inline[1], inline[2], inline[3]) : null
      });
      continue;
    }

    const standalone = line.match(STANDALONE_PRICE);
    if (standalone) {
      totals.push(parsePrice(standalone[1]));
      continue;
    }

    const qty = line.match(QTY_LINE);
    if (qty) totals.push(lineTotal(qty[1], qty[2], qty[3]));
  }

  log('Items / totales', { items: items.length, totals: totals.length });

  const paired = totals.length === items.length;
  const products: Product[] = [];

  items.forEach((it, idx) => {
    const price = paired ? totals[idx] : it.inlineTotal;
    if (price == null || !(price > 0) || it.description.length < 3) {
      log('Ítem descartado', { description: it.description, price });
      return;
    }
    products.push({
      description: formatSimpleProduct(
        formatDescription(it.description.replace(/\./g, '')),
        RECEIPT_TYPE
      ),
      price
    });
  });

  // Validación contra el total impreso
  const printed = findPrintedTotal(lines);
  const sum = products.reduce((acc, p) => acc + p.price, 0);
  if (printed != null && sum !== printed) {
    log('⚠ La suma no coincide con FACTURA=', { sum, printed, paired });
  }

  return products;
}