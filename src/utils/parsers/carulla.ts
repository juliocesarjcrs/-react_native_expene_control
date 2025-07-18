/* eslint-disable no-useless-escape */
import { Product } from "~/shared/types/components/receipt-scanner.type";
import { formatDescription } from "./formatDescription";

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

  // 3. Caso Carulla con header roto (caso 5) y entró 3
  if (isCarullaCase5(joined)) {
    console.log("🛠️ Procesando como caso especial Carulla 5");
    return processCarullaCase5(lines, joined);
  }

  // 4. Caso estándar (caso  4) No entró
  // if (isStandardCarulla(joined)) {
  //   console.log("🏷️ Procesando como Carulla estándar");
  //   return processStandardCarulla(lines, joined);
  // }

  // 5. Caso Carulla con precios en línea (caso 6 y 4)
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
    joined.includes('Total Item :');
}

// function isStandardCarulla(joined: string): boolean {
//   return (
//     (joined.includes('PLU DETALLE PRECIO') ||
//       joined.includes('PLU\tDETALLE\tPRECIO') ||
//       (joined.includes('PLU DETALLE') && joined.includes('PRECIO'))) && // Condición mejorada
//     joined.includes('Total Item :') &&
//     // !isCarullaCase5(joined) &&
//     !isCarullaCase6(joined)
//   );
// }

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
  console.log("🛠️ Procesando como caso Carulla con precios en línea");

  const totalItemMatch = joined.match(/Total Item\s*:\s*(\d+)/);
  const expectedItems = totalItemMatch ? parseInt(totalItemMatch[1], 10) : null;

  // Patrón mejorado que maneja:
  // 1. Líneas que comienzan con número (PLU)
  // 2. Seguidas de descripción (hasta el precio)
  // 3. Y terminan con precio (con o sin tabulación)
  const productPattern = /^\d+\s+([^\d]+?)\s+(\d{1,3}(?:[.,]\d{3}))\s*$/;

  // Alternativa para líneas con formato diferente
  const altProductPattern = /^\d+\s+\d+\.\d+\/KGM.*?\s+(\d{1,3}(?:[.,]\d{3}))\s*$/;
  const descPattern = /^\d+\s+([A-Za-zÁÉÍÓÚÜÑñ].+)/;

  let lastDescription = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Intenta hacer match con el patrón principal
    const match = line.match(productPattern);
    if (match) {
      const description = match[1].trim();
      const price = parseInt(match[2].replace(/[.,]/g, ''), 10);

      products.push({
        description: formatDescription(description),
        price
      });
      continue;
    }

    // Intenta hacer match con el patrón alternativo (para líneas con medidas)
    const altMatch = line.match(altProductPattern);
    const descMatch = line.match(descPattern);

    if (descMatch) {
      lastDescription = descMatch[1].trim();
    }
    else if (altMatch && lastDescription) {
      const price = parseInt(altMatch[1].replace(/[.,]/g, ''), 10);

      products.push({
        description: formatDescription(lastDescription),
        price
      });
      lastDescription = '';
    }
  }

  if (expectedItems && products.length >= expectedItems) {
    return products.slice(0, expectedItems);
  }

  return products;
}

function processCarullaCase5(lines: string[], joined: string): Product[] {
  const products: Product[] = [];
  console.log("🛠️ Procesando como caso especial Carulla 6");

  const totalItemMatch = joined.match(/Total Item\s*:\s*(\d+)/);
  const expectedItems = totalItemMatch ? parseInt(totalItemMatch[1], 10) : null;

  // Nuevo patrón mejorado para descripciones
  const descriptionPattern = /^\d+\s+([A-Za-zÁÉÍÓÚÜÑñ#%().,\/\- ]+?)(?:\s+\d+[.,]\d{3})?$/i;
  const pricePattern = /(\d{1,3}(?:[.,]\d{3}))\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Extraer descripción (excluyendo precios al final si existen)
    const descMatch = line.match(descriptionPattern);
    if (descMatch) {
      const description = descMatch[1].trim();

      // Buscar precio en la línea actual o siguiente
      let priceMatch = line.match(pricePattern);
      let priceLine = i;

      if (!priceMatch && i < lines.length - 1) {
        priceMatch = lines[i + 1].match(pricePattern);
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

// function processStandardCarulla(lines: string[], joined: string): Product[] {
//   const products: Product[] = [];
//   // Resto de la lógica original para otros formatos...
//   for (let i = 0; i < lines.length; i++) {
//     const current = lines[i];
//     const next = lines[i + 1]?.trim();

//     const unitLineMatch = current.match(/1\/u.*?(\d{1,3}(?:[.,]\d{3})).*?(\d{1,3}(?:[.,]\d{3}))$/);
//     const descLineMatch = next?.match(/^(\d{6,})\s+(.+)/);

//     if (unitLineMatch && descLineMatch) {
//       const price = parseInt(unitLineMatch[2].replace(/[.,]/g, ''), 10);
//       const description = descLineMatch[2].trim();
//       products.push({ description: formatDescription(description), price });
//       i++;
//       continue;
//     }

//     const inlineMatch = current.match(/^(\d{6,})\s+(.+?)\s+(\d{1,3}(?:[.,]\d{3}))$/);
//     if (inlineMatch) {
//       const description = inlineMatch[2].trim();
//       const price = parseInt(inlineMatch[3].replace(/[.,]/g, ''), 10);
//       products.push({ description: formatDescription(description), price });
//       continue;
//     }

//     const splitDescMatch = current.match(/^(\d{6,})\s+(.+)$/);
//     const nextPriceMatch = next?.match(/^(\d{1,3}(?:[.,]\d{3}))$/);
//     if (splitDescMatch && nextPriceMatch) {
//       const description = splitDescMatch[2].trim();
//       const price = parseInt(nextPriceMatch[1].replace(/[.,]/g, ''), 10);
//       products.push({ description: formatDescription(description), price });
//       i++;
//       continue;
//     }
//     const exitoInlineMatch = current.match(/^(\d{6,})\s+(.+?)\s+(\d{1,3}[.,]\d{3})[A-Z]?$/);
//     if (exitoInlineMatch) {
//       const description = exitoInlineMatch[2].trim();
//       const price = parseInt(exitoInlineMatch[3].replace(/[.,]/g, ''), 10);
//       products.push({ description: formatDescription(description), price });
//       continue;
//     }
//   }

//   const carullaInlineRegex = /\d+\s+1\/u\s+x\s+[\d.,]+\s+V\s*\.?\s*Ahorro\s+\d+\s+(\d{6,})\s+([A-ZÁÉÍÓÚÑa-záéíóúñ().,/\- ]{3,})\s+(\d{1,3}(?:[.,]\d{3}))[A-Z]?/g;
//   let matchInline;
//   while ((matchInline = carullaInlineRegex.exec(joined)) !== null) {
//     const [, , descriptionRaw, priceRaw] = matchInline;
//     const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
//     const price = parseInt(priceRaw.replace(/[.,]/g, ''), 10);
//     if (!products.find(p => p.description === description && p.price === price)) {
//       products.push({ description: formatDescription(description), price });
//     }
//   }
//   let match;
//   if (products.length === 0) {
//     const regex = /\d+\s+[0-9.,\s]+\/KGM\s+x\s+[0-9.,\s]+\s+V\.\s+Ahorro\s+[0-9.,\s]+\s+(\d{3,6})\s+([A-Za-zÁÉÍÓÚÜÑñ().,/\- ]{3,})\s+(\d{1,3}(?:[.,]\s?\d{3}))/gi;
//     while ((match = regex.exec(joined)) !== null) {
//       const [, , descriptionRaw, priceRaw] = match;
//       const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
//       const price = parseInt(priceRaw.replace(/[.,\s]/g, ''), 10);
//       products.push({ description: formatDescription(description), price });
//     }
//   }
//   return products;
// }

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