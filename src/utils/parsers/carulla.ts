import { Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';
import { formatSimpleProduct, processWeightAndSavings, cleanPrice, limitProducts } from './helpers';
import { canonicalize } from '../canonicalizer';

const PRODUCT_PATTERN =
  /^\d+\s+([A-Za-zÀÁÉÍÓÚÜÑñáéíóúü#%().,\/&\s*\-]+?(?:\s*\/\s*[A-Za-zÀÁÉÍÓÚÜÑñáéíóúü#%().,\/&\s*\-]+?)*)(?:\s+(\d{1,3}(?:[.,]\s?\d{2,3})?)[A-Za-z]*)?$/i;
const PRICE_PATTERN = /(\d+[.,]?\d*[A-Za-z]?)\s*$/;
// Tolerates spaces within price separators (OCR artifact: "36, 990A" → 36990)
const EXITO_PRODUCT_PATTERN = /(\d{6,})\s+([A-Z].+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Z]?/;
const DESC_PATTERN = /^\d+\s+(\d{6,})\s+([A-Z].+)/;
const SIMPLE_PRICE_PATTERN = /^(\d{1,3}[.,]\d{3})[A-Z]?$/;

/**
 * Procesa líneas con información de unidad y precio (patrón 1/u).
 * Similar a processWeightAndSavings pero para ítems por unidad.
 *
 * @param line - Línea con información de unidad (ej: "5 1/u x 4.100 V. Ahorro 1.230")
 * @param productName - Nombre del producto
 * @param finalPrice - Precio final del producto (para calcular descuento)
 * @param receiptType - Tipo de recibo
 * @returns Descripción formateada con unidad, precio y descuento si aplica
 */
function processUnitAndPrice(
  line: string,
  productName: string,
  finalPrice: number,
  receiptType: ReceiptType
): string {
  // 🔒 Blindaje: solo procesar si realmente es 1/u
  if (!/1\/u/i.test(line)) {
    return productName;
  }

  // Patrón: "1/u x <precio_por_unidad> V. Ahorro <ahorro>"
  // Tolerancia OCR: el multiplicador puede ser "Ã—" (UTF-8 corrupto de ×),
  // y el precio puede tener ":" como artefacto (ej: "1/u Ã— :36.990 V. Ahorro 0").
  const unitMatch = line.match(/1\/u\s+\S+\s+:?([\d.,]+)\s+V\.?\s*Ahorro\s+([\d.,]+)?/i);

  if (unitMatch) {
    // Precio original por unidad
    const originalPricePerUnit = parseFloat(unitMatch[1].replace(/[.,]/g, ''));
    // Ahorro (puede no estar presente en algunas líneas)
    const savings = unitMatch[2] ? parseFloat(unitMatch[2].replace(/[.,]/g, '')) : 0;

    if (originalPricePerUnit > 0) {
      // Formatear precio final — estándar colombiano ISO 4217: punto = miles, coma = decimales
      // toLocaleString('es-CO') ya produce el formato correcto: 23.000, 4.100, etc.
      const formattedFinalPrice = finalPrice.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      });

      // Formatear precio original
      const formattedOriginalPrice = originalPricePerUnit.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      });

      // Calcular porcentaje de descuento
      let descWithUnit: string;

      if (savings > 0 && originalPricePerUnit > finalPrice) {
        const savingsPercentage = (savings / originalPricePerUnit) * 100;

        descWithUnit = `${productName} — 1 un @ $${formattedFinalPrice} (antes $${formattedOriginalPrice}, -${Math.round(savingsPercentage)}%)`;
      } else {
        // Sin descuento, solo mostrar precio
        descWithUnit = `${productName} — 1 un @ $${formattedFinalPrice}`;
      }

      // Agregar sufijo de tienda [Carulla] o [Exito]
      return formatSimpleProduct(descWithUnit, receiptType);
    }
  }

  // Si no hay información de unidad válida, retornar el nombre sin cambios
  return productName;
}

/**
 * Intenta agregar información contextual a la descripción del producto.
 * Primero intenta peso/descuento (KGM), luego info de unidad (1/u), finalmente formato simple.
 *
 * @param prevLine - Línea anterior que puede contener info de peso o unidad
 * @param description - Descripción base del producto
 * @param price - Precio final del producto (para calcular descuento en 1/u)
 * @param receiptType - Tipo de recibo
 * @returns Descripción enriquecida con info contextual
 */
function enrichDescription(
  prevLine: string,
  description: string,
  price: number,
  receiptType: ReceiptType
): string {
  // 1. Intentar agregar peso/descuento (KGM)
  const withWeight = processWeightAndSavings(prevLine, description, receiptType);
  if (withWeight !== description) {
    return withWeight;
  }

  // 2. Intentar agregar info de unidad (1/u) con descuento
  const withUnit = processUnitAndPrice(prevLine, description, price, receiptType);
  if (withUnit !== description) {
    return withUnit;
  }

  // 3. Si ninguno funcionó, retornar con formato simple
  return formatSimpleProduct(description, receiptType);
}

/**
 * Parser principal para recibos de Carulla y Éxito.
 *
 * @param lines               - Líneas del recibo OCR
 * @param joined              - Texto completo del recibo
 * @param existingCanonicals  - Nombres canónicos ya presentes en BD,
 *                              usados para resolver truncamientos OCR.
 *                              Pasar vacío [] si no se requiere deduplicación.
 * @returns Array de productos con description canonicalizada
 */
export function parseCarulla(
  lines: string[],
  joined: string,
  existingCanonicals: string[] = [],
  storeHint?: 'Carulla' | 'Exito'
): Product[] {
  console.log('📄 Procesando como tipo Carulla...');

  // storeHint tiene precedencia sobre la detección automática cuando el formato
  // es ambiguo entre Carulla y Éxito (misma franquicia, misma estructura de ticket)
  const receiptType: ReceiptType = storeHint ?? (isExitoFormat(joined) ? 'Exito' : 'Carulla');

  let products: Product[];

  if (isAltCarulla(joined)) {
    console.log('📄 Procesando como Carulla alternativo (caso 2)');
    products = processAltCarulla(lines, receiptType);
  } else if (isExitoFormat(joined)) {
    console.log('🛒 Procesando como tipo Éxito');
    products = processExitoFormat(lines, receiptType);
  } else if (isCarullaCase5(joined)) {
    console.log('🛠️ Procesando como caso especial Carulla 5');
    products = processCarullaCase5(lines, joined, receiptType);
  } else if (isCarullaCase6(joined)) {
    console.log('🛠️ Procesando como caso especial Carulla 6');
    products = processCarullaCase6(lines, joined, receiptType);
  } else {
    console.log('🔍 Aplicando heurísticas generales');
    products = fallbackProcessing(lines, joined, receiptType);
  }

  return applyCanonicalNames(products, existingCanonicals);
}

// ===== CANONICALIZACIÓN =====

/**
 * Aplica nombres canónicos a todos los productos al final del pipeline.
 * Se hace aquí y no dentro de cada función de procesamiento para:
 *   1. Mantener la lógica de canonicalización en un único lugar.
 *   2. Facilitar testing de cada procesador de forma independiente.
 *   3. Permitir que existingCanonicals crezca con los productos ya
 *      canonicalizados en esta misma pasada (útil cuando el ticket
 *      repite el mismo producto con truncamiento distinto).
 */
function applyCanonicalNames(products: Product[], existingCanonicals: string[]): Product[] {
  // Copia local para no mutar el arreglo del llamador
  const seen = [...existingCanonicals];

  return products.map((product) => {
    const canonical = canonicalize(product.description, seen);

    // Acumular para que productos posteriores del mismo ticket
    // puedan resolver contra canónicos ya resueltos en esta pasada
    if (!seen.includes(canonical)) {
      seen.push(canonical);
    }

    return { ...product, description: canonical };
  });
}

// ===== FUNCIONES DE DETECCIÓN DE FORMATOS =====

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
  // Hacer regex más flexible: aceptar espacios dentro del número (ej: "0. 870/KGM")
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

// ===== FUNCIÓN UNIFICADA PARA PROCESAR PRODUCTOS CON PATRONES =====

function processProductsWithPatterns(
  lines: string[],
  patterns: RegExp[],
  receiptType: ReceiptType,
  joined?: string
): Product[] {
  const products: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        let description = '';
        let price = 0;

        if (pattern === EXITO_PRODUCT_PATTERN) {
          const baseName = formatDescription(match[2]);
          // Normalizar "36, 990" → "36990": quitar espacios y coma de miles antes de cleanPrice
          price = cleanPrice(match[3].replace(/[\s,]/g, ''));
          // Enriquecer con info de unidad/descuento de la línea anterior si existe
          description =
            i > 0
              ? enrichDescription(lines[i - 1], baseName, price, receiptType)
              : formatSimpleProduct(baseName, receiptType);
        } else if (pattern === PRODUCT_PATTERN) {
          const baseName = formatDescription(match[1].trim());
          price = match[2] ? cleanPrice(match[2].replace(/\s/g, '').replace(/[A-Za-z]$/i, '')) : 0;
          description =
            i > 0
              ? enrichDescription(lines[i - 1], baseName, price, receiptType)
              : formatSimpleProduct(baseName, receiptType);
        }

        if (description && price > 0) {
          products.push({ description, price });
          break;
        }
      }
    }
  }

  return joined ? limitProducts(products, joined) : products;
}

// ===== FUNCIONES DE PROCESAMIENTO ESPECÍFICAS =====
// Nota: estas funciones devuelven descriptions sin canonicalizar.
// La canonicalización se aplica una sola vez en applyCanonicalNames(),
// llamada desde parseCarulla() al final del pipeline.

function processExitoFormat(lines: string[], receiptType: ReceiptType): Product[] {
  return processProductsWithPatterns(lines, [PRODUCT_PATTERN, EXITO_PRODUCT_PATTERN], receiptType);
}

function processCarullaCase6(lines: string[], joined: string, receiptType: ReceiptType): Product[] {
  console.log('🛠️ Procesando como caso 6 Carulla con precios en línea');
  const products: Product[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // PRIORIDAD 0: Línea KGM SIN número de ítem al inicio, seguida de código+producto+precio.
    // Maneja OCR corrupto: "0. 870/KGM × 20.900 V. Ahorro 3.637"
    // Acepta: espacios internos en el peso, cualquier símbolo de multiplicación (×, x, *, Ã—, etc.)
    const weightNoItem = line.match(
      /^([\d.\s]+\/KGM)\s+\S+\s+([\d.,]+)\s+V\.\s*Ahorro\s+([\d.,]+)\s*$/i
    );
    if (weightNoItem && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      // Puede tener ruido al inicio: "36	18617 Pechusa..."
      // Buscar código PLU de 4+ dígitos en cualquier posición
      const productMatch = nextLine.match(/(\d{4,})\s+(.+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Za-z]?$/);

      if (productMatch) {
        const description = formatDescription(productMatch[2].trim());
        const price = cleanPrice(productMatch[3].replace(/\s/g, ''));
        const descWithWeight = processWeightAndSavings(line, description, receiptType);

        products.push({ description: descWithWeight, price });
        i += 2;
        continue;
      }
    }

    // PRIORIDAD 1: Línea de peso/KGM sin precio al final, seguida de código+producto+precio.
    // IMPORTANTE: usa [ ]+ (espacio, no tab) después de "Ahorro" para no confundir
    // el precio separado por tab (columna OCR) con el valor de ahorro.
    // Ej correcto:  "V. Ahorro 854"     → 854 es ahorro (PRIORIDAD 1 matchea)
    // Ej incorrecto: "V. Ahorro\t31.027" → 31.027 es precio (debe ir a PRIORIDAD 2, no aquí)
    const weightInfoNoPrice = line.match(
      /^\d+\s+([\d.]+\/KGM)\s+\S+\s+([\d.,]+)\s+V\.\s*Ahorro[ ]+([\d.,]+)\s*$/i
    );
    if (weightInfoNoPrice && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const productMatch = nextLine.match(/^(\d{4,})\s+(.+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Za-z]?$/);

      if (productMatch) {
        const description = formatDescription(productMatch[2].trim());
        const price = cleanPrice(productMatch[3].replace(/\s/g, ''));
        const descWithWeight = processWeightAndSavings(line, description, receiptType);

        products.push({ description: descWithWeight, price });
        i += 2;
        continue;
      }

      // Caso especial: producto sin precio en siguiente línea
      const productNoPriceMatch = nextLine.match(/^(\d{4,})\s+(.+?)$/);
      if (productNoPriceMatch && !nextLine.match(/\d{1,3}[.,]\d{3}/)) {
        const description = formatDescription(productNoPriceMatch[2].trim());
        const descWithWeight = processWeightAndSavings(line, description, receiptType);

        products.push({ description: descWithWeight, price: 0 });
        i += 2;
        continue;
      }
    }

    // PRIORIDAD 1B: KGM con ahorro + código PLU en la misma línea,
    // seguido de descripción + precio en línea siguiente.
    // Formato: "1 0.680/KGM x 7.580 V. Ahorro 1.546 1137"
    //           "HABICHUELA A GRA    3.608"
    const weightWithPLU = line.match(
      /^\d+\s+([\d.]+\/KGM)\s+\S+\s+([\d.,]+)\s+V\.\s*Ahorro\s+([\d.,]+)\s+(\d{4,})\s*$/i
    );
    if (weightWithPLU && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      // nextLine: descripción + precio (sin código PLU al inicio)
      const descMatch = nextLine.match(
        /^([A-Za-z][A-Za-z\s.#%&\/\-]+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Za-z]?$/i
      );

      if (descMatch) {
        const description = formatDescription(descMatch[1].trim());
        const price = cleanPrice(descMatch[2].replace(/\s/g, ''));
        const descWithWeight = processWeightAndSavings(line, description, receiptType);

        products.push({ description: descWithWeight, price });
        i += 2;
        continue;
      }
    }

    // PRIORIDAD 2: Línea de peso CON precio al final, producto en siguiente línea.
    // [\s\d.,]*? (lazy) consume flexiblemente el whitespace/valor de ahorro entre
    // "V. Ahorro" y el precio final (maneja tabs, comas en ahorro, o ahorro ausente).
    const weightWithPriceMatch = line.match(
      /^\d+\s+([\d.]+\/KGM)\s+\S+\s+([\d.,]+)\s+V\.\s*Ahorro[\s\d.,]*?(\d{1,3}[.,]\s?\d{3})\s*[A-Za-z]?\s*$/i
    );
    if (weightWithPriceMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const productOnlyMatch = nextLine.match(/^(\d{4,})\s+(.+?)$/);

      if (productOnlyMatch && !nextLine.match(/\d{1,3}[.,]\d{3}/)) {
        const description = formatDescription(productOnlyMatch[2].trim());
        const price = cleanPrice(weightWithPriceMatch[3].replace(/\s/g, ''));
        const descWithWeight = processWeightAndSavings(line, description, receiptType);

        products.push({ description: descWithWeight, price });
        i += 2;
        continue;
      }
    }

    // PRIORIDAD 3: Info unidad CON precio embebido, producto en siguiente línea sin precio.
    // [\s\d.,]*? (lazy) maneja: coma en ahorro (9,090), tab entre ahorro y precio, o variantes.
    const unitWithPriceMatch = line.match(
      /^\d+\s+(?:1\/u|\d+\.?\d*\/\w+)\s+\S+\s+([\d.,]+)\s+V\.?\s*Ahorro[\s\d.,]*?(\d{1,3}[.,]\s?\d{3})\s*[A-Za-z]?\s*$/i
    );
    if (unitWithPriceMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const productOnlyMatch = nextLine.match(/^(\d{4,})\s+(.+?)$/);

      // Guard más estricto: rechaza si la línea termina en CUALQUIER número (incl. "0" suelto)
      // para evitar capturar líneas como "3019241 Enjuague Bucal T   0"
      if (productOnlyMatch && !nextLine.match(/[\d.,]+[A-Za-z]?\s*$/)) {
        const baseDescription = formatDescription(productOnlyMatch[2].trim());
        const price = cleanPrice(unitWithPriceMatch[2].replace(/\s/g, ''));
        // Enriquecer con info de unidad/descuento de la línea actual (ej: "— 1 un @ $X (antes $Y, -Z%)")
        const description = enrichDescription(line, baseDescription, price, receiptType);

        products.push({ description, price });
        i += 2;
        continue;
      }
    }

    // PRIORIDAD 4: Info unidad SIN precio, seguida de código+producto+precio.
    // Tolerancia OCR: el símbolo de multiplicación puede aparecer como "Ã—" (UTF-8 corrupto de ×),
    // y el precio puede llevar ":" como prefijo artefacto (ej: ":36.990" → "36.990").
    // Se usa \s*$ para tolerar trailing whitespace sin capturar líneas con precio tab-separado
    // (ej: "V. Ahorro 3.125\t9.375" debe ir a PRIORIDAD 3, no aquí).
    const unitInfoMatch = line.match(
      /^\d+\s+(?:1\/u|\d+\.?\d*\/\w+)\s+\S+\s+:?([\d.,]+)\s+V\.?\s*Ahorro\s+[\d.,]+\s*$/i
    );
    if (unitInfoMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const productMatch = nextLine.match(/^(\d{4,})\s+(.+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Za-z]?$/);

      if (productMatch) {
        const baseDescription = formatDescription(productMatch[2].trim());
        // Normalizar "36, 990" → "36990" antes de cleanPrice (artefacto OCR: espacio/coma dentro del precio)
        const price = cleanPrice(productMatch[3].replace(/[\s,]/g, ''));
        // Enriquecer con info de unidad/descuento de la línea actual (ej: "— 1 un @ $X (antes $Y, -Z%)")
        const description = enrichDescription(line, baseDescription, price, receiptType);

        products.push({ description, price });
        i += 2;
        continue;
      }
    }

    // Patrón alternativo: código PLU + descripción (incluyendo dígitos) + precio
    // Ejemplo: "942160 Panela 4 Und\t5.652"
    // Este patrón acepta dígitos en la descripción (ej: "Panela 4 Und")
    const simpleProductMatch = line.match(/^(\d{4,})\s+(.+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Za-z]*$/);
    if (simpleProductMatch) {
      let description = formatDescription(simpleProductMatch[2].trim());
      const price = cleanPrice(simpleProductMatch[3].replace(/\s/g, ''));

      // Buscar información de peso/unidad en líneas anteriores
      if (i > 0) {
        const prevLine = lines[i - 1];
        description = enrichDescription(prevLine, description, price, receiptType);
      } else {
        description = formatSimpleProduct(description, receiptType);
      }

      if (price > 0) {
        products.push({ description, price });
        i++;
        continue;
      }
    }

    // Patrón principal (PLU + Descripción + Precio)
    const match = line.match(PRODUCT_PATTERN);
    if (match) {
      let description = formatDescription(match[1].replace(/\.$/, ''));
      let price = match[2] ? cleanPrice(match[2].replace(/\s/g, '')) : 0;

      // Buscar información de peso/unidad en líneas anteriores
      if (i > 0) {
        const prevLine = lines[i - 1];
        description = enrichDescription(prevLine, description, price, receiptType);
      } else {
        description = formatSimpleProduct(description, receiptType);
      }

      // Si no hay precio en la línea actual, buscar en líneas siguientes
      if (price === 0) {
        for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
          const nextLine = lines[j].trim();
          const priceMatch = nextLine.match(/^(\d{1,3}[.,]?\d*)[A-Za-z]*\s*$/);
          if (priceMatch) {
            price = cleanPrice(priceMatch[1]);
            break;
          }
        }
      }

      if (price > 0) {
        products.push({ description, price });
      }
      i++;
      continue;
    }

    // Descripción seguida de precio en línea siguiente
    const descMatch = line.match(DESC_PATTERN);
    if (descMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const priceMatch = nextLine.match(SIMPLE_PRICE_PATTERN);

      if (priceMatch) {
        let description = formatDescription(descMatch[2].trim());
        const price = cleanPrice(priceMatch[1]);

        // Buscar información de peso/unidad en líneas anteriores
        if (i > 0) {
          const prevLine = lines[i - 1];
          description = enrichDescription(prevLine, description, price, receiptType);
        } else {
          description = formatSimpleProduct(description, receiptType);
        }

        products.push({
          description,
          price
        });
        i += 2;
        continue;
      }
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

    if (descMatch) {
      let description = formatDescription(descMatch[1].trim());

      // Buscar precio en la línea actual o siguiente
      let priceMatch = line.match(PRICE_PATTERN);
      let priceLine = i;

      if (!priceMatch && i < lines.length - 1) {
        priceMatch = lines[i + 1].match(PRICE_PATTERN);
        if (priceMatch) priceLine = i + 1;
      }

      if (priceMatch && !/^\d|V\. Ahorro|KGM\b/i.test(description)) {
        const price = cleanPrice(priceMatch[1]);

        // Buscar información de peso/unidad en líneas anteriores
        if (i > 0) {
          const prevLine = lines[i - 1];
          description = enrichDescription(prevLine, description, price, receiptType);
        } else {
          description = formatSimpleProduct(description, receiptType);
        }

        products.push({
          description,
          price
        });
        i = priceLine;
      }
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
      i++; // Saltar la línea procesada
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

    // Buscar descripción en líneas cercanas
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match[0])) {
        const descLine = lines[i + 1] || lines[i - 1];
        if (descLine) {
          const descMatch = descLine.match(/[A-Z].+/);
          if (descMatch) {
            const description = formatSimpleProduct(formatDescription(descMatch[0]), receiptType);
            products.push({
              description,
              price
            });
          }
        }
        break;
      }
    }
  }

  return limitProducts(products, joined);
}
