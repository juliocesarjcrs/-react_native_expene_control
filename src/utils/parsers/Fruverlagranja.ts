import { Product } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';

// Patrón principal para productos con peso/unidad y precios
const PRODUCT_PATTERN =
  /^N?\s*(.+?)\s+([\d.,]+)\s+(KI|KG|KILO|K|UN|UND|UNID)\s+([\d.,]+)\s+([\d.,]+)/i;

// Patrón alternativo si los datos están en diferentes posiciones
const ALT_PRODUCT_PATTERN = /^N?\s*(.+?)\s+([\d.,]+)\s+(KI|KG|KILO|K|UN|UND|UNID)/i;

export function parseFruverLaGranja(lines: string[], joined: string): Product[] {
  console.log('🍎 Procesando como tipo Fruver La Granja...');

  const products: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Intentar con el patrón principal (línea completa)
    const match = line.match(PRODUCT_PATTERN);

    if (match) {
      const productName = match[1].trim();
      const quantity = parseFloat(match[2].replace(',', '.'));
      const unit = normalizeUnit(match[3]);
      const pricePerUnit = parseInt(match[4].replace(/[.,]/g, ''), 10);
      const totalPrice = parseInt(match[5].replace(/[.,]/g, ''), 10);

      const description = formatProductDescription(productName, quantity, unit, pricePerUnit);

      products.push({
        description,
        price: totalPrice
      });
      continue;
    }

    // Intentar patrón alternativo (datos pueden estar en líneas separadas)
    const altMatch = line.match(ALT_PRODUCT_PATTERN);

    if (altMatch && i + 1 < lines.length) {
      const productName = altMatch[1].trim();
      const quantity = parseFloat(altMatch[2].replace(',', '.'));
      const unit = normalizeUnit(altMatch[3]);

      // Buscar precios en la misma línea o siguiente
      const restOfLine = line.substring(altMatch[0].length);
      const pricesInLine = restOfLine.match(/([\d.,]+)\s+([\d.,]+)/);

      if (pricesInLine) {
        const pricePerUnit = parseInt(pricesInLine[1].replace(/[.,]/g, ''), 10);
        const totalPrice = parseInt(pricesInLine[2].replace(/[.,]/g, ''), 10);

        const description = formatProductDescription(productName, quantity, unit, pricePerUnit);

        products.push({
          description,
          price: totalPrice
        });
      } else {
        // Buscar precios en la siguiente línea
        const nextLine = lines[i + 1].trim();
        const pricesMatch = nextLine.match(/^([\d.,]+)\s+([\d.,]+)/);

        if (pricesMatch) {
          const pricePerUnit = parseInt(pricesMatch[1].replace(/[.,]/g, ''), 10);
          const totalPrice = parseInt(pricesMatch[2].replace(/[.,]/g, ''), 10);

          const description = formatProductDescription(productName, quantity, unit, pricePerUnit);

          products.push({
            description,
            price: totalPrice
          });
          i++; // Saltar la línea de precios ya procesada
        }
      }
    }
  }

  return products;
}

/**
 * Normaliza las unidades a formato estándar
 */
function normalizeUnit(unit: string): string {
  const normalized = unit.toUpperCase();

  // Normalizar kilos
  if (normalized === 'KI' || normalized === 'KG' || normalized === 'KILO' || normalized === 'K') {
    return 'kg';
  }

  // Normalizar unidades
  if (normalized === 'UN' || normalized === 'UND' || normalized === 'UNID') {
    return 'un';
  }

  return unit.toLowerCase();
}

/**
 * Formatea la descripción del producto incluyendo cantidad y precio por unidad
 */
function formatProductDescription(
  productName: string,
  quantity: number,
  unit: string,
  pricePerUnit: number
): string {
  const formattedName = formatDescription(productName);

  // Formatear cantidad según la unidad
  let formattedQuantity: string;
  if (unit === 'kg') {
    // Para kilos, mostrar hasta 3 decimales y remover ceros innecesarios
    formattedQuantity = quantity.toFixed(3).replace(/\.?0+$/, '');
  } else {
    // Para unidades, mostrar como entero si es número entero, sino con decimales
    formattedQuantity =
      quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2).replace(/\.?0+$/, '');
  }

  const formattedPrice = pricePerUnit.toLocaleString('es-CO');

  return `${formattedName} — ${formattedQuantity} ${unit} × $${formattedPrice}/${unit}`;
}

/**
 * Detecta si el OCR corresponde a una factura de Fruver La Granja
 */
export function isFruverLaGranja(ocr: string): boolean {
  const indicators = [
    /fruver\s*la\s*granja/i,
    /\bN\s+[A-Z]+.*?\s+[\d.,]+\s+(KI|KG|UN)/i,
    /PRODUCTO.*CANT.*V\.UNID.*V\.PROD/i,
    /TOTAL\s+PROD\s*:/i
  ];

  return indicators.some((pattern) => pattern.test(ocr));
}
