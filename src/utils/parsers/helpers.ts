/**
 * Funciones auxiliares compartidas para parsers OCR
 */

import { ReceiptType } from '~/shared/types/components/receipt-scanner.type';
import { formatDescription } from './formatDescription';
import {
  STORE_NAME_MAP,
  FORMAT_CONSTANTS,
  REGEX_PATTERNS,
  DiscountInfo
} from '~/shared/types/utils/parsers/parser-types';

/**
 * Obtiene el nombre de la tienda formateado para el tag
 *
 * @param receiptType - Tipo de recibo del sistema
 * @returns Nombre de la tienda para usar en tags
 */
export function getStoreName(receiptType: ReceiptType): string {
  return STORE_NAME_MAP[receiptType];
}

/**
 * Obtiene el tag de tienda formateado
 *
 * @param receiptType - Tipo de recibo del sistema
 * @returns Tag formateado, ej: "[Carulla]"
 */
export function getStoreTag(receiptType: ReceiptType): string {
  return FORMAT_CONSTANTS.STORE_TAGS[receiptType];
}

/**
 * Formatea un producto simple sin información de peso/precio
 * Formato: "Producto [Tienda]"
 *
 * @param description - Descripción ya formateada del producto
 * @param receiptType - Tipo de recibo
 * @returns Descripción con tag de tienda
 */
export function formatSimpleProduct(description: string, receiptType: ReceiptType): string {
  const tag = getStoreTag(receiptType);
  return `${description} ${tag}`;
}

/**
 * Formatea un producto con peso
 * Formato: "Producto — X kg @ $Y/kg [Tienda]"
 *
 * @param productName - Nombre del producto
 * @param weight - Peso en kg (como string para preservar formato)
 * @param pricePerKg - Precio por kilogramo
 * @param receiptType - Tipo de recibo
 * @returns Descripción formateada con peso
 */
export function formatWeightProduct(
  productName: string,
  weight: string,
  pricePerKg: number,
  receiptType: ReceiptType
): string {
  const formattedName = formatDescription(productName);
  const formattedPrice = Math.round(pricePerKg).toLocaleString(FORMAT_CONSTANTS.LOCALE);
  const tag = getStoreTag(receiptType);

  return `${formattedName} ${FORMAT_CONSTANTS.SEPARATOR} ${weight} kg ${FORMAT_CONSTANTS.PRICE_SYMBOL} ${FORMAT_CONSTANTS.CURRENCY}${formattedPrice}/kg ${tag}`;
}

/**
 * Formatea un producto por unidad
 * Formato: "Producto — 1 un @ $X [Tienda]"
 *
 * @param productName - Nombre del producto
 * @param quantity - Cantidad de unidades
 * @param pricePerUnit - Precio por unidad
 * @param receiptType - Tipo de recibo
 * @returns Descripción formateada por unidad
 */
export function formatUnitProduct(
  productName: string,
  quantity: number,
  pricePerUnit: number,
  receiptType: ReceiptType
): string {
  const formattedName = formatDescription(productName);
  const formattedPrice = Math.round(pricePerUnit).toLocaleString(FORMAT_CONSTANTS.LOCALE);
  const tag = getStoreTag(receiptType);

  return `${formattedName} ${FORMAT_CONSTANTS.SEPARATOR} ${quantity} un ${FORMAT_CONSTANTS.PRICE_SYMBOL} ${FORMAT_CONSTANTS.CURRENCY}${formattedPrice} ${tag}`;
}

/**
 * Formatea un producto con descuento
 * Formato: "Producto — X kg @ $Y/kg (antes $Z/kg, -N%) [Tienda]"
 *
 * @param productName - Nombre del producto
 * @param weight - Peso en kg (como string para preservar formato)
 * @param discount - Información del descuento
 * @param receiptType - Tipo de recibo
 * @returns Descripción formateada con descuento
 */
export function formatDiscountProduct(
  productName: string,
  weight: string,
  discount: DiscountInfo,
  receiptType: ReceiptType
): string {
  const formattedName = formatDescription(productName);
  const formattedNewPrice = Math.round(discount.finalPricePerKg).toLocaleString(
    FORMAT_CONSTANTS.LOCALE
  );
  const formattedOriginalPrice = Math.round(discount.originalPricePerKg).toLocaleString(
    FORMAT_CONSTANTS.LOCALE
  );
  const savingsPercentage = Math.round(discount.savingsPercentage);
  const tag = getStoreTag(receiptType);

  if (savingsPercentage > 0) {
    return `${formattedName} ${FORMAT_CONSTANTS.SEPARATOR} ${weight} kg ${FORMAT_CONSTANTS.PRICE_SYMBOL} ${FORMAT_CONSTANTS.CURRENCY}${formattedNewPrice}/kg (antes ${FORMAT_CONSTANTS.CURRENCY}${formattedOriginalPrice}/kg, -${savingsPercentage}%) ${tag}`;
  }

  return `${formattedName} ${FORMAT_CONSTANTS.SEPARATOR} ${weight} kg ${FORMAT_CONSTANTS.PRICE_SYMBOL} ${FORMAT_CONSTANTS.CURRENCY}${formattedNewPrice}/kg ${tag}`;
}

/**
 * Procesa líneas con información de peso y descuento (patrón KGM)
 * Calcula el descuento y devuelve la descripción formateada
 *
 * @param line - Línea con información de peso y ahorro
 * @param productName - Nombre del producto
 * @param receiptType - Tipo de recibo
 * @returns Descripción formateada con peso (y descuento si aplica)
 */
export function processWeightAndSavings(
  line: string,
  productName: string,
  receiptType: ReceiptType
): string {
  // 🔒 Blindaje: solo procesar si realmente es KGM
  if (!/\/KGM/i.test(line)) {
    return productName;
  }
  const kgmMatch = line.match(REGEX_PATTERNS.KGM_PATTERN);

  if (kgmMatch) {
    // weightRaw: formato anglosajón con punto decimal → usado para cálculos (parseFloat)
    // weightDisplay: formato colombiano con coma decimal (ISO 4217 / SI) → usado en el comentario
    const weightRaw = kgmMatch[1].replace(/\s+/g, '');
    const weightDisplay = weightRaw.replace('.', ',');
    const originalPrice = parseFloat(kgmMatch[3].replace(REGEX_PATTERNS.PRICE_CLEAN, ''));
    const savings = parseFloat(kgmMatch[4].replace(REGEX_PATTERNS.PRICE_CLEAN, ''));

    const totalOriginal = originalPrice * parseFloat(weightRaw);
    const totalPid = totalOriginal - savings;
    const newPricePerkg = totalPid / parseFloat(weightRaw);

    if (totalOriginal > 0) {
      const savingsPercentage = (savings / totalOriginal) * 100;

      const discount: DiscountInfo = {
        originalPricePerKg: originalPrice,
        finalPricePerKg: newPricePerkg,
        savingsAmount: savings,
        savingsPercentage
      };

      return formatDiscountProduct(productName, weightDisplay, discount, receiptType);
    }
  }

  // Si no hay información de peso, retornar el nombre sin cambios
  return productName;
}

/**
 * Limpia el precio de caracteres no numéricos
 *
 * @param priceStr - String con el precio
 * @returns Precio como número entero
 */
export function cleanPrice(priceStr: string): number {
  return parseInt(priceStr.replace(REGEX_PATTERNS.PRICE_CLEAN, ''), 10);
}

/**
 * Limita los productos según el Total Item del recibo
 *
 * @param products - Array de productos parseados
 * @param joined - Texto completo del recibo
 * @returns Array de productos limitado
 */
export function limitProducts<T>(products: T[], joined: string): T[] {
  const totalMatch = joined.match(/Total Item\s*:\s*(\d+)/);
  if (totalMatch && products.length > parseInt(totalMatch[1], 10)) {
    return products.slice(0, parseInt(totalMatch[1], 10));
  }
  return products;
}

/**
 * Elimina ceros finales innecesarios de un número
 *
 * @param value - Valor numérico
 * @param decimals - Número de decimales (default: 3)
 * @returns String con formato optimizado
 */
export function formatQuantity(value: number, decimals: number = 3): string {
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}
