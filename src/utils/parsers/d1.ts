import { Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';
import { formatSimpleProduct } from './helpers';

const RECEIPT_TYPE: ReceiptType = 'D1';

/**
 * Parser para recibos de D1
 * Los productos de D1 generalmente no tienen información de peso/precio unitario
 *
 * @param lines - Líneas del recibo OCR
 * @param joined - Texto completo del recibo
 * @returns Array de productos parseados
 */
export function parseD1(lines: string[], joined: string): Product[] {
  console.log('📄 Procesando como tipo D1...');
  const products: Product[] = [];

  // Estrategia mejorada: procesar línea por línea para mejor control
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // CASO ESPECIAL: Múltiples productos en una sola línea
    // Ejemplo: "2,950 7700304649631 SALSA DE PINA 2,250 7700304305209 SERVILLETA CO 1,650 A 2,950 A 2,250 A"
    const multiProductPattern =
      /(\d{1,3}[.,]\d{3})\s+(\d{8,13})\s+([A-Z][A-ZÁÉÍÓÚÑ'\/\-\s]+?)(?=\s+\d{1,3}[.,]\d{3})/gi;
    const multiMatches = [...line.matchAll(multiProductPattern)];

    if (multiMatches.length > 1) {
      // Encontró múltiples productos en la línea
      for (const match of multiMatches) {
        const [, priceStr, code, descriptionRaw] = match;
        const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
        const price = parseInt(priceStr.replace(/[.,]/g, ''), 10);

        if (!isNaN(price) && description.length >= 3) {
          const formattedDesc = formatSimpleProduct(formatDescription(description), RECEIPT_TYPE);
          if (!products.find((p) => p.description === formattedDesc && p.price === price)) {
            products.push({ description: formattedDesc, price });
          }
        }
      }
      continue;
    }

    // Patrón mejorado que captura: [cantidad] [precio_unitario] [código] [descripción] [precio_total]
    // Ejemplo: "1	2 UN	11,900 7700304792825 CAFE INSTAN/L	23,800 C"
    const match = line.match(
      /(?:\d+\s+)?(?:\d+\s+)?(?:UN\s+)?(\d{1,3}[.,]\s?\d{3})\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ'\/\-\s]{3,}?)(?:\s+(\d{1,3}[.,\s]?\d{3}))?(?:\s+[A-Z]\s*)?$/i
    );

    if (match) {
      const [, priceUnit, code, descriptionRaw, priceTotal] = match;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');

      // Preferir precio total si existe, sino usar precio unitario
      const priceStr = priceTotal || priceUnit;
      const price = parseInt(priceStr.replace(/[.,\s]/g, ''), 10);

      if (!isNaN(price) && description.length >= 3) {
        // Evitar duplicados
        const formattedDesc = formatSimpleProduct(formatDescription(description), RECEIPT_TYPE);
        if (!products.find((p) => p.description === formattedDesc && p.price === price)) {
          products.push({ description: formattedDesc, price });
        }
      }
      continue;
    }

    // Patrón alternativo para casos donde el precio total está más separado o tiene espacios
    // Ejemplo: "UN	1,300 7700304305223 AJO MALLA X 3	2	600 6"
    const altMatch = line.match(
      /(?:UN\s+)?(\d{1,3}[.,]\s?\d{3})\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ'\/\-\s]{3,})/i
    );

    if (altMatch) {
      const [, priceUnit, code, descriptionRaw] = altMatch;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');

      // Buscar el precio total después de la descripción en la misma línea
      const restOfLine = line.substring(line.indexOf(description) + description.length);
      const totalPriceMatch = restOfLine.match(/(\d{1,3})[.,\s\t]+(\d{3})/);

      let price;
      if (totalPriceMatch) {
        // Encontró precio total en formato separado
        price = parseInt(totalPriceMatch[1] + totalPriceMatch[2], 10);
      } else {
        // Usar precio unitario
        price = parseInt(priceUnit.replace(/[.,\s]/g, ''), 10);
      }

      if (!isNaN(price) && description.length >= 3) {
        const formattedDesc = formatSimpleProduct(formatDescription(description), RECEIPT_TYPE);
        if (!products.find((p) => p.description === formattedDesc && p.price === price)) {
          products.push({ description: formattedDesc, price });
        }
      }
    }
  }

  // Si no encontró productos, intentar con el regex original más flexible
  if (products.length === 0) {
    let match;
    const regex =
      /(\d{1,3}(?:[.,]\s?\d{3})*(?:[.,]\s?\d{1,3})?)\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ'\/\-\s]{3,})(?:\s+(\d{1,3}(?:[.,]\s?\d{3})*(?:[.,]\s?\d{1,3})?))?(?:\s+[A-Z]\s*\.)?/gi;

    while ((match = regex.exec(joined)) !== null) {
      const [, price1, code, descriptionRaw, price2] = match;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');

      // Preferir price2 si existe, sino price1
      let priceString = (price2 || price1).replace(/[.,\s]/g, '');

      // Manejo especial para casos donde el precio aparece antes del código
      if (parseInt(priceString, 10) < 10 && code && code.length >= 8) {
        const altPriceMatch = joined.match(new RegExp(`${code}\\s+([\\d.,]+)`));
        if (altPriceMatch && altPriceMatch[1]) {
          priceString = altPriceMatch[1].replace(/[.,]/g, '');
        }
      }

      const price = parseInt(priceString, 10);

      if (!isNaN(price)) {
        const formattedDesc = formatSimpleProduct(formatDescription(description), RECEIPT_TYPE);
        if (!products.find((p) => p.description === formattedDesc && p.price === price)) {
          products.push({ description: formattedDesc, price });
        }
      }
    }
  }

  // Fallback para casos muy mal formateados
  if (products.length === 0) {
    const d1LooseRegex =
      /(\d{1,3}[.,]\s?\d{1,3})\s+\d+\s+([A-ZÁÉÍÓÚÑ'a-záéíóúñ().,\/\-\s]{3,})\s+(\d{1,3}[.,]\d{1,3})/g;
    let matchLoose;

    while ((matchLoose = d1LooseRegex.exec(joined)) !== null) {
      const [, , descriptionRaw, priceRaw] = matchLoose;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
      let price = 0;

      // Normalizar precio: "2,00" o "2.00" => 200
      const cleanPrice = priceRaw.replace(/\s/g, '');
      if (/^\d{1,3}[.,]\d{2}$/.test(cleanPrice)) {
        price = parseInt(cleanPrice.replace(/[.,]/, ''), 10);
      } else {
        price = parseInt(cleanPrice.replace(/[.,]/g, ''), 10);
      }

      const formattedDesc = formatSimpleProduct(formatDescription(description), RECEIPT_TYPE);
      if (!products.find((p) => p.description === formattedDesc && p.price === price)) {
        products.push({ description: formattedDesc, price });
      }
    }
  }

  return products;
}

// Ejemplos de uso:
// Input: "1	2 UN	11,900 7700304792825 CAFE INSTAN/L	23,800 C"
// Output: { description: "Cafe Instan/L [D1]", price: 23800 }
//
// Input: "2,950 7700304649631 SALSA DE PINA"
// Output: { description: "Salsa De Pina [D1]", price: 2950 }
