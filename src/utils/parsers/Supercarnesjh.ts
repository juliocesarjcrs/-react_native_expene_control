import { Product } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';

// Patrones para detectar productos y precios
const PRODUCT_WITH_PRICE_PATTERN = /(\d{4})\s+(.+?)\s+(\d{1,3}(?:[.,]\d{3})+)/;
const WEIGHT_PATTERN = /([\d.,]+)\s*(KGS?|KILOS?|GRS?|GRAMOS?)\s*[Xx×]\s*\$?\s*([\d.,]+)/i;
const SIMPLE_PRODUCT_PATTERN = /(\d{4})\s+(.+)/;

export function parseSuperCarnesJH(lines: string[], joined: string): Product[] {
  console.log('🥩 Procesando como tipo Super Carnes JH...');

  const products: Product[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Intentar encontrar línea de producto (CODIGO PRODUCTO TOTAL)
    const productMatch = line.match(PRODUCT_WITH_PRICE_PATTERN);

    if (productMatch) {
      const productName = productMatch[2].trim();
      const totalPrice = parseInt(productMatch[3].replace(/[.,]/g, ''), 10);

      // Buscar información de peso en la siguiente línea
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const weightMatch = nextLine.match(WEIGHT_PATTERN);

        if (weightMatch) {
          const quantity = parseFloat(weightMatch[1].replace(',', '.'));
          const unit = weightMatch[2].toUpperCase();
          const pricePerUnit = parseInt(weightMatch[3].replace(/[.,]/g, ''), 10);

          // Normalizar unidad (convertir gramos a kg si es necesario)
          let normalizedQuantity = quantity;
          let normalizedUnit = 'kg';

          if (unit.startsWith('GR')) {
            normalizedQuantity = quantity / 1000;
            normalizedUnit = 'kg';
          } else if (unit.startsWith('KG') || unit.startsWith('KILO')) {
            normalizedQuantity = quantity;
            normalizedUnit = 'kg';
          }

          // Formatear descripción con toda la información
          const description = formatProductDescription(
            productName,
            normalizedQuantity,
            normalizedUnit,
            pricePerUnit
          );

          products.push({
            description,
            price: totalPrice
          });

          i++; // Saltar la línea de peso ya procesada
          continue;
        }
      }

      // Si no hay información de peso, agregar solo el producto básico
      products.push({
        description: formatDescription(productName),
        price: totalPrice
      });
    } else {
      // Intentar patrón simple si no coincide con el completo
      const simpleMatch = line.match(SIMPLE_PRODUCT_PATTERN);

      if (simpleMatch && i + 1 < lines.length) {
        const productName = simpleMatch[2].trim();
        const nextLine = lines[i + 1].trim();

        // Verificar si la siguiente línea tiene peso y precio
        const weightMatch = nextLine.match(WEIGHT_PATTERN);

        if (weightMatch) {
          const quantity = parseFloat(weightMatch[1].replace(',', '.'));
          const unit = weightMatch[2].toUpperCase();
          const pricePerUnit = parseInt(weightMatch[3].replace(/[.,]/g, ''), 10);

          // Calcular precio total
          let normalizedQuantity = quantity;
          if (unit.startsWith('GR')) {
            normalizedQuantity = quantity / 1000;
          }

          const totalPrice = Math.round(normalizedQuantity * pricePerUnit);

          // Normalizar unidad
          const normalizedUnit = unit.startsWith('GR') ? 'kg' : 'kg';

          const description = formatProductDescription(
            productName,
            normalizedQuantity,
            normalizedUnit,
            pricePerUnit
          );

          products.push({
            description,
            price: totalPrice
          });

          i++; // Saltar la línea de peso ya procesada
        }
      }
    }
  }

  // Limitar productos según TOTAL UNIDADES si está disponible
  return limitProductsByTotal(products, joined);
}

/**
 * Formatea la descripción del producto incluyendo peso y precio por unidad
 */
function formatProductDescription(
  productName: string,
  quantity: number,
  unit: string,
  pricePerUnit: number
): string {
  const formattedName = formatDescription(productName);
  const formattedQuantity = quantity.toFixed(3).replace(/\.?0+$/, '');
  const formattedPrice = pricePerUnit.toLocaleString('es-CO');

  return `${formattedName} — ${formattedQuantity} ${unit} a $${formattedPrice}/${unit}`;
}

/**
 * Limita los productos según el total indicado en la factura
 */
function limitProductsByTotal(products: Product[], joined: string): Product[] {
  // Buscar "TOTAL UNIDADES" o cantidad total de productos
  const totalMatch = joined.match(/TOTAL\s+(?:UNIDADES|ITEMS?)\s*[:\s]+\s*(\d+)/i);

  if (totalMatch) {
    const totalProducts = parseInt(totalMatch[1], 10);
    if (products.length > totalProducts && totalProducts > 0) {
      console.log(`🔍 Limitando a ${totalProducts} productos según factura`);
      return products.slice(0, totalProducts);
    }
  }

  return products;
}

/**
 * Detecta si el OCR corresponde a una factura de Super Carnes JH
 */
export function isSuperCarnesJH(ocr: string): boolean {
  const indicators = [
    /super\s*carnes\s*j\.?h\.?/i,
    /TOTAL\s+KILOS/i,
    /TOTAL\s+UNIDADES/i,
    /\d{4}\s+.+?\s+\d{1,3}(?:[.,]\d{3})+.*?KGS?\s*[Xx×]/is
  ];

  return indicators.some((pattern) => pattern.test(ocr));
}
