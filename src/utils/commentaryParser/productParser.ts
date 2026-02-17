import { ProductPrice } from '~/shared/types/screens/Statistics/commentary-analysis.types';

// ============================================================
// CATÁLOGO DE PRODUCTOS QUE SE VENDEN POR PESO
// Exportable para que otros módulos puedan extenderlo.
// ============================================================

/** Categorías genéricas: cualquier nombre que empiece/contenga estas palabras se considera pesado */
export const WEIGHED_CATEGORIES: string[] = [
  // Carnes y proteínas
  'carne',
  'pollo',
  'pechuga',
  'muslo',
  'costilla',
  'lomo',
  'cerdo',
  'res',
  'higado',
  'hígado',
  'molida',
  'lagarto',
  'chorizo',
  'salmon',
  'salmón',
  'trucha',
  'tilapia',
  'bagre',
  'atun',
  'atún',
  'mariscos',
  // Frutas
  'mango',
  'papaya',
  'melon',
  'melón',
  'sandia',
  'sandía',
  'patilla',
  'naranja',
  'mandarina',
  'uva',
  'fresa',
  'mora',
  'lulo',
  'guayaba',
  'banano',
  'platano',
  'plátano',
  'piña',
  'pera',
  'manzana',
  'durazno',
  'ciruela',
  'maracuya',
  'maracuyá',
  'pitaya',
  'pitahaya',
  'tomate de arbol',
  'aguacate',
  'kiwi',
  'brocevo',
  // Verduras y hortalizas
  'tomate',
  'cebolla',
  'zanahoria',
  'papa',
  'yuca',
  'ahuyama',
  'auyama',
  'pimentón',
  'pimenton',
  'ajo',
  'pepino',
  'repollo',
  'lechuga',
  'espinaca',
  'acelga',
  'cilantro',
  'perejil',
  'apio',
  'remolacha',
  'coliflor',
  'brocoli',
  'brócoli',
  'habichuela',
  'arveja',
  'berenjena',
  'calabaza',
  'calabacin',
  'maiz',
  'maíz',
  'rabano',
  'rábano',
  'nabo',
  'puerro',
  'alcachofa',
  // Tubérculos
  'ñame',
  'name',
  'batata',
  'arracacha',
  'yautia'
];

/** Nombres específicos de producto (match exacto o substring normalizado) */
export const WEIGHED_PRODUCTS_SPECIFIC: string[] = [
  'higado de res',
  'pechuga blanca',
  'lomo de cerdo',
  'carne molida',
  'tomate chonto',
  'cebolla junca',
  'cebolla blanca',
  'papa pastusa',
  'papa criolla',
  'papa sin lavar',
  'lechuga batavia',
  'lechuga romana',
  'pepino cohombro',
  'yuca fresca',
  'ahuyama verde',
  'arveja en vaina'
];

// ============================================================
// HELPERS INTERNOS
// ============================================================

/** Normaliza texto: minúsculas + sin tildes */
const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/**
 * Determina si un producto se vende por peso basándose en:
 * 1. Si el comentario ya indica 'kg' explícitamente → true
 * 2. Si el nombre normalizado coincide con algún nombre específico → true
 * 3. Si el nombre normalizado contiene alguna categoría pesada → true
 * 4. Fallback → false (se vende por unidad)
 */
const resolveIsWeighed = (productName: string, hasKgInComment: boolean): boolean => {
  if (hasKgInComment) return true;

  const norm = normalize(productName);

  // Match por nombre específico
  if (WEIGHED_PRODUCTS_SPECIFIC.some((s) => norm.includes(normalize(s)))) return true;

  // Match por categoría genérica
  if (WEIGHED_CATEGORIES.some((cat) => norm.includes(normalize(cat)))) return true;

  return false;
};

/**
 * Parsea el bloque de precio colombiano: "$22.000" o "$22.000/kg"
 * Elimina el separador de miles (punto) y retorna el número.
 */
const parseCOPrice = (raw: string): number => parseInt(raw.replace(/\./g, '').replace(',', ''), 10);

// ============================================================
// PARSER PRINCIPAL
// ============================================================

/**
 * Parsea el comentario de un gasto y retorna un ProductPrice enriquecido.
 *
 * FORMATOS SOPORTADOS:
 *
 * PATRÓN 1 — Completo con descuento (nuevo formato Carulla OCR):
 *   "Ahuyama — 1.030 kg @ $2.156/kg (antes $3.080/kg, -30%) [Carulla]"
 *
 * PATRÓN 2 — Completo sin descuento:
 *   "Hígado — 0.525 kg @ $22.000/kg [SuperCarnesJH]"
 *   "Leche Entera — 1 un @ $2.400 [Carulla]"
 *
 * PATRÓN 3 — Sin precio/kg pero con tienda:
 *   "Pechuga blanca — 1.150 kg [D1]"
 *   "Sandia(Patilla) [Carulla]"   → isIncomplete: true
 *
 * PATRÓN 4 — Formato antiguo sin @:
 *   "Producto — 0.5kg a $5.000/kg"
 *
 * PATRÓN 5 — "X kg Producto" (peso antes del nombre):
 *   "1.150 kg Pechuga blanca"
 *
 * PATRÓN 6 — Solo nombre (incompleto):
 *   "Cebolla junca"  →  isIncomplete: true
 *   "Pastillas De Cocoa [D1]"  →  isIncomplete: true + store capturada
 */
export const parseProductCommentary = (
  commentary: string,
  cost: number,
  date: string
): ProductPrice | null => {
  if (!commentary?.trim()) return null;

  // Normalizar saltos de línea del OCR antes de parsear
  const text = commentary.replace(/\n/g, ' ').trim();

  try {
    // ----------------------------------------------------------
    // PATRÓN 1: Completo con descuento (nuevo OCR Carulla)
    // "Producto — X kg @ $P/kg (antes $O/kg, -D%) [Tienda]"
    // Nombre: ≥2 chars, no empieza con @ ni —
    // ----------------------------------------------------------
    let match = text.match(
      /^([^@\u2014\n]{2,}?)\s*[\u2014\-]\s*(\d+[.,]?\d*)\s*(kg|un)\s*@\s*\$?([\d.]+)(?:\/kg)?\s*\(antes\s*\$?([\d.]+)(?:\/kg)?,\s*-(\d+)%\)\s*\[([^\]]+)\]/i
    );

    if (match && match[1].trim().length >= 2) {
      const product = match[1].trim();
      const quantity = parseFloat(match[2].replace(',', '.'));
      const unit = match[3].toLowerCase() as 'kg' | 'un';
      const pricePerKg = parseCOPrice(match[4]);
      const originalPrice = parseCOPrice(match[5]);
      const discount = parseInt(match[6], 10);
      const store = match[7].trim();

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        originalPricePerKg: originalPrice,
        discountPercent: discount,
        store,
        unit,
        date,
        isWeighed: resolveIsWeighed(product, unit === 'kg'),
        isIncomplete: false
      };
    }

    // ----------------------------------------------------------
    // PATRÓN 2: Completo sin descuento (estándar @ con tienda)
    // "Producto — X kg @ $P/kg [Tienda]"
    // "Producto — X un @ $P [Tienda]"
    // Nombre: ≥2 chars, no empieza con @
    // ----------------------------------------------------------
    match = text.match(
      /^([^@\u2014\n]{2,}?)\s*[\u2014\-]\s*(\d+[.,]?\d*)\s*(kg|un)\s*@\s*\$?([\d.]+)(?:\/kg)?\s*\[([^\]]+)\]/i
    );

    if (match && match[1].trim().length >= 2) {
      const product = match[1].trim();
      const quantity = parseFloat(match[2].replace(',', '.'));
      const unit = match[3].toLowerCase() as 'kg' | 'un';
      const pricePerKg = parseCOPrice(match[4]);
      const store = match[5].trim();

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        store,
        unit,
        date,
        isWeighed: resolveIsWeighed(product, unit === 'kg'),
        isIncomplete: false
      };
    }

    // ----------------------------------------------------------
    // PATRÓN 1R: OCR roto con descuento — tiene qty pero perdió el nombre
    // "— X kg @ $P/kg (antes $O/kg, -D%) [Tienda]"
    // "X kg @ $P/kg (antes $O/kg, -D%) [Tienda]"
    // → isIncomplete: true, pricePerKg y originalPricePerKg sí disponibles
    // ----------------------------------------------------------
    match = text.match(
      /^[\u2014\-]?\s*(\d+[.,]?\d*)\s*(kg|un)\s*@\s*\$?([\d.]+)(?:\/kg)?\s*\(antes\s*\$?([\d.]+)(?:\/kg)?,\s*-(\d+)%\)\s*\[([^\]]+)\]/i
    );

    if (match) {
      const quantity = parseFloat(match[1].replace(',', '.'));
      const unit = match[2].toLowerCase() as 'kg' | 'un';
      const pricePerKg = parseCOPrice(match[3]);
      const originalPrice = parseCOPrice(match[4]);
      const discount = parseInt(match[5], 10);
      const store = match[6].trim();

      return {
        cost,
        product: `(sin nombre) ${store}`,
        quantity,
        pricePerKg,
        originalPricePerKg: originalPrice,
        discountPercent: discount,
        store,
        unit,
        date,
        isWeighed: true, // si tiene kg es producto pesado
        isIncomplete: true
      };
    }

    // ----------------------------------------------------------
    // PATRÓN 2R: OCR roto sin descuento — tiene qty pero perdió el nombre
    // "— X kg @ $P/kg [Tienda]"
    // ----------------------------------------------------------
    match = text.match(
      /^[\u2014\-]?\s*(\d+[.,]?\d*)\s*(kg|un)\s*@\s*\$?([\d.]+)(?:\/kg)?\s*\[([^\]]+)\]/i
    );

    if (match) {
      const quantity = parseFloat(match[1].replace(',', '.'));
      const unit = match[2].toLowerCase() as 'kg' | 'un';
      const pricePerKg = parseCOPrice(match[3]);
      const store = match[4].trim();

      return {
        cost,
        product: `(sin nombre) ${store}`,
        quantity,
        pricePerKg,
        store,
        unit,
        date,
        isWeighed: true,
        isIncomplete: true
      };
    }

    // ----------------------------------------------------------
    // PATRÓN AT: OCR roto — solo llegó "@ $precio ..." sin nombre ni qty
    // "@ $2.156/kg (antes $3.080/kg, -30%) [Carulla]"
    // → INCOMPLETO: precio/kg disponible pero sin nombre ni cantidad
    // ----------------------------------------------------------
    match = text.match(
      /^@\s*\$?([\d.]+)(?:\/kg)?\s*\(antes\s*\$?([\d.]+)(?:\/kg)?,\s*-(\d+)%\)\s*\[([^\]]+)\]/i
    );

    if (match) {
      const pricePerKg = parseCOPrice(match[1]);
      const originalPrice = parseCOPrice(match[2]);
      const discount = parseInt(match[3], 10);
      const store = match[4].trim();

      return {
        cost,
        product: `(sin nombre) ${store}`,
        quantity: 1,
        pricePerKg,
        originalPricePerKg: originalPrice,
        discountPercent: discount,
        store,
        unit: 'kg',
        date,
        isWeighed: true,
        isIncomplete: true
      };
    }

    // ----------------------------------------------------------
    // PATRÓN 3A: Sin precio/kg pero con cantidad y tienda
    // "Pechuga blanca — 1.150 kg [D1]"
    // ----------------------------------------------------------
    match = text.match(/(.+?)\s*[\u2014\-]\s*(\d+[.,]?\d*)\s*(kg|un)\s*\[([^\]]+)\]/i);

    if (match) {
      const product = match[1].trim();
      const quantity = parseFloat(match[2].replace(',', '.'));
      const unit = match[3].toLowerCase() as 'kg' | 'un';
      const store = match[4].trim();
      const pricePerKg = Math.round(cost / quantity);

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        store,
        unit,
        date,
        isWeighed: resolveIsWeighed(product, unit === 'kg'),
        isIncomplete: false
      };
    }

    // ----------------------------------------------------------
    // PATRÓN 3B: Solo tienda, sin cantidad ni precio
    // "Sandia(Patilla) [Carulla]"
    // "Pastillas De Cocoa [D1]"
    // ----------------------------------------------------------
    match = text.match(/^(.+?)\s*\[([^\]]+)\]\s*$/);

    if (match) {
      const product = match[1].trim();
      const store = match[2].trim();
      const isWeighed = resolveIsWeighed(product, false);

      return {
        cost,
        product,
        quantity: 1,
        pricePerKg: cost,
        store,
        unit: isWeighed ? 'kg' : 'un',
        date,
        isWeighed,
        isIncomplete: true
      };
    }

    // ----------------------------------------------------------
    // PATRÓN 4: Formato antiguo sin @ (retrocompatibilidad)
    // "Producto — Xkg a $P/kg"
    // ----------------------------------------------------------
    match = text.match(/(.+?)\s*[\u2014\-]\s*(\d+[.,]?\d*)\s*(kg|un)\s*a?\s*\$?([\d.,]+)/i);

    if (match) {
      const product = match[1].trim();
      const quantity = parseFloat(match[2].replace(',', '.'));
      const unit = match[3].toLowerCase() as 'kg' | 'un';
      const pricePerKg = parseCOPrice(match[4]);

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        unit,
        date,
        isWeighed: resolveIsWeighed(product, unit === 'kg'),
        isIncomplete: false
      };
    }

    // ----------------------------------------------------------
    // PATRÓN 5: "X kg Producto" (peso antes del nombre)
    // "1.150 kg Pechuga blanca"
    // ----------------------------------------------------------
    match = text.match(/^(\d+[.,]?\d*)\s*(kg|un)\s+(.+)/i);

    if (match) {
      const quantity = parseFloat(match[1].replace(',', '.'));
      const unit = match[2].toLowerCase() as 'kg' | 'un';
      const product = match[3].trim();
      const pricePerKg = Math.round(cost / quantity);

      return {
        cost,
        product,
        quantity,
        pricePerKg,
        unit,
        date,
        isWeighed: resolveIsWeighed(product, unit === 'kg'),
        isIncomplete: false
      };
    }

    // ----------------------------------------------------------
    // PATRÓN 6: Solo nombre — dato incompleto
    // "Cebolla junca", "Banano", "Mangos"
    // ----------------------------------------------------------
    const product = text;
    const isWeighed = resolveIsWeighed(product, false);

    return {
      cost,
      product,
      quantity: 1,
      pricePerKg: cost,
      unit: isWeighed ? 'kg' : 'un',
      date,
      isWeighed,
      isIncomplete: true
    };
  } catch (error) {
    console.error('Error parsing product commentary:', error, { commentary, cost });
    return null;
  }
};

// ============================================================
// UTILIDADES DE ANÁLISIS
// ============================================================

/**
 * Encuentra el mejor y peor precio de un producto.
 * Excluye registros incompletos del cálculo de mejor/peor precio.
 */
export const findBestPrice = (
  products: ProductPrice[],
  productName: string
): { best: ProductPrice | null; worst: ProductPrice | null; savings: number } => {
  const complete = products.filter(
    (p) => p.product.toLowerCase().includes(productName.toLowerCase()) && !p.isIncomplete
  );

  if (complete.length === 0) {
    return { best: null, worst: null, savings: 0 };
  }

  const sorted = [...complete].sort((a, b) => a.pricePerKg - b.pricePerKg);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return {
    best,
    worst,
    savings: worst.pricePerKg - best.pricePerKg
  };
};

/**
 * Estadísticas por tienda.
 * Solo considera registros completos para no sesgar el promedio.
 */
export const findCheapestStore = (
  products: ProductPrice[]
): { [store: string]: { count: number; avgPrice: number } } => {
  const stats: { [store: string]: { total: number; count: number } } = {};

  products
    .filter((p) => p.store && !p.isIncomplete)
    .forEach((p) => {
      const s = p.store!;
      if (!stats[s]) stats[s] = { total: 0, count: 0 };
      stats[s].total += p.pricePerKg;
      stats[s].count += 1;
    });

  const result: { [store: string]: { count: number; avgPrice: number } } = {};

  Object.keys(stats).forEach((store) => {
    result[store] = {
      count: stats[store].count,
      avgPrice: Math.round(stats[store].total / stats[store].count)
    };
  });

  return result;
};
