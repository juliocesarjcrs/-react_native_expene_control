/* eslint-disable no-useless-escape */
import { Product } from "~/shared/types/components/receipt-scanner.type";
import { formatDescription } from "./formatDescription";

const PRODUCT_PATTERN = /^\d+\s+([A-Za-zÁÉÍÓÚÜÑñáéíóúü#%().,\/&\s*\-]+?(?:\s*\/\s*[A-Za-zÁÉÍÓÚÜÑñáéíóúü#%().,\/&\s*\-]+?)*)(?:\s+(\d{1,3}(?:[.,]\s?\d{2,3})?)[A-Za-z]*)?$/i;

const PRICE_PATTERN = /(\d+[.,]?\d*[A-Za-z]?)\s*$/;

export function parseCarulla(lines: string[], joined: string): Product[] {
  console.log("📄 Procesando como tipo Carulla...");

  // 1. Verificar caso alternativo (caso 2) primero
  if (isAltCarulla(joined)) {
    console.log("🔄 Procesando como Carulla alternativo (caso 2)");
    return processAltCarulla(lines);
  }

  // 2. Verificar Éxito caso 1 entró
  if (isExitoFormat(joined)) {
    console.log("🛒 Procesando como tipo Éxito");
    return processExitoFormat(lines);
  }

  // 3. Caso Carulla con header roto (caso 3, 5, 8, 9, 10)
  if (isCarullaCase5(joined)) {
    console.log("🛠️ Procesando como caso especial Carulla 5");
    return processCarullaCase5(lines, joined);
  }

  // 5. Caso Carulla con precios en línea (caso 4, 6 y 7, 11 12)
  if (isCarullaCase6(joined)) {
    console.log("🛠️ Procesando como caso especial Carulla 6");
    return processCarullaCase6(lines, joined);
  }

  // Heurísticas generales como último recurso
  console.log("🔍 Aplicando heurísticas generales");
  return fallbackProcessing(lines, joined);
}

// Funciones de detección de formatos
function isExitoFormat(joined: string): boolean {
  return (joined.includes('PLU\tDETALLE\tPRECIO') ||
    joined.includes('PLU DETALLE PRECIO')) &&
    (joined.includes('V. Ahorro') || joined.includes('V . Ahorro')) &&
    !joined.match(/PLU\s+DETALLE\s*$/m) &&
    !isCarullaCase5(joined) &&  // Asegurarnos que no es caso 5
    !isCarullaCase6(joined)  // Asegurarnos que no es caso 6;
}

function isCarullaCase6(joined: string): boolean {
  return (joined.includes('PLU\tDETALLE\tPRECIO') ||
    joined.includes('PLU DETALLE PRECIO')) &&
    joined.match(/\d+\s+[\d.]+\/KGM/gm) !== null &&
    joined.includes('Total Item :');
}

function isCarullaCase5(joined: string): boolean {
  return (joined.includes('PLU DETALLE') ||
    joined.includes('PLU\tDETALLE\n')) &&
    !joined.includes('PLU\tDETALLE\tPRECIO') &&
    !joined.includes('PLU DETALLE PRECIO') && // Nueva condición
    (joined.includes('Total Item :') || joined.includes('Total Item'));
}


function isAltCarulla(joined: string): boolean {
  // Para el caso 2 que tiene DETALLE PRECIO primero
  return (
    joined.includes('DETALLE PRECIO') &&
    joined.indexOf('DETALLE') < joined.indexOf('PLU') &&  // DETALLE aparece antes que PLU
    joined.includes('Total Item :')
  );
}

// Funciones de procesamiento específicas
function processExitoFormat(lines: string[]): Product[] {
  const products: Product[] = [];
  const productPattern = /(\d{6,})\s+([A-Z].+?)\s+(\d{1,3}[.,]\d{3})[A-Z]?/;

  for (const line of lines) {
    const match = line.match(productPattern);
    if (match) {
      products.push({
        description: formatDescription(match[2]),
        price: parseInt(match[3].replace(/[.,]/g, ''), 10)
      });
    }
  }
  return products;
}

function processCarullaCase6(lines: string[], joined: string): Product[] {
  const products: Product[] = [];
  console.log("🛠️ Procesando como caso 6 Carulla con precios en línea");

  const totalItemMatch = joined.match(/Total Item\s*:\s*(\d+)/);
  const expectedItems = totalItemMatch ? parseInt(totalItemMatch[1], 10) : null;

  // Patrón mejorado que maneja:
  // 1. Líneas con código PLU seguido de descripción y precio
  // 2. Líneas con descripción y precio en líneas separadas
  const descPattern = /^\d+\s+(\d{6,})\s+([A-Z].+)/;
  const pricePattern = /^(\d{1,3}[.,]\d{3})[A-Z]?$/;

  // 3. Patrón para líneas con medidas (ej: 1/u x 7.830)
  // const measurePattern = /^\d+\s+[\d.,]+\/[KGMu].*[\d.,]+\s+V\.\s*Ahorro/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Intenta hacer match con el patrón principal (PLU + Descripción + Precio)
    const match = line.match(PRODUCT_PATTERN);
    if (match) {
      const description = formatDescription(match[1].replace(/\.$/, '')); // Elimina el punto final si existe
      let price = 0;
      if (match[2]) {
        price = parseInt(match[2].replace(/[.,\s]/g, ''), 10);
      }
      products.push({ description, price });
      continue;

    }

    // Intenta hacer match con descripción primero
    const descMatch = line.match(descPattern);
    if (descMatch) {
      const description = descMatch[2].trim();

      // Buscar precio en la siguiente línea
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const priceMatch = nextLine.match(pricePattern);

        if (priceMatch) {
          products.push({
            description: formatDescription(description),
            price: parseInt(priceMatch[1].replace(/[.,]/g, ''), 10)
          });
          i++; // Saltar la línea del precio
          continue;
        }
      }
    }

    // Si es una línea de medida, buscar descripción y precio en líneas siguientes
    // if (line.match(measurePattern)) {
    //   if (i + 2 < lines.length) {
    //     const descLine = lines[i + 1].trim();
    //     const priceLine = lines[i + 2].trim();

    //     const descMatch = descLine.match(/^(\d{6,})\s+([A-Z].+)/);
    //     const priceMatch = priceLine.match(pricePattern);

    //     if (descMatch && priceMatch) {
    //       products.push({
    //         description: formatDescription(descMatch[2]),
    //         price: parseInt(priceMatch[1].replace(/[.,]/g, ''), 10)
    //       });
    //       i += 2; // Saltar las líneas de descripción y precio
    //     }
    //   }
    // }
  }

  if (expectedItems && products.length >= expectedItems) {
    return products.slice(0, expectedItems);
  }

  return products;
}

function processCarullaCase5(lines: string[], joined: string): Product[] {
  const products: Product[] = [];

  const totalItemMatch = joined.match(/Total Item\s*:\s*(\d+)/);
  const expectedItems = totalItemMatch ? parseInt(totalItemMatch[1], 10) : null;

  // Nuevo patrón mejorado para descripciones
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Extraer descripción (excluyendo precios al final si existen)
    const descMatch = line.match(PRODUCT_PATTERN);
    if (descMatch) {
      const description = descMatch[1].trim();

      // Buscar precio en la línea actual o siguiente
      let priceMatch = line.match(PRICE_PATTERN);
      let priceLine = i;

      if (!priceMatch && i < lines.length - 1) {
        priceMatch = lines[i + 1].match(PRICE_PATTERN);
        if (priceMatch) priceLine = i + 1;
      }

      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/[.,]/g, ''), 10);

        // Validar que la descripción no sea un número o dato inválido
        if (!/^\d|V\. Ahorro|KGM\b/i.test(description)) {
          products.push({
            description: formatDescription(description),
            price
          });
        }
        i = priceLine;
      }
    }
  }
  if (expectedItems && products.length >= expectedItems) {
    return products.slice(0, expectedItems);
  }

  return products.length > 0 ? products : [];
}


function processAltCarulla(lines: string[]): Product[] {
  const products: Product[] = [];
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1]?.trim();

    const unitLineMatch = current.match(/1\/u.*?(\d{1,3}(?:[.,]\d{3})).*?(\d{1,3}(?:[.,]\d{3}))$/);
    const descLineMatch = next?.match(/^(\d{6,})\s+(.+)/);

    if (unitLineMatch && descLineMatch) {
      const price = parseInt(unitLineMatch[2].replace(/[.,]/g, ''), 10);
      const description = descLineMatch[2].trim();
      products.push({ description: formatDescription(description), price });
      i++;
      continue;
    }
  }
  return products;
}
function fallbackProcessing(lines: string[], joined: string): Product[] {
  const products: Product[] = [];
  // Heurística general para productos pesables
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