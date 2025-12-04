/* eslint-disable no-useless-escape */
import { Product } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';

const PRODUCT_PATTERN =
  /^\d+\s+([A-Za-zÃÃ‰ÃÃ"ÃšÃœÃ'Ã±Ã¡Ã©Ã­Ã³ÃºÃ¼#%().,\/&\s*\-]+?(?:\s*\/\s*[A-Za-zÃÃ‰ÃÃ"ÃšÃœÃ'Ã±Ã¡Ã©Ã­Ã³ÃºÃ¼#%().,\/&\s*\-]+?)*)(?:\s+(\d{1,3}(?:[.,]\s?\d{2,3})?)[A-Za-z]*)?$/i;
const PRICE_PATTERN = /(\d+[.,]?\d*[A-Za-z]?)\s*$/;
const EXITO_PRODUCT_PATTERN = /(\d{6,})\s+([A-Z].+?)\s+(\d{1,3}[.,]\d{3})[A-Z]?/;
const DESC_PATTERN = /^\d+\s+(\d{6,})\s+([A-Z].+)/;
const SIMPLE_PRICE_PATTERN = /^(\d{1,3}[.,]\d{3})[A-Z]?$/;
const KGM_PATTERN = /(\d+(?:\.\s?\d+)?)\/(KGM)\s+[x*]\s+([\d.,]+)\s+V\.\s+Ahorro\s+([\d.,]+)/i;

export function parseCarulla(lines: string[], joined: string): Product[] {
  console.log('📄 Procesando como tipo Carulla...');

  // Determinar el tipo de formato y procesar
  if (isAltCarulla(joined)) {
    console.log('📄 Procesando como Carulla alternativo (caso 2)');
    return processAltCarulla(lines);
  }

  if (isExitoFormat(joined)) {
    console.log('🛒 Procesando como tipo Éxito');
    return processExitoFormat(lines);
  }

  if (isCarullaCase5(joined)) {
    console.log('🛠️ Procesando como caso especial Carulla 5');
    return processCarullaCase5(lines, joined);
  }

  if (isCarullaCase6(joined)) {
    // caso(16)
    console.log('🛠️ Procesando como caso especial Carulla 6');
    return processCarullaCase6(lines, joined);
  }

  console.log('🔍 Aplicando heurísticas generales');
  return fallbackProcessing(lines, joined);
}

// Función para procesar descripciones con información de peso y ahorro
function processWeightAndSavings(line: string, description: string): string {
  const kgmMatch = line.match(KGM_PATTERN);
  if (kgmMatch) {
    const weight = kgmMatch[1].replace(/\s+/g, '');
    const originalPrice = parseFloat(kgmMatch[3].replace(/[.,]/g, ''));
    const savings = parseFloat(kgmMatch[4].replace(/[.,]/g, ''));

    const totalOriginal = originalPrice * parseFloat(weight);
    const totalPid = totalOriginal - savings;
    const newPricePerkg = totalPid / parseFloat(weight);

    if (totalOriginal > 0) {
      const savingsPercentage = (savings / totalOriginal) * 100;
      const formattedNewPrice = Math.round(newPricePerkg).toLocaleString('es-CO');
      const formattedOriginalPrice = Math.round(originalPrice).toLocaleString('es-CO');
      if (savingsPercentage > 0) {
        return `${description} — ${weight} kg (Precio original: $${formattedOriginalPrice}/kg) con ${Math.round(savingsPercentage)}% de descuento Precio final: $${formattedNewPrice}/kg`;
      }
      return `${description} — ${weight} kg (Precio original: $${formattedOriginalPrice}/kg) con ${Math.round(savingsPercentage)}% de descuento.`;
    }
  }
  return description;
}

// Funciones de detección de formatos
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
  return (
    (joined.includes('PLU\tDETALLE\tPRECIO') || joined.includes('PLU DETALLE PRECIO')) &&
    joined.match(/\d+\s+[\d.]+\/KGM/gm) !== null &&
    joined.includes('Total Item :')
  );
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

// Función unificada para procesar productos con patrones comunes
function processProductsWithPatterns(
  lines: string[],
  patterns: RegExp[],
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
          description = formatDescription(match[2]);
          price = parseInt(match[3].replace(/[.,]/g, ''), 10);
        } else if (pattern === PRODUCT_PATTERN) {
          description = formatDescription(match[1].trim());
          price = match[2]
            ? parseInt(match[2].replace(/[.,\s]/g, '').replace(/[A-Za-z]$/i, ''), 10)
            : 0;
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

// Funciones de procesamiento específicas
function processExitoFormat(lines: string[]): Product[] {
  return processProductsWithPatterns(lines, [PRODUCT_PATTERN, EXITO_PRODUCT_PATTERN]);
}

function processCarullaCase6(lines: string[], joined: string): Product[] {
  console.log('🛠️ Procesando como caso 6 Carulla con precios en línea');
  const products: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Patrón principal (PLU + Descripción + Precio)
    const match = line.match(PRODUCT_PATTERN);
    if (match) {
      let description = formatDescription(match[1].replace(/\.$/, ''));
      let price = match[2] ? parseInt(match[2].replace(/[.,\s]/g, ''), 10) : 0;

      // Buscar información de peso en líneas anteriores
      if (i > 0) {
        const prevLine = lines[i - 1];
        description = processWeightAndSavings(prevLine, description);
      }

      // Si no hay precio en la línea actual, buscar en líneas siguientes
      if (price === 0) {
        for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
          const nextLine = lines[j].trim();
          const priceMatch = nextLine.match(/^(\d{1,3}[.,]?\d*)[A-Za-z]*\s*$/);
          if (priceMatch) {
            price = parseInt(priceMatch[1].replace(/[.,]/g, ''), 10);
            break;
          }
        }
      }

      products.push({ description, price });
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
          description = processWeightAndSavings(prevLine, description);
        }

        products.push({
          description,
          price: parseInt(priceMatch[1].replace(/[.,]/g, ''), 10)
        });
        i++; // Saltar la línea del precio
      }
    }
  }

  return limitProducts(products, joined);
}

function processCarullaCase5(lines: string[], joined: string): Product[] {
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
        const price = parseInt(priceMatch[1].replace(/[.,]/g, ''), 10);

        // Buscar información de peso en líneas anteriores
        if (i > 0) {
          const prevLine = lines[i - 1];
          description = processWeightAndSavings(prevLine, description);
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

function processAltCarulla(lines: string[]): Product[] {
  const products: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1]?.trim();

    const unitLineMatch = current.match(
      /^(?:\d+\s+)?(?:1\/u|\d+\.\d+\/\w+).*?x.*?(?:\d+\.\d+\s+)*.*?(\d+\.\d{3})(?:[A-Za-z]*\s*)?$/i
    );
    const descLineMatch = next?.match(/^(\d{6,})\s+(.+)/);

    if (unitLineMatch && descLineMatch) {
      const price = parseInt(unitLineMatch[1].replace(/[.,]/g, ''), 10);
      const description = descLineMatch[2].trim();
      products.push({ description: formatDescription(description), price });
      i++; // Saltar la línea procesada
    }
  }

  return products;
}

function fallbackProcessing(lines: string[], joined: string): Product[] {
  const products: Product[] = [];
  const weightPattern = /\d+\s+[\d.]+\/KGM.*?(\d{1,3}[.,]\d{3})/g;
  let match;

  while ((match = weightPattern.exec(joined)) !== null) {
    const price = parseInt(match[1].replace(/[.,]/g, ''), 10);

    // Buscar descripción en líneas cercanas
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match[0])) {
        const descLine = lines[i + 1] || lines[i - 1];
        if (descLine) {
          const descMatch = descLine.match(/[A-Z].+/);
          if (descMatch) {
            products.push({
              description: formatDescription(descMatch[0]),
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

// Función auxiliar para limitar productos según Total Item
function limitProducts(products: Product[], joined: string): Product[] {
  const totalMatch = joined.match(/Total Item\s*:\s*(\d+)/);
  if (totalMatch && products.length > parseInt(totalMatch[1], 10)) {
    return products.slice(0, parseInt(totalMatch[1], 10));
  }
  return products;
}
