import { Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';
import { formatSimpleProduct, processWeightAndSavings, cleanPrice, limitProducts } from './helpers';
import { canonicalize } from '../canonicalizer';

// ===== PATRONES GLOBALES =====
// Nombrados para documentar qué formato capturan, no solo cómo.

/** Línea genérica: "N <descripción> [precio]" — usado en AltCarulla y fallback */
const PRODUCT_PATTERN =
  /^\d+\s+([A-Za-zÀÁÉÍÓÚÜÑñáéíóúü#%().,\/&\s*\-]+?(?:\s*\/\s*[A-Za-zÀÁÉÍÓÚÜÑñáéíóúü#%().,\/&\s*\-]+?)*)(?:\s+(\d{1,3}(?:[.,]\s?\d{2,3})?)[A-Za-z]*)?$/i;

/** Precio al final de cualquier línea — usado para búsqueda de precio lookahead */
const PRICE_PATTERN = /(\d+[.,]?\d*[A-Za-z]?)\s*$/;

/** Línea de producto Éxito: "PLU <DESCRIPCIÓN> precio[A]" — precio con sufijo letra OCR */
const EXITO_PRODUCT_PATTERN = /(\d{6,})\s+([A-Z].+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Z]?/;

// ===== PATRONES DE LÍNEA DE UNIDAD (KGM / 1/u) =====
// Agrupados aquí porque son la parte más compleja y se usan en processCarullaCase6.

/**
 * KGM sin número de ítem al inicio — OCR de baja calidad.
 * Captura: [1]=peso/KGM  [2]=precio_unitario  [3]=ahorro
 * Ejemplo: "0. 870/KGM × 20.900 V. Ahorro 3.637"
 */
const KGM_NO_ITEM = /^([\d.\s]+\/KGM)\s+\S+\s+([\d.,]+)\s+V\.\s*Ahorro\s+([\d.,]+)\s*$/i;

/**
 * KGM con número de ítem, ahorro separado por espacio (no tab).
 * Espacio (no tab) en "Ahorro[ ]+" es el discriminador vs precio tab-separado.
 * Captura: [1]=peso/KGM  [2]=precio_unitario  [3]=ahorro
 * Ejemplo: "1 0.305/KGM x 9.340 V. Ahorro 854"
 */
const KGM_SAVINGS_SPACE = /^\d+\s+([\d.]+\/KGM)\s+\S+\s+([\d.,]+)\s+V\.\s*Ahorro[ ]+([\d.,]+)\s*$/i;

/**
 * KGM con ahorro + código PLU en la misma línea — descripción+precio en línea siguiente.
 * Captura: [1]=peso/KGM  [2]=precio_unitario  [3]=ahorro  [4]=PLU
 * Ejemplo: "1 0.680/KGM x 7.580 V. Ahorro 1.546  1137"
 *           siguiente: "HABICHUELA A GRA  3.608"
 */
const KGM_WITH_PLU =
  /^\d+\s+([\d.]+\/KGM)\s+\S+\s+([\d.,]+)\s+V\.\s*Ahorro\s+([\d.,]+)\s+(\d{4,})\s*$/i;

/**
 * KGM con precio embebido al final — producto en siguiente línea sin precio.
 * [\s\d.,]*? (lazy) maneja tabs, comas en ahorro, o ahorro ausente.
 * Captura: [1]=peso/KGM  [2]=precio_unitario  [3]=precio_final
 * Ejemplo: "15 0.625/KGM x 4.180 V. Ahorro 0  2.613"
 */
const KGM_PRICE_INLINE =
  /^\d+\s+([\d.]+\/KGM)\s+\S+\s+([\d.,]+)\s+V\.\s*Ahorro[\s\d.,]*?(\d{1,3}[.,]\s?\d{3})\s*[A-Za-z]?\s*$/i;

/**
 * 1/u con precio embebido al final — producto en siguiente línea sin precio.
 * [\s\d.,]*? (lazy) maneja coma en ahorro (9,090), tab entre ahorro y precio.
 * Captura: [1]=precio_unitario  [2]=precio_final
 * Ejemplo: "7 1/u x 30.300 V. Ahorro 9,090  21.210A"
 */
const UNIT_PRICE_INLINE =
  /^\d+\s+(?:1\/u|\d+\.?\d*\/\w+)\s+\S+\s+([\d.,]+)\s+V\.?\s*Ahorro[\s\d.,]*?(\d{1,3}[.,]\s?\d{3})\s*[A-Za-z]?\s*$/i;

/**
 * 1/u sin precio en la línea — precio viene en la siguiente línea del PLU.
 * Tolerancias OCR: "Ã—" en vez de "×", ":" como prefijo de precio (":36.990").
 * \s*$ tolera trailing whitespace sin capturar precio tab-separado.
 * Captura: [1]=precio_unitario
 * Ejemplo: "2 1/u Ã— :36.990 V. Ahorro 0"
 */
const UNIT_NO_PRICE =
  /^\d+\s+(?:1\/u|\d+\.?\d*\/\w+)\s+\S+\s+:?([\d.,]+)\s+V\.?\s*Ahorro\s+[\d.,]+\s*$/i;

// ===== PATRONES DE LÍNEA DE PRODUCTO =====

/** PLU + descripción + precio (con o sin sufijo letra OCR) */
const PRODUCT_WITH_PRICE = /^(\d{4,})\s+(.+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Za-z]?$/;

/** PLU + descripción sin precio — precio viene en línea anterior o siguiente */
const PRODUCT_NO_PRICE = /^(\d{4,})\s+(.+?)$/;

/** Descripción + precio sin PLU — para P1B donde el PLU está en línea anterior */
const DESC_WITH_PRICE = /^([A-Za-z][A-Za-z\s.#%&\/\-]+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Za-z]?$/i;

// ===== HELPERS INTERNOS =====

/**
 * Normaliza precio con artefactos OCR antes de parsear.
 * "36, 990" → 36990 (espacio/coma de miles introducidos por el scanner).
 */
function normalizePrice(raw: string): number {
  return cleanPrice(raw.replace(/[\s,]/g, ''));
}

/**
 * Construye la descripción final a partir del nombre crudo y la línea de unidad contextual.
 * Centraliza el patrón repetido: formatDescription → enrichDescription o formatSimpleProduct.
 * @param rawName  - Nombre sin formatear (directo del OCR)
 * @param unitLine - Línea anterior con info de peso/unidad, o null si no hay contexto
 */
function buildDescription(
  rawName: string,
  unitLine: string | null,
  price: number,
  receiptType: ReceiptType
): string {
  const base = formatDescription(rawName);
  return unitLine
    ? enrichDescription(unitLine, base, price, receiptType)
    : formatSimpleProduct(base, receiptType);
}

// ===== FORMATEO DE UNIDADES =====

/**
 * Formatea líneas con "1/u": agrega precio unitario y descuento si aplica.
 * Similar a processWeightAndSavings (helpers.ts) pero para ítems por unidad.
 */
function processUnitAndPrice(
  line: string,
  productName: string,
  finalPrice: number,
  receiptType: ReceiptType
): string {
  if (!/1\/u/i.test(line)) return productName;

  // Tolerancia OCR: multiplicador puede ser "Ã—" (UTF-8 corrupto de ×),
  // precio puede tener ":" como artefacto (ej: "1/u Ã— :36.990 V. Ahorro 0").
  const unitMatch = line.match(/1\/u\s+\S+\s+:?([\d.,]+)\s+V\.?\s*Ahorro\s+([\d.,]+)?/i);
  if (!unitMatch) return productName;

  const originalPricePerUnit = parseFloat(unitMatch[1].replace(/[.,]/g, ''));
  if (originalPricePerUnit <= 0) return productName;

  const savings = unitMatch[2] ? parseFloat(unitMatch[2].replace(/[.,]/g, '')) : 0;

  // Estándar colombiano ISO 4217: punto = miles, coma = decimales
  const fmt = (n: number) =>
    n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

  const base = `${productName} — 1 un @ $${fmt(finalPrice)}`;
  const withDiscount =
    savings > 0 && originalPricePerUnit > finalPrice
      ? `${base} (antes $${fmt(originalPricePerUnit)}, -${Math.round((savings / originalPricePerUnit) * 100)}%)`
      : base;

  return formatSimpleProduct(withDiscount, receiptType);
}

/**
 * Enriquece la descripción con contexto de la línea anterior (KGM o 1/u).
 * Jerarquía: peso (KGM) → unidad (1/u) → formato simple [Tienda].
 */
function enrichDescription(
  prevLine: string,
  description: string,
  price: number,
  receiptType: ReceiptType
): string {
  const withWeight = processWeightAndSavings(prevLine, description, receiptType);
  if (withWeight !== description) return withWeight;

  const withUnit = processUnitAndPrice(prevLine, description, price, receiptType);
  if (withUnit !== description) return withUnit;

  return formatSimpleProduct(description, receiptType);
}

// ===== DETECCIÓN DE FORMATO =====

function isExitoFormat(joined: string): boolean {
  return (
    (joined.includes('PLU\tDETALLE\tPRECIO') || joined.includes('PLU DETALLE PRECIO')) &&
    (joined.includes('V. Ahorro') || joined.includes('V . Ahorro')) &&
    !joined.match(/PLU\s+DETALLE\s*$/m) &&
    !isCarullaCase5(joined) &&
    !isCarullaCase6(joined)
  );
}

function isCarullaCase6(joined: string): boolean {
  const hasPLUHeader =
    joined.includes('PLU\tDETALLE\tPRECIO') || joined.includes('PLU DETALLE PRECIO');
  const hasKGMPattern = joined.match(/[\d.\s]+\/KGM/gm) !== null;
  return hasPLUHeader && hasKGMPattern;
}

function isCarullaCase5(joined: string): boolean {
  return (
    (joined.includes('PLU DETALLE') || joined.includes('PLU\tDETALLE\n')) &&
    !joined.includes('PLU\tDETALLE\tPRECIO') &&
    !joined.includes('PLU DETALLE PRECIO') &&
    (joined.includes('Total Item :') || joined.includes('Total Item'))
  );
}

function isAltCarulla(joined: string): boolean {
  return (
    joined.includes('DETALLE PRECIO') &&
    joined.indexOf('DETALLE') < joined.indexOf('PLU') &&
    joined.includes('Total Item :')
  );
}

// ===== PARSER PRINCIPAL =====

/**
 * Parser para recibos de Carulla y Éxito (misma franquicia, formatos similares).
 *
 * @param lines               - Líneas del recibo OCR (tabs ya reemplazados por espacios)
 * @param joined              - Texto completo del recibo (para detección de formato)
 * @param existingCanonicals  - Nombres canónicos ya presentes en BD para deduplicación
 * @param storeHint           - Fuerza el tipo de tienda cuando el OCR es ambiguo
 */
export function parseCarulla(
  lines: string[],
  joined: string,
  existingCanonicals: string[] = [],
  storeHint?: 'Carulla' | 'Exito'
): Product[] {
  // storeHint tiene precedencia sobre la detección automática cuando el formato
  // es ambiguo (Carulla y Éxito son la misma franquicia con estructura de ticket idéntica)
  const receiptType: ReceiptType = storeHint ?? (isExitoFormat(joined) ? 'Exito' : 'Carulla');

  let products: Product[];

  if (isAltCarulla(joined)) {
    console.log('📄 Procesando como Carulla alternativo (DETALLE antes que PLU)');
    products = processAltCarulla(lines, receiptType);
  } else if (isExitoFormat(joined)) {
    console.log('🛒 Procesando como Éxito (PLU DETALLE PRECIO sin KGM)');
    products = processExitoFormat(lines, receiptType);
  } else if (isCarullaCase5(joined)) {
    console.log('🛠️ Procesando como Carulla case5 (PLU DETALLE sin PRECIO en header)');
    products = processCarullaCase5(lines, joined, receiptType);
  } else if (isCarullaCase6(joined)) {
    console.log('🛠️ Procesando como Carulla case6 (PLU DETALLE PRECIO con KGM)');
    products = processCarullaCase6(lines, joined, receiptType);
  } else {
    console.log('🔍 Aplicando heurísticas generales (fallback)');
    products = fallbackProcessing(lines, joined, receiptType);
  }

  return applyCanonicalNames(products, existingCanonicals);
}

// ===== CANONICALIZACIÓN =====

/**
 * Aplica nombres canónicos al final del pipeline — una sola vez, en un solo lugar.
 * Los procesadores internos NO canonicalizan para facilitar su testing independiente.
 */
function applyCanonicalNames(products: Product[], existingCanonicals: string[]): Product[] {
  const seen = [...existingCanonicals];
  return products.map((product) => {
    const canonical = canonicalize(product.description, seen);
    if (!seen.includes(canonical)) seen.push(canonical);
    return { ...product, description: canonical };
  });
}

// ===== PROCESADORES POR FORMATO =====

function processExitoFormat(lines: string[], receiptType: ReceiptType): Product[] {
  const products: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const unitLine = i > 0 ? lines[i - 1] : null;

    // Formato Éxito tab-separado: "PLU  Descripción  precio[A]"
    const exitoMatch = line.match(EXITO_PRODUCT_PATTERN);
    if (exitoMatch) {
      const price = normalizePrice(exitoMatch[3]);
      const description = buildDescription(exitoMatch[2], unitLine, price, receiptType);
      if (price > 0) products.push({ description, price });
      continue;
    }

    // Formato Éxito sin tabs — todo en una línea: "N 1/u x P V.Ahorro A PLU DESC precioA"
    const genericMatch = line.match(PRODUCT_PATTERN);
    if (genericMatch) {
      const price = genericMatch[2]
        ? cleanPrice(genericMatch[2].replace(/\s/g, '').replace(/[A-Za-z]$/i, ''))
        : 0;
      const description = buildDescription(genericMatch[1].trim(), unitLine, price, receiptType);
      if (price > 0) products.push({ description, price });
    }
  }

  return products;
}

function processCarullaCase6(lines: string[], joined: string, receiptType: ReceiptType): Product[] {
  const products: Product[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    const next = lines[i + 1]?.trim();

    // P0: KGM sin número de ítem (OCR de baja calidad)
    // Ejemplo: "0. 870/KGM × 20.900 V. Ahorro 3.637"
    // Casos especiales que maneja:
    //  - Ruido al inicio de next: "36\t18617 Pechusa..." → busca PLU con search, no match
    //  - Precio en i+2: "20.475/KGM..." + "1201 Pepino Calabacin" + "1.902"
    const p0 = line.match(KGM_NO_ITEM);
    if (p0 && next) {
      // search (no match) para tolerar ruido al inicio: "36 18617 Desc 14,546"
      const productMatch = next.match(/(\d{4,})\s+(.+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Za-z]?$/);
      if (productMatch) {
        const price = normalizePrice(productMatch[3]);
        const description = processWeightAndSavings(
          line,
          formatDescription(productMatch[2].trim()),
          receiptType
        );
        products.push({ description, price });
        i += 2;
        continue;
      }
      // Subcase: precio en i+2 (next solo tiene PLU+desc, precio en línea siguiente)
      const noPrice = next.match(PRODUCT_NO_PRICE);
      const next2 = lines[i + 2]?.trim();
      const priceOnly = next2?.match(/^(\d{1,3}[.,]\s?\d{3})[A-Za-z]?$/);
      if (noPrice && priceOnly) {
        const price = normalizePrice(priceOnly[1]);
        const description = processWeightAndSavings(
          line,
          formatDescription(noPrice[2].trim()),
          receiptType
        );
        products.push({ description, price });
        i += 3;
        continue;
      }
    }

    // P1: KGM con ahorro separado por espacio → precio en línea del PLU+producto
    // Espacio (no tab) en "Ahorro[ ]+" distingue ahorro de precio tab-separado.
    // Ejemplo: "1 0.305/KGM x 9.340 V. Ahorro 854"
    const p1 = line.match(KGM_SAVINGS_SPACE);
    if (p1 && next) {
      const productMatch = next.match(PRODUCT_WITH_PRICE);
      if (productMatch) {
        const price = normalizePrice(productMatch[3]);
        const description = processWeightAndSavings(
          line,
          formatDescription(productMatch[2].trim()),
          receiptType
        );
        products.push({ description, price });
        i += 2;
        continue;
      }
      // Subcase: producto sin precio en siguiente línea
      const noPriceMatch = next.match(PRODUCT_NO_PRICE);
      if (noPriceMatch && !next.match(/\d{1,3}[.,]\d{3}/)) {
        const description = processWeightAndSavings(
          line,
          formatDescription(noPriceMatch[2].trim()),
          receiptType
        );
        products.push({ description, price: 0 });
        i += 2;
        continue;
      }
    }

    // P1B: KGM con PLU en misma línea → descripción+precio en línea siguiente sin PLU
    // Ejemplo: "1 0.680/KGM x 7.580 V. Ahorro 1.546  1137"
    //           siguiente: "HABICHUELA A GRA  3.608"
    const p1b = line.match(KGM_WITH_PLU);
    if (p1b && next) {
      const descMatch = next.match(DESC_WITH_PRICE);
      if (descMatch) {
        const price = normalizePrice(descMatch[2]);
        const description = processWeightAndSavings(
          line,
          formatDescription(descMatch[1].trim()),
          receiptType
        );
        products.push({ description, price });
        i += 2;
        continue;
      }
    }

    // P2: KGM con precio embebido al final de la línea de unidad
    // Ejemplo: "15 0.625/KGM x 4.180 V. Ahorro 0  2.613"
    //           siguiente: "1166  Cebolla Blanca S"  (sin precio)
    const p2 = line.match(KGM_PRICE_INLINE);
    if (p2 && next) {
      const productOnlyMatch = next.match(PRODUCT_NO_PRICE);
      if (productOnlyMatch && !next.match(/\d{1,3}[.,]\d{3}/)) {
        const price = normalizePrice(p2[3]);
        const description = processWeightAndSavings(
          line,
          formatDescription(productOnlyMatch[2].trim()),
          receiptType
        );
        products.push({ description, price });
        i += 2;
        continue;
      }
    }

    // P3: 1/u con precio embebido al final — producto en siguiente línea sin precio
    // Ejemplo: "7 1/u x 30.300 V. Ahorro 9,090  21.210A"
    //           siguiente: "3019241 Enjuague Bucal T"  (sin precio)
    const p3 = line.match(UNIT_PRICE_INLINE);
    if (p3 && next) {
      const productOnlyMatch = next.match(PRODUCT_NO_PRICE);
      // Guard: rechaza si la siguiente línea termina en número (precio ya está en la línea)
      if (productOnlyMatch && !next.match(/[\d.,]+[A-Za-z]?\s*$/)) {
        const price = normalizePrice(p3[2]);
        const description = buildDescription(productOnlyMatch[2].trim(), line, price, receiptType);
        products.push({ description, price });
        i += 2;
        continue;
      }
    }

    // P4: 1/u sin precio en línea de unidad → precio en línea PLU+producto
    // Tolerancias OCR: "Ã—" (UTF-8 corrupto de ×), ":" como prefijo de precio
    // Ejemplo: "2 1/u Ã— :36.990 V. Ahorro 0"
    //           siguiente: "3641985  Toalla Bato 70x1  36, 990A"
    const p4 = line.match(UNIT_NO_PRICE);
    if (p4 && next) {
      const productMatch = next.match(PRODUCT_WITH_PRICE);
      if (productMatch) {
        const price = normalizePrice(productMatch[3]);
        const description = buildDescription(productMatch[2].trim(), line, price, receiptType);
        products.push({ description, price });
        i += 2;
        continue;
      }
    }

    // Fallback dentro de case6: PLU + descripción + precio en la misma línea
    // Ejemplo: "942160 Panela 4 Und  5.652"
    const simpleMatch = line.match(PRODUCT_WITH_PRICE);
    if (simpleMatch) {
      const price = normalizePrice(simpleMatch[3]);
      const unitLine = i > 0 ? lines[i - 1] : null;
      const description = buildDescription(simpleMatch[2].trim(), unitLine, price, receiptType);
      if (price > 0) products.push({ description, price });
    }

    i++;
  }

  return limitProducts(products, joined);
}

function processCarullaCase5(lines: string[], joined: string, receiptType: ReceiptType): Product[] {
  const products: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const descMatch = line.match(PRODUCT_PATTERN);
    if (!descMatch) continue;

    const rawName = descMatch[1].trim();
    if (/^\d|V\. Ahorro|KGM\b/i.test(rawName)) continue;

    // Precio en la línea actual o en la siguiente
    let priceMatch = line.match(PRICE_PATTERN);
    let priceLine = i;
    if (!priceMatch && i < lines.length - 1) {
      priceMatch = lines[i + 1].match(PRICE_PATTERN);
      if (priceMatch) priceLine = i + 1;
    }

    if (priceMatch) {
      const price = cleanPrice(priceMatch[1]);
      const unitLine = i > 0 ? lines[i - 1] : null;
      const description = buildDescription(rawName, unitLine, price, receiptType);
      products.push({ description, price });
      i = priceLine;
    }
  }

  return limitProducts(products, joined);
}

function processAltCarulla(lines: string[], receiptType: ReceiptType): Product[] {
  const products: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1]?.trim();

    const unitLineMatch = current.match(
      /^(?:\d+\s+)?(?:1\/u|\d+\.\d+\/\w+).*?x.*?(?:\d+\.\d+\s+)*.*?(\d+\.\d{3})(?:[A-Za-z]*\s*)?$/i
    );
    const descLineMatch = next?.match(/^(\d{6,})\s+(.+)/);

    if (unitLineMatch && descLineMatch) {
      const price = cleanPrice(unitLineMatch[1]);
      const description = formatSimpleProduct(
        formatDescription(descLineMatch[2].trim()),
        receiptType
      );
      products.push({ description, price });
      i++;
    }
  }

  return products;
}

function fallbackProcessing(lines: string[], joined: string, receiptType: ReceiptType): Product[] {
  const products: Product[] = [];
  const weightPattern = /\d+\s+[\d.]+\/KGM.*?(\d{1,3}[.,]\d{3})/g;
  let match;

  while ((match = weightPattern.exec(joined)) !== null) {
    const price = cleanPrice(match[1]);

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].includes(match[0])) continue;

      const descLine = lines[i + 1] || lines[i - 1];
      if (descLine) {
        const descMatch = descLine.match(/[A-Z].+/);
        if (descMatch) {
          const description = formatSimpleProduct(formatDescription(descMatch[0]), receiptType);
          products.push({ description, price });
        }
      }
      break;
    }
  }

  return limitProducts(products, joined);
}
