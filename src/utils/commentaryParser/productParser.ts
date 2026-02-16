import { ProductPrice } from '~/shared/types/screens/Statistics/commentary-analysis.types';

/**
 * Parsea comentarios de productos/proteínas
 *
 * FORMATOS SOPORTADOS (Estándar Colombiano):
 *
 * CON PESO Y PRECIO:
 * "Hígado — 0.525 kg @ $22.000/kg [SuperCarnesJH]"
 * "Trucha — 0.545 kg @ $26.999/kg [Exito]"
 *
 * POR UNIDAD:
 * "Leche — 1 un @ $2.400 [Carulla]"
 * "Galletas — 1 un @ $3.132 [Exito]"
 *
 * SIMPLIFICADO (sin precio/kg):
 * "Pechuga blanca — 1.150 kg [D1]"
 * "1.150 kg Pechuga blanca"
 * "Lagarto Molida" (solo costo total, asume 1 unidad)
 */
export const parseProductCommentary = (
  commentary: string,
  cost: number,
  date: string
): ProductPrice | null => {
  if (!commentary) return null;

  try {
    // ==========================================
    // PATRÓN 1: Formato completo colombiano
    // "Producto — X kg/un @ $Precio/kg [Tienda]"
    // ==========================================
    let match = commentary.match(
      /(.+?)\s*—\s*(\d+\.?\d*)\s*(kg|un)\s*@\s*\$?(\d{1,3}(?:\.\d{3})*)(?:\/kg)?\s*\[([^\]]+)\]/i
    );

    if (match) {
      const product = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unit = match[3].toLowerCase(); // 'kg' o 'un'
      const priceRaw = parseInt(match[4].replace(/\./g, '')); // Remover separador de miles
      const store = match[5].trim();

      // Calcular precio por kg/unidad
      const pricePerKg = unit === 'kg' ? priceRaw : Math.round(cost / quantity);

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        store,
        date
      };
    }

    // ==========================================
    // PATRÓN 2: Sin precio pero con tienda
    // "Producto — X kg [Tienda]"
    // ==========================================
    match = commentary.match(/(.+?)\s*—\s*(\d+\.?\d*)\s*(kg|un)\s*\[([^\]]+)\]/i);

    if (match) {
      const product = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unit = match[3].toLowerCase();
      const store = match[4].trim();
      const pricePerKg = Math.round(cost / quantity);

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        store,
        date
      };
    }

    // ==========================================
    // PATRÓN 3: Formato antiguo sin $
    // "Producto — Xkg a $Precio/kg" o "Producto — Xkg a Precio/kg"
    // ==========================================
    match = commentary.match(
      /(.+?)\s*—\s*(\d+\.?\d*)\s*(kg|un)\s*a?\s*\$?(\d{1,3}(?:[.,]\d{3})*)/i
    );

    if (match) {
      const product = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unit = match[3].toLowerCase();
      const priceRaw = parseFloat(match[4].replace(/[.,]/g, ''));

      const pricePerKg = unit === 'kg' ? priceRaw : Math.round(cost / quantity);

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        date
      };
    }

    // ==========================================
    // PATRÓN 4: "X kg Producto"
    // "1.150 kg Pechuga blanca"
    // ==========================================
    match = commentary.match(/(\d+\.?\d*)\s*(kg|un)\s+(.+)/i);

    if (match) {
      const quantity = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      const product = match[3].trim();
      const pricePerKg = Math.round(cost / quantity);

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        date
      };
    }

    // ==========================================
    // PATRÓN 5: Solo nombre (sin cantidad)
    // "Lagarto Molida" - asume 1 unidad
    // ==========================================
    if (commentary.trim().length > 0) {
      return {
        cost,
        product: commentary.trim(),
        quantity: 1,
        pricePerKg: cost, // Precio total = precio por unidad
        date
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing product commentary:', error);
    return null;
  }
};

/**
 * Encuentra el mejor precio de un producto
 */
export const findBestPrice = (
  products: ProductPrice[],
  productName: string
): { best: ProductPrice | null; worst: ProductPrice | null; savings: number } => {
  const filtered = products.filter((p) =>
    p.product.toLowerCase().includes(productName.toLowerCase())
  );

  if (filtered.length === 0) {
    return { best: null, worst: null, savings: 0 };
  }

  const sorted = [...filtered].sort((a, b) => a.pricePerKg - b.pricePerKg);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const savings = worst.pricePerKg - best.pricePerKg;

  return { best, worst, savings };
};

/**
 * Encuentra la tienda más barata para un producto
 */
export const findCheapestStore = (
  products: ProductPrice[]
): { [store: string]: { count: number; avgPrice: number } } => {
  const storeStats: { [store: string]: { total: number; count: number } } = {};

  products.forEach((p) => {
    if (!p.store) return;

    if (!storeStats[p.store]) {
      storeStats[p.store] = { total: 0, count: 0 };
    }

    storeStats[p.store].total += p.pricePerKg;
    storeStats[p.store].count += 1;
  });

  const result: { [store: string]: { count: number; avgPrice: number } } = {};

  Object.keys(storeStats).forEach((store) => {
    result[store] = {
      count: storeStats[store].count,
      avgPrice: Math.round(storeStats[store].total / storeStats[store].count)
    };
  });

  return result;
};
