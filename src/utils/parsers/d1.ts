import { Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';
import { formatSimpleProduct } from './helpers';
import { canonicalize } from '../canonicalizer';

const RECEIPT_TYPE: ReceiptType = 'D1';

/**
 * Extrae cantidad y precio unitario de una línea D1.
 * Retorna null si no se puede extraer con suficiente confianza.
 *
 * Formatos reconocidos:
 *   "1\t2 UN\t11,900 ..."   → { qty: 2, unitPrice: 11900 }
 *   "2\tUN\t3,500 ..."      → { qty: 1, unitPrice: 3500 }
 *   "1 UN\t4,500\t..."      → { qty: 1, unitPrice: 4500 }
 *   "4,300 770030... "      → { qty: 1, unitPrice: 4300 }  (sin UN explícito)
 */
function extractQtyAndUnitPrice(line: string): { qty: number; unitPrice: number } | null {
  // Patrón 1: N\t[M ]UN\tPRECIO ... o N [M ]UN PRECIO ...
  // Captura cantidad M (puede ser distinta del ítem N) y precio unitario
  const fullMatch = line.match(/(?:^\d+\s+)?(\d+)\s+UN\s+([\d.,\s]+?)\s+\d{8,13}/i);
  if (fullMatch) {
    const qty = parseInt(fullMatch[1], 10);
    const unitPrice = parseInt(fullMatch[2].replace(/[.,\s]/g, ''), 10);
    if (qty > 0 && unitPrice > 0) return { qty, unitPrice };
  }

  // Patrón 2: UN sin cantidad explícita → qty = 1
  const unOnlyMatch = line.match(/\bUN\s+([\d.,\s]+?)\s+\d{8,13}/i);
  if (unOnlyMatch) {
    const unitPrice = parseInt(unOnlyMatch[1].replace(/[.,\s]/g, ''), 10);
    if (unitPrice > 0) return { qty: 1, unitPrice };
  }

  // Patrón 3: precio directo antes del código (sin UN) → qty = 1
  const priceCodeMatch = line.match(/^([\d.,\s]+?)\s+\d{8,13}/);
  if (priceCodeMatch) {
    const unitPrice = parseInt(priceCodeMatch[1].replace(/[.,\s]/g, ''), 10);
    if (unitPrice > 0) return { qty: 1, unitPrice };
  }

  return null;
}

/**
 * Formatea la descripción de un producto D1 con cantidad y precio unitario.
 * Formato: "Nombre — N un @ $X.XXX [D1]"
 * Si no se pudo extraer qty/unitPrice, usa formato simple: "Nombre [D1]"
 */
function formatD1Description(
  rawDescription: string,
  qtyAndPrice: { qty: number; unitPrice: number } | null
): string {
  const formattedName = formatDescription(rawDescription);

  if (!qtyAndPrice) {
    return formatSimpleProduct(formattedName, RECEIPT_TYPE);
  }

  const { qty, unitPrice } = qtyAndPrice;
  const formattedPrice = unitPrice.toLocaleString('es-CO');
  const tag = `[${RECEIPT_TYPE}]`;

  return `${formattedName} — ${qty} un @ $${formattedPrice} ${tag}`;
}

/**
 * Parser para recibos de D1.
 *
 * @param lines               - Líneas del recibo OCR
 * @param joined              - Texto completo del recibo
 * @param existingCanonicals  - Nombres canónicos ya presentes en BD
 * @returns Array de productos parseados
 */
export function parseD1(
  lines: string[],
  joined: string,
  existingCanonicals: string[] = []
): Product[] {
  console.log('📄 Procesando como tipo D1...');
  const products: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // CASO ESPECIAL: Múltiples productos en una sola línea
    // Ejemplo: "2,950 7700304649631 SALSA DE PINA 2,250 7700304305209 SERVILLETA CO 1,650 A 2,950 A 2,250 A"
    const multiProductPattern =
      /(\d{1,3}[.,]\d{3})\s+(\d{8,13})\s+([A-Z][A-ZÁÉÍÓÚÑ'\/\-\s]+?)(?=\s+\d{1,3}[.,]\d{3})/gi;
    const multiMatches = [...line.matchAll(multiProductPattern)];

    if (multiMatches.length > 1) {
      for (const match of multiMatches) {
        const [, priceStr, , descriptionRaw] = match;
        const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
        const price = parseInt(priceStr.replace(/[.,]/g, ''), 10);

        if (!isNaN(price) && description.length >= 3) {
          // En líneas multi-producto no hay info de UN fiable → formato simple
          const formattedDesc = formatSimpleProduct(formatDescription(description), RECEIPT_TYPE);
          if (!products.find((p) => p.description === formattedDesc && p.price === price)) {
            products.push({ description: formattedDesc, price });
          }
        }
      }
      continue;
    }

    // Patrón principal: [N\t] [M UN\t] PRECIO_UNIT CODIGO DESC [PRECIO_TOTAL] [letra]
    const match = line.match(
      /(?:\d+\s+)?(?:\d+\s+)?(?:UN\s+)?(\d{1,3}[.,]\s?\d{3})\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ'\/\-\s]{3,}?)(?:\s+(\d{1,3}[.,\s]?\d{3}))?(?:\s+[A-Z]\s*)?$/i
    );

    if (match) {
      const [, priceUnit, , descriptionRaw, priceTotal] = match;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
      const priceStr = priceTotal || priceUnit;
      const price = parseInt(priceStr.replace(/[.,\s]/g, ''), 10);

      if (!isNaN(price) && description.length >= 3) {
        const qtyAndPrice = extractQtyAndUnitPrice(line);
        const formattedDesc = formatD1Description(description, qtyAndPrice);
        if (!products.find((p) => p.description === formattedDesc && p.price === price)) {
          products.push({ description: formattedDesc, price });
        }
      }
      continue;
    }

    // Patrón alternativo: precio total separado o con espacios
    // Ejemplo: "UN\t1,300 7700304305223 AJO MALLA X 3\t2\t600 6"
    const altMatch = line.match(
      /(?:UN\s+)?(\d{1,3}[.,]\s?\d{3})\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ'\/\-\s]{3,})/i
    );

    if (altMatch) {
      const [, priceUnit, , descriptionRaw] = altMatch;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');

      const restOfLine = line.substring(line.indexOf(description) + description.length);
      const totalPriceMatch = restOfLine.match(/(\d{1,3})[.,\s\t]+(\d{3})/);

      let price: number;
      if (totalPriceMatch) {
        price = parseInt(totalPriceMatch[1] + totalPriceMatch[2], 10);
      } else {
        price = parseInt(priceUnit.replace(/[.,\s]/g, ''), 10);
      }

      if (!isNaN(price) && description.length >= 3) {
        const qtyAndPrice = extractQtyAndUnitPrice(line);
        const formattedDesc = formatD1Description(description, qtyAndPrice);
        if (!products.find((p) => p.description === formattedDesc && p.price === price)) {
          products.push({ description: formattedDesc, price });
        }
      }
    }
  }

  // Fallback: regex flexible sobre el texto completo
  if (products.length === 0) {
    let match;
    const regex =
      /(\d{1,3}(?:[.,]\s?\d{3})*(?:[.,]\s?\d{1,3})?)\s+(\d{8,13})\s+([A-ZÁÉÍÓÚÑ'\/\-\s]{3,})(?:\s+(\d{1,3}(?:[.,]\s?\d{3})*(?:[.,]\s?\d{1,3})?))?(?:\s+[A-Z]\s*\.)?/gi;

    while ((match = regex.exec(joined)) !== null) {
      const [, price1, code, descriptionRaw, price2] = match;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');

      let priceString = (price2 || price1).replace(/[.,\s]/g, '');

      if (parseInt(priceString, 10) < 10 && code && code.length >= 8) {
        const altPriceMatch = joined.match(new RegExp(`${code}\\s+([\\d.,]+)`));
        if (altPriceMatch && altPriceMatch[1]) {
          priceString = altPriceMatch[1].replace(/[.,]/g, '');
        }
      }

      const price = parseInt(priceString, 10);

      if (!isNaN(price)) {
        // En fallback no tenemos contexto de línea → formato simple
        const formattedDesc = formatSimpleProduct(formatDescription(description), RECEIPT_TYPE);
        if (!products.find((p) => p.description === formattedDesc && p.price === price)) {
          products.push({ description: formattedDesc, price });
        }
      }
    }
  }

  // Fallback final para casos muy mal formateados
  if (products.length === 0) {
    const d1LooseRegex =
      /(\d{1,3}[.,]\s?\d{1,3})\s+\d+\s+([A-ZÁÉÍÓÚÑ'a-záéíóúñ().,\/\-\s]{3,})\s+(\d{1,3}[.,]\d{1,3})/g;
    let matchLoose;

    while ((matchLoose = d1LooseRegex.exec(joined)) !== null) {
      const [, , descriptionRaw, priceRaw] = matchLoose;
      const description = descriptionRaw.trim().replace(/\s{2,}/g, ' ');
      const cleanPrice = priceRaw.replace(/\s/g, '');
      const price = /^\d{1,3}[.,]\d{2}$/.test(cleanPrice)
        ? parseInt(cleanPrice.replace(/[.,]/, ''), 10)
        : parseInt(cleanPrice.replace(/[.,]/g, ''), 10);

      const formattedDesc = formatSimpleProduct(formatDescription(description), RECEIPT_TYPE);
      if (!products.find((p) => p.description === formattedDesc && p.price === price)) {
        products.push({ description: formattedDesc, price });
      }
    }
  }

  return products.map((p) => ({
    ...p,
    description: canonicalize(p.description, existingCanonicals)
  }));
}
