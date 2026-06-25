/**
 * pdfNormalizerD1.ts
 *
 * Normaliza texto tabular de facturas PDF de D1 a líneas lineales.
 *
 * El PDF de D1 tiene esta estructura de columnas (puede variar):
 *   ÍTEM  CÓDIGO  CANT  IVA  DESCRIPCIÓN  UN.MED  % IVA  VR UNI INC  VR BASE  %INC  *CARGO  DTO  VR TOTAL
 *
 * OCR.space lo devuelve como texto mezclado horizontalmente. Esta función
 * reconstruye la fila semántica y la convierte al formato que parseD1() ya lee:
 *   "VR_TOTAL CÓDIGO DESCRIPCIÓN"
 *
 * Robustez ante variaciones:
 *   - Detecta la fila de cabecera dinámicamente (no posición fija)
 *   - Acepta precios con punto o coma como separador de miles
 *   - Tolera líneas parciales (toma VR UNI si no hay VR TOTAL)
 *   - Ignora filas de totales, subtotales y metadata
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte "7.500,00" o "7,500.00" o "7500" → 7500 */
function parseColombianPrice(raw: string): number {
  // Formato colombiano: punto de miles, coma decimal → "7.500,00"
  // Formato alternativo: coma de miles, punto decimal → "7,500.00"
  const cleaned = raw.trim();

  // Si tiene coma antes de 2 decimales al final → coma es decimal
  if (/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(cleaned)) {
    return parseInt(cleaned.replace(/\./g, '').replace(',', ''), 10);
  }
  // Si tiene punto antes de 2 decimales al final → punto es decimal
  if (/^\d{1,3}(?:,\d{3})*\.\d{2}$/.test(cleaned)) {
    return parseInt(cleaned.replace(/,/g, '').replace('.', ''), 10);
  }
  // Sin decimales explícitos: quitar separadores de miles
  return parseInt(cleaned.replace(/[.,]/g, ''), 10);
}

/** Detecta si una línea es una fila de producto válida (empieza con número de ítem) */
function isProductRow(line: string): boolean {
  return /^\d{1,3}\s+\d{8,13}/.test(line);
}

/** Detecta líneas de totales/metadata que deben ignorarse */
function isSummaryLine(line: string): boolean {
  const upper = line.toUpperCase();
  return (
    upper.includes('SUBTOTAL') ||
    upper.includes('DESCUENTO') ||
    upper.includes('TOTAL ARTÍCULO') ||
    upper.includes('TOTAL ARTICULO') ||
    upper.includes('IVA:') ||
    upper.includes('FORMA DE PAGO') ||
    upper.includes('EFECTIVO') ||
    upper.includes('CAMBIO') ||
    upper.includes('CUFE') ||
    upper.includes('RESOLUCIÓN') ||
    upper.includes('RESOLUCION') ||
    upper.includes('SISTEMA') ||
    upper.includes('DESARROLLADO') ||
    /^TOTAL\s*:/.test(upper)
  );
}

// ─── Estrategia A: detección por cabecera de tabla ────────────────────────────

/**
 * Busca la línea de cabecera de la tabla de productos.
 * Retorna el índice de la línea siguiente a la cabecera, o -1 si no se encuentra.
 */
function findTableStart(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const upper = lines[i].toUpperCase();
    // La cabecera siempre contiene CÓDIGO (o CODIGO) y DESCRIPCIÓN (o DESCRIPCION)
    if (
      (upper.includes('CÓDIGO') || upper.includes('CODIGO')) &&
      (upper.includes('DESCRIPCIÓN') || upper.includes('DESCRIPCION'))
    ) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Extrae productos de las líneas de tabla cuando se pudo detectar la cabecera.
 *
 * Cada fila de producto tiene el patrón:
 *   ÍTEM  CÓDIGO(13d)  CANT  IVA_MONTO  DESCRIPCIÓN  UN.MED  %IVA  VR_UNI  ...  VR_TOTAL
 *
 * Pero OCR puede partir una fila en múltiples líneas. Esta función agrupa
 * líneas consecutivas que pertenecen al mismo ítem.
 */
function extractFromTable(lines: string[], startIndex: number): string[] {
  const results: string[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (isSummaryLine(line)) {
      i++;
      continue;
    }

    // Inicio de fila de producto: número de ítem seguido de código de barras
    const rowStart = line.match(/^(\d{1,3})\s+(\d{8,13})\s+(.*)/);
    if (!rowStart) {
      i++;
      continue;
    }

    const [, , barcode, rest] = rowStart;

    // Acumular líneas siguientes que puedan ser continuación de esta fila
    // (no empiezan con número de ítem ni son líneas de resumen)
    let accumulated = rest;
    let j = i + 1;
    while (
      j < lines.length &&
      !isProductRow(lines[j]) &&
      !isSummaryLine(lines[j]) &&
      lines[j].trim().length > 0
    ) {
      accumulated += ' ' + lines[j].trim();
      j++;
    }

    // Extraer descripción: texto alfabético antes de los precios
    const descMatch = accumulated.match(
      /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúña-z0-9\s'\/\-]{2,?}?)(?=\s+(?:UND|UN\b|\d{1,3}[.,]\d{3}))/i
    );
    const description = descMatch ? descMatch[1].trim() : accumulated.split(/\s{2,}/)[0].trim();

    // Extraer VR TOTAL: último precio en la fila acumulada (formato colombiano)
    // Patrón: número con puntos/comas como último valor monetario
    const priceMatches = [...accumulated.matchAll(/(\d{1,3}(?:[.,]\d{3})+(?:,\d{2})?)/g)];
    const lastPrice = priceMatches.length > 0 ? priceMatches[priceMatches.length - 1][1] : null;

    if (lastPrice && description.length >= 3) {
      const price = parseColombianPrice(lastPrice);
      if (price > 0 && price < 10_000_000) {
        // Formato que parseD1 reconoce: "PRECIO CÓDIGO DESCRIPCIÓN"
        results.push(`${price} ${barcode} ${description.toUpperCase()}`);
      }
    }

    i = j;
  }

  return results;
}

// ─── Estrategia B: regex directo sobre texto completo (fallback) ──────────────

/**
 * Cuando no se puede detectar la cabecera, busca patrones de producto
 * directamente en el texto completo usando regex más permisivo.
 */
function extractByRegex(raw: string): string[] {
  const results: string[] = [];

  // Patrón: número_item  código(8-13d)  ...texto...  precio_total
  // Acepta variaciones en espacios y separadores
  const pattern =
    /\b(\d{1,3})\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúña-z0-9\s'\/\-]{2,40?}?)\s+(?:UND\s+)?(?:\d+\s+)?(\d{1,3}[.,]\d{3}(?:,\d{2})?)\b/gi;

  let match;
  const seen = new Set<string>();

  while ((match = pattern.exec(raw)) !== null) {
    const [, , barcode, descRaw, priceRaw] = match;
    const description = descRaw
      .trim()
      .replace(/\s{2,}/g, ' ')
      .toUpperCase();
    const price = parseColombianPrice(priceRaw);

    if (price > 0 && price < 10_000_000 && description.length >= 3) {
      const key = `${barcode}-${price}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(`${price} ${barcode} ${description}`);
      }
    }
  }

  return results;
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────

/**
 * Normaliza el texto crudo de un PDF de D1 a líneas lineales.
 * Usa detección por cabecera primero; si falla, usa regex de fallback.
 *
 * @param raw - Texto completo devuelto por OCR.space para el PDF
 * @returns   - Array de líneas en formato "PRECIO CÓDIGO DESCRIPCIÓN"
 */
export function normalizeD1Pdf(raw: string): string[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, ' ').trim())
    .filter(Boolean);

  // Estrategia A: usar cabecera de tabla
  const tableStart = findTableStart(lines);
  if (tableStart !== -1) {
    const products = extractFromTable(lines, tableStart);
    if (products.length > 0) return products;
  }

  // Estrategia B: regex directo (fallback robusto)
  const fallback = extractByRegex(raw);
  if (fallback.length > 0) return fallback;

  // Sin resultados: devolver líneas limpias para que parseD1 intente su propio fallback
  return lines;
}
