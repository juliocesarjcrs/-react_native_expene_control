import { Product, ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';
import { formatSimpleProduct } from './helpers';
import { canonicalize } from '../canonicalizer';

const RECEIPT_TYPE: ReceiptType = 'DollarCity';

export function parseDollarCity(lines: string[], existingCanonicals: string[] = []): Product[] {
  const products: Product[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Saltar líneas de totales y siguientes
    if (
      line.startsWith('TOTAL') ||
      line.startsWith('MASTERCARD') ||
      line.startsWith('COP') ||
      line.startsWith('REGISTRO')
    ) {
      break;
    }

    // Patrón para línea de descripción de producto (número + nombre)
    const descMatch = line.match(/^\d+\s+(.+)/);

    if (descMatch) {
      const description = descMatch[1];

      // Buscar línea de precio (debe tener formato 9999.00 B)
      if (i + 1 < lines.length) {
        const priceLine = lines[i + 1];
        const priceMatch = priceLine.match(/\d+\s+([\d,.]+)\s+B/);

        if (priceMatch) {
          // La línea siguiente debería ser el precio final
          if (i + 2 < lines.length) {
            const finalPriceLine = lines[i + 2];
            const finalPriceMatch = finalPriceLine.match(/[\d@]+\s+([\d,.]+)/);

            if (finalPriceMatch) {
              products.push({
                description: formatSimpleProduct(formatDescription(description), RECEIPT_TYPE),
                price: parseNumber(finalPriceMatch[1])
              });
              i += 3; // Saltar las 3 líneas (desc, precio B, precio final)
              continue;
            }
          }
        }
      }
    }

    // Manejo de impuestos (formato diferente)
    const taxMatch = line.match(/^\d+\s+Impuesto/);
    if (taxMatch && i + 2 < lines.length) {
      const taxPriceMatch = lines[i + 2].match(/([\d,.]+)/);
      if (taxPriceMatch) {
        products.push({
          description: formatSimpleProduct(
            formatDescription(line.split(/\d+\s+/)[1]),
            RECEIPT_TYPE
          ),
          price: parseNumber(taxPriceMatch[1])
        });
        i += 3;
        continue;
      }
    }

    i++; // Avanzar si no coincide ningún patrón
  }

  return products.map((p) => ({
    ...p,
    description: canonicalize(p.description, existingCanonicals)
  }));
}

function parseNumber(priceStr: string): number {
  // Eliminar todo después del punto (incluyendo el punto)
  const integerPart = priceStr.replace(/\..*/, '');
  // Convertir a número removiendo cualquier caracter no numérico restante
  return parseInt(integerPart.replace(/\D/g, ''), 10) || 0;
}
