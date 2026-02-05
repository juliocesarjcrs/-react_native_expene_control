import { Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';
import { formatSimpleProduct, processWeightAndSavings, cleanPrice, limitProducts } from './helpers';

const PRODUCT_PATTERN =
  /^\d+\s+([A-Za-zÀÁÉÍÓÚÜÑñáéíóúü#%().,\/&\s*\-]+?(?:\s*\/\s*[A-Za-zÀÁÉÍÓÚÜÑñáéíóúü#%().,\/&\s*\-]+?)*)(?:\s+(\d{1,3}(?:[.,]\s?\d{2,3})?)[A-Za-z]*)?$/i;
const PRICE_PATTERN = /(\d+[.,]?\d*[A-Za-z]?)\s*$/;
const EXITO_PRODUCT_PATTERN = /(\d{6,})\s+([A-Z].+?)\s+(\d{1,3}[.,]\d{3})[A-Z]?/;
const DESC_PATTERN = /^\d+\s+(\d{6,})\s+([A-Z].+)/;
const SIMPLE_PRICE_PATTERN = /^(\d{1,3}[.,]\d{3})[A-Z]?$/;
const KGM_PATTERN = /(\d+(?:\.\s?\d+)?)\/(KGM)\s+[x*]\s+([\d.,]+)\s+V\.\s+Ahorro\s+([\d.,]+)/i;

// Patrones adicionales para manejar OCR inconsistente
const CODE_PRODUCT_PRICE_PATTERN = /(\d{6,})\s+(.+?)\s+(\d{1,3}[.,]\d{3})/;
const WEIGHT_INFO_PATTERN =
  /^\d+\s+(\d+(?:\.\s?\d+)?)\/(KGM)\s+[x*]\s+([\d.,]+)\s+V\.\s+Ahorro\s+([\d.,]+)/i;
const PRICE_AT_START_PATTERN = /^(\d{1,3}[.,]\d{3})[A-Z]?\s*$/;

/**
 * Parser principal para recibos de Carulla y Éxito
 *
 * @param lines - Líneas del recibo OCR
 * @param joined - Texto completo del recibo
 * @returns Array de productos parseados
 */
export function parseCarulla(lines: string[], joined: string): Product[] {
  console.log('📄 Procesando como tipo Carulla...');

  // Determinar el tipo de recibo (Carulla o Éxito)
  const receiptType: ReceiptType = isExitoFormat(joined) ? 'Exito' : 'Carulla';

  // Determinar el tipo de formato y procesar
  if (isAltCarulla(joined)) {
    console.log('📄 Procesando como Carulla alternativo (caso 2)');
    return processAltCarulla(lines, receiptType);
  }

  if (isExitoFormat(joined)) {
    console.log('🛒 Procesando como tipo Éxito');
    return processExitoFormat(lines, receiptType);
  }

  if (isCarullaCase5(joined)) {
    console.log('🛠️ Procesando como caso especial Carulla 5');
    return processCarullaCase5(lines, joined, receiptType);
  }

  if (isCarullaCase6(joined)) {
    console.log('🛠️ Procesando como caso especial Carulla 6');
    return processCarullaCase6(lines, joined, receiptType);
  }

  console.log('🔍 Aplicando heurísticas generales');
  return fallbackProcessing(lines, joined, receiptType);
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
  const hasKGMPattern = joined.match(/\d+\s+[\d.]+\/KGM/gm) !== null;

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
          description = formatSimpleProduct(formatDescription(match[2]), receiptType);
          price = cleanPrice(match[3]);
        } else if (pattern === PRODUCT_PATTERN) {
          description = formatSimpleProduct(formatDescription(match[1].trim()), receiptType);
          price = match[2] ? cleanPrice(match[2].replace(/\s/g, '').replace(/[A-Za-z]$/i, '')) : 0;
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

function processExitoFormat(lines: string[], receiptType: ReceiptType): Product[] {
  return processProductsWithPatterns(lines, [PRODUCT_PATTERN, EXITO_PRODUCT_PATTERN], receiptType);
}

function processCarullaCase6(lines: string[], joined: string, receiptType: ReceiptType): Product[] {
  console.log('🛠️ Procesando como caso 6 Carulla con precios en línea');
  const products: Product[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // PRIORIDAD 1: Línea de peso/KGM sin precio al final, seguida de código+producto+precio
    const weightInfoNoPrice = line.match(
      /^\d+\s+([\d.]+\/KGM)\s+[x*]\s+([\d.,]+)\s+V\.\s*Ahorro\s+([\d.,]+)$/i
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

    // PRIORIDAD 2: Línea de peso CON precio al final, producto en siguiente línea
    const weightWithPriceMatch = line.match(
      /^\d+\s+([\d.]+\/KGM)\s+[x*]\s+([\d.,]+)\s+V\.\s*Ahorro\s+\d+\s+(\d{1,3}[.,]\d{3})/i
    );
    if (weightWithPriceMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const productOnlyMatch = nextLine.match(/^(\d{4,})\s+(.+?)$/);

      if (productOnlyMatch && !nextLine.match(/\d{1,3}[.,]\d{3}/)) {
        const description = formatDescription(productOnlyMatch[2].trim());
        const price = cleanPrice(weightWithPriceMatch[3]);
        const descWithWeight = processWeightAndSavings(line, description, receiptType);

        products.push({ description: descWithWeight, price });
        i += 2;
        continue;
      }
    }

    // PRIORIDAD 3: Info unidad CON precio, producto en siguiente línea
    const unitWithPriceMatch = line.match(
      /^\d+\s+(?:1\/u|\d+\.?\d*\/\w+)\s+[x*]\s+([\d.,]+)\s+V\.?\s*Ahorro\s+\d+\s+(\d{1,3}[.,]\d{3})/i
    );
    if (unitWithPriceMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const productOnlyMatch = nextLine.match(/^(\d{4,})\s+(.+?)$/);

      if (productOnlyMatch && !nextLine.match(/\d{1,3}[.,]\d{3}/)) {
        const description = formatSimpleProduct(
          formatDescription(productOnlyMatch[2].trim()),
          receiptType
        );
        const price = cleanPrice(unitWithPriceMatch[2]);

        products.push({ description, price });
        i += 2;
        continue;
      }
    }

    // PRIORIDAD 4: Info unidad SIN precio, seguida de código+producto+precio
    const unitInfoMatch = line.match(
      /^\d+\s+(?:1\/u|\d+\.?\d*\/\w+)\s+[x*]\s+([\d.,]+)\s+V\.\s*Ahorro\s+\d+$/i
    );
    if (unitInfoMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const productMatch = nextLine.match(/^(\d{4,})\s+(.+?)\s+(\d{1,3}[.,]\s?\d{3})[A-Za-z]?$/);

      if (productMatch) {
        const description = formatSimpleProduct(
          formatDescription(productMatch[2].trim()),
          receiptType
        );
        const price = cleanPrice(productMatch[3].replace(/\s/g, ''));

        products.push({ description, price });
        i += 2;
        continue;
      }
    }

    // Patrón principal (PLU + Descripción + Precio)
    const match = line.match(PRODUCT_PATTERN);
    if (match) {
      let description = formatDescription(match[1].replace(/\.$/, ''));
      let price = match[2] ? cleanPrice(match[2].replace(/\s/g, '')) : 0;

      // Buscar información de peso en líneas anteriores
      if (i > 0) {
        const prevLine = lines[i - 1];
        const weightDesc = processWeightAndSavings(prevLine, description, receiptType);
        if (weightDesc !== description) {
          description = weightDesc;
        } else {
          description = formatSimpleProduct(description, receiptType);
        }
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

        // Buscar información de peso en líneas anteriores
        if (i > 0) {
          const prevLine = lines[i - 1];
          const weightDesc = processWeightAndSavings(prevLine, description, receiptType);
          if (weightDesc !== description) {
            description = weightDesc;
          } else {
            description = formatSimpleProduct(description, receiptType);
          }
        } else {
          description = formatSimpleProduct(description, receiptType);
        }

        products.push({
          description,
          price: cleanPrice(priceMatch[1])
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

        // Buscar información de peso en líneas anteriores
        if (i > 0) {
          const prevLine = lines[i - 1];
          const weightDesc = processWeightAndSavings(prevLine, description, receiptType);
          if (weightDesc !== description) {
            description = weightDesc;
          } else {
            description = formatSimpleProduct(description, receiptType);
          }
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
