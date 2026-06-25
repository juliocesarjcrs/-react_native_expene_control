/**
 * parseD1Pdf.ts
 *
 * Parser para facturas electrónicas PDF de D1.
 *
 * El OCR de un PDF de D1 parte cada producto en 3 líneas:
 *   Línea 1: "N  CÓDIGO(13d)  DESCRIPCIÓN"
 *   Línea 2: "UND  VR_UNI  VR_BASE"
 *   Línea 3: "IVA_MONTO  %IVA  INC  ...  VR_TOTAL"
 */

import { Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from '../formatDescription';
import { formatSimpleProduct } from '../helpers';
import { canonicalize } from '../../canonicalizer';

const RECEIPT_TYPE: ReceiptType = 'D1';

const log = __DEV__
  ? (msg: string, data?: unknown) => console.log(`[parseD1Pdf] ${msg}`, data ?? '')
  : () => {};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convierte precio colombiano a entero sin decimales.
 *
 * Bug anterior: replace(/\./g,'').replace(',','') sobre "14.900,00"
 *   daba "1490000" porque quitaba el punto de miles Y la coma decimal
 *   como separadores independientes, concatenando todos los dígitos.
 *
 * Fix: quitar primero los 2 decimales (,XX), luego los puntos de miles.
 *   "14.900,00" → "14.900" → "14900" = 14900 ✓
 */
function parseColombianPrice(raw: string): number {
  const cleaned = raw.trim();

  // Formato colombiano estándar: "14.900,00" (punto miles, coma decimal)
  if (/^\d{1,3}(?:\.\d{3})+,\d{2}$/.test(cleaned)) {
    const sinDecimales = cleaned.replace(/,\d{2}$/, ''); // "14.900,00" → "14.900"
    return parseInt(sinDecimales.replace(/\./g, ''), 10); // "14.900" → 14900
  }

  // Sin separador de miles: "4500" o "4.500" o "4,500"
  return parseInt(cleaned.replace(/[.,]/g, ''), 10);
}

/** Extrae todos los precios colombianos válidos de una línea */
function extractPrices(line: string): number[] {
  // Solo capturar formato "X.XXX,XX" — evitar capturar porcentajes (19,00)
  // o números de IVA que no son precios de producto
  const matches = line.match(/\d{1,3}(?:\.\d{3})+,\d{2}/g) ?? [];
  return matches.map(parseColombianPrice).filter((p) => p >= 100 && p < 10_000_000); // mínimo $100 para excluir porcentajes
}

/** Líneas de totales/resumen que deben ignorarse */
function isSummaryLine(line: string): boolean {
  const upper = line.toUpperCase();
  return (
    upper.includes('SUBTOTAL') ||
    upper.includes('BASE/IMP') ||
    upper.includes('TOTAL ARTICULO') ||
    upper.includes('TOTAL ARTÍCULO') ||
    /^TOTAL\s*:/.test(upper) ||
    upper.startsWith('IVA:') ||
    upper.includes('EFECTIVO') ||
    upper.includes('CAMBIO') ||
    upper.includes('CUFE') ||
    upper.includes('RESOLUCIÓN') ||
    upper.includes('RESOLUCION') ||
    upper.includes('SISTEMA') ||
    upper.includes('AJUSTE') ||
    upper.includes('FORMA DE PAGO') ||
    upper.includes('DISCRIMINACIÓN') ||
    upper.includes('DISCRIMINACION') ||
    upper.includes('SOMOS GRANDES') ||
    upper.includes('LÍNEA DE ATENCIÓN') ||
    upper.includes('LINEA DE ATENCION')
  );
}

/** Detecta inicio de ítem: "N  CÓDIGO(8-13d)  DESCRIPCIÓN" */
function parseItemStartLine(line: string): { barcode: string; description: string } | null {
  const match = line.match(
    /^\d{1,3}\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúña-z0-9\s'\/\-\.]{2,})/
  );
  if (!match) return null;
  return {
    barcode: match[1],
    description: match[2].trim().replace(/\s{2,}/g, ' ')
  };
}

// ─── Parser principal ─────────────────────────────────────────────────────────

export function parseD1Pdf(lines: string[], existingCanonicals: string[] = []): Product[] {
  const products: Product[] = [];
  const seen = new Set<string>();

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line || isSummaryLine(line)) {
      i++;
      continue;
    }

    const itemStart = parseItemStartLine(line);
    if (!itemStart) {
      i++;
      continue;
    }

    const { barcode, description } = itemStart;
    const groupLines: string[] = [];

    // Agrupar líneas siguientes hasta el próximo ítem o resumen
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j].trim();
      if (!next || isSummaryLine(next) || parseItemStartLine(next)) break;
      groupLines.push(next);
      j++;
    }

    log('Item group', { barcode, description, groupLines });

    // Extraer VR_TOTAL: en D1, la última línea del grupo contiene
    // "IVA_MONTO  %IVA  INC  INC  *CARGO  VR_TOTAL"
    // VR_TOTAL es el último precio de esa línea.
    // La línea UND (primera del grupo) tiene VR_UNI y VR_BASE.
    // Buscamos el último precio de la última línea con precios.
    let vrTotal = 0;

    // Iterar de atrás hacia adelante para encontrar VR_TOTAL primero
    for (let k = groupLines.length - 1; k >= 0; k--) {
      const prices = extractPrices(groupLines[k]);
      if (prices.length > 0) {
        // El último precio de la última línea con precios es VR_TOTAL
        vrTotal = prices[prices.length - 1];
        break;
      }
    }

    log('Extracted price', { barcode, description, vrTotal });

    if (vrTotal > 0 && description.length >= 3) {
      const formattedDesc = formatSimpleProduct(formatDescription(description), RECEIPT_TYPE);
      const key = `${barcode}-${vrTotal}`;
      if (!seen.has(key)) {
        seen.add(key);
        products.push({ description: formattedDesc, price: vrTotal });
      }
    }

    i = j;
  }

  return products.map((p) => ({
    ...p,
    description: canonicalize(p.description, existingCanonicals)
  }));
}
