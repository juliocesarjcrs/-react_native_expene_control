/**
 * Parser de comentarios de restaurantes
 * Ubicación: src/utils/commentaryParser/restaurantParser.ts
 *
 * Aplica a: Salidas a comer, Comida lista y Almuerzo comprado.
 *
 * Formato:
 *   Primera línea:  Nombre del restaurante [@Persona] [viáticos] [- nota]
 *   Siguientes (opcionales):  plato — $precio
 *
 * Ejemplos:
 *   "Crepes & Waffles"
 *   "Crepes & Waffles\Pollo al Curry — $32.000\nPropina"
 *   "Gustosos @Silvia viáticos"
 *   "Gurmet - cumpleaños\nLomo — 52 mil"
 *
 * Reglas:
 *   - Solo la primera línea es el nombre. "Burger Land" y "BurgerLand" comparten clave.
 *   - Un plato es una línea con precio ("— $32.000", "— 32.000", "— 52 mil", "$32.000").
 *     Las líneas sin precio (propina, domicilio, notas) se ignoran, y las que
 *     empiezan por propina/domicilio/servicio/iva/descuento/total no cuentan como plato.
 *   - NO valida que los platos sumen el costo: no se anotan propinas ni todos los platos.
 *   - Rechaza el formato de producto del OCR ("[Tienda]", "@ $", "1 un"/"kg" en la
 *     primera línea), para no leer "Pastel — 1 un @ $3.000 [Carulla]" como restaurante.
 *   - Sin fecha de corte: el rango lo elige la pantalla. Los comentarios viejos que no
 *     sigan la convención se leen como "restaurante" con su primera línea completa.
 */

import {
  RestaurantData,
  RestaurantDish,
  RestaurantDishEntry,
  RestaurantDishHistory,
  RestaurantSimilarPair,
  RestaurantStats
} from '~/shared/types/utils/commentaryParser/restaurant-analysis.types';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const collapseSpaces = (text: string): string => text.replace(/\s+/g, ' ').trim();

const capitalizeName = (name: string): string =>
  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

const toTime = (date: string): number => new Date(date).getTime();

/** "Burger Land" y "BurgerLand" → "burgerland" */
const toRestaurantKey = (name: string): string => {
  const alnum = normalizeText(name).replace(/[^a-z0-9]/g, '');
  return alnum || normalizeText(name);
};

const toDishKey = (name: string): string =>
  collapseSpaces(normalizeText(name).replace(/[^a-z0-9 ]/g, ' '));

// ─────────────────────────────────────────────
// PATRONES
// ─────────────────────────────────────────────

const PATTERNS = {
  /** "@Silvia" (global: solo se usa con replace / matchAll) */
  mention: /@([A-Za-zÀ-ÿ]+)/g,
  /** "viáticos" / "viaticos" / "viático" (global: solo con replace) */
  viaticosStrip: /vi[aá]ticos?/gi,
  viaticosTest: /vi[aá]ticos?/i,
  /** Guion con espacios: separa la nota de la primera línea */
  noteSeparator: /\s[-–—]\s/,
  /** "[Carulla]": etiqueta de tienda del formato de producto */
  storeTag: /\[[^\]]+\]/,
  /** "@ $3.000": precio del formato de producto (no confundir con "@Silvia") */
  atPrice: /@\s*\$/,
  /** "1 un", "0,5 kg" */
  quantity: /\d+[.,]?\d*\s*(?:kg|un)\b/i,
  /** "plato — $32.000", "plato - 32.000", "plato: 52 mil" */
  dashPrice: /^(.+?)\s*(?:[—–:]|\s-\s)\s*\$?\s*(\d[\d.,]*)\s*(mil|k)?\s*$/i,
  /** "plato $32.000" */
  dollarPrice: /^(.+?)\s+\$\s*(\d[\d.,]*)\s*(mil|k)?\s*$/i,
  bullet: /^[-•*]\s+/
};

const IGNORED_ITEMS =
  /^(propina|domicilio|servicio|iva|impoconsumo|descuento|envio|total|subtotal|cubierto)\b/;

/**
 * Precio colombiano a entero.
 *   "32.000" → 32000 · "32,000" → 32000 · "1.234,56" → 1235 · "52" + "mil" → 52000
 */
const parsePrice = (raw: string, suffix?: string): number | null => {
  const clean = raw.replace(/[.,]+$/, '');
  if (!clean) return null;

  let value: number;
  if (suffix) {
    value = parseFloat(clean.replace(',', '.')) * 1000;
  } else if (clean.includes('.') && clean.includes(',')) {
    value = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
  } else if (/^\d{1,3}([.,]\d{3})+$/.test(clean)) {
    value = parseInt(clean.replace(/[.,]/g, ''), 10);
  } else {
    value = parseFloat(clean.replace(',', '.'));
  }

  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
};

// ─────────────────────────────────────────────
// PARSER PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Parsea el comentario de una salida a comer / comida lista / almuerzo comprado.
 * Retorna null si está vacío, si tiene formato de producto, o si no hay nombre usable.
 */
export const parseRestaurantCommentary = (
  commentary: string | null | undefined,
  cost: number,
  date: string
): RestaurantData | null => {
  if (!commentary?.trim()) return null;

  try {
    const lines = commentary
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return null;

    const fullText = lines.join('\n');
    const header = lines[0];

    // Formato de producto del OCR: no es un restaurante
    if (
      PATTERNS.storeTag.test(fullText) ||
      PATTERNS.atPrice.test(fullText) ||
      PATTERNS.quantity.test(header)
    ) {
      return null;
    }

    // ── Menciones y viáticos (en cualquier línea) ──────────────────────
    const mentions = [
      ...new Set([...fullText.matchAll(PATTERNS.mention)].map((m) => capitalizeName(m[1])))
    ];
    const isViaticos = PATTERNS.viaticosTest.test(fullText);

    // ── Nombre: primera línea sin menciones, viáticos ni nota ──────────
    const [bodyRaw, ...noteParts] = header.split(PATTERNS.noteSeparator);
    const note = noteParts.join(' - ').trim() || undefined;

    const restaurant = collapseSpaces(
      bodyRaw.replace(PATTERNS.mention, ' ').replace(PATTERNS.viaticosStrip, ' ')
    ).replace(/^[\s.,;:]+|[\s.,;:]+$/g, '');

    if (restaurant.length < 2 || /^\d+$/.test(restaurant)) return null;

    const restaurantKey = toRestaurantKey(restaurant);
    if (!restaurantKey) return null;

    // ── Platos: líneas siguientes con precio ────────────────────────────
    const dishes: RestaurantDish[] = [];
    for (const raw of lines.slice(1)) {
      const line = collapseSpaces(
        raw
          .replace(PATTERNS.bullet, '')
          .replace(PATTERNS.mention, ' ')
          .replace(PATTERNS.viaticosStrip, ' ')
      );
      if (!line) continue;
      if (IGNORED_ITEMS.test(normalizeText(line))) continue;

      const match = line.match(PATTERNS.dashPrice) ?? line.match(PATTERNS.dollarPrice);
      if (!match) continue;

      const name = collapseSpaces(match[1]);
      const price = parsePrice(match[2], match[3]);
      const key = toDishKey(name);
      if (!name || !key || price === null) continue;

      dishes.push({ name, key, price });
    }

    return { cost, date, restaurant, restaurantKey, dishes, mentions, isViaticos, note };
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// CALCULADORAS
// ─────────────────────────────────────────────

/** Grafía más frecuente; en empate, la del registro más reciente. */
const pickLabel = (items: RestaurantData[]): string => {
  const counts = new Map<string, { count: number; latest: number }>();
  for (const item of items) {
    const entry = counts.get(item.restaurant) ?? { count: 0, latest: 0 };
    entry.count += 1;
    entry.latest = Math.max(entry.latest, toTime(item.date));
    counts.set(item.restaurant, entry);
  }
  return [...counts.entries()].sort(
    (a, b) => b[1].count - a[1].count || b[1].latest - a[1].latest
  )[0][0];
};

const groupByRestaurant = (data: RestaurantData[]): Map<string, RestaurantData[]> => {
  const groups = new Map<string, RestaurantData[]>();
  for (const item of data) {
    const list = groups.get(item.restaurantKey);
    if (list) list.push(item);
    else groups.set(item.restaurantKey, [item]);
  }
  return groups;
};

/** Visitas y gasto por restaurante, de mayor a menor gasto. */
export const getRestaurantStats = (data: RestaurantData[]): RestaurantStats[] => {
  const result: RestaurantStats[] = [];

  groupByRestaurant(data).forEach((items, restaurantKey) => {
    const sorted = [...items].sort((a, b) => toTime(a.date) - toTime(b.date));
    const totalCost = sorted.reduce((sum, i) => sum + i.cost, 0);
    const viaticos = sorted.filter((i) => i.isViaticos);
    const last = sorted[sorted.length - 1];

    result.push({
      restaurantKey,
      label: pickLabel(items),
      variants: [...new Set(items.map((i) => i.restaurant))],
      visits: sorted.length,
      totalCost,
      avgCost: Math.round(totalCost / sorted.length),
      firstDate: sorted[0].date,
      lastDate: last.date,
      lastCost: last.cost,
      viaticosVisits: viaticos.length,
      viaticosCost: viaticos.reduce((sum, i) => sum + i.cost, 0)
    });
  });

  return result.sort((a, b) => b.totalCost - a.totalCost || b.visits - a.visits);
};

/**
 * Evolución del precio de un mismo plato en un mismo restaurante.
 * Solo devuelve platos con `minCount` registros o más (por defecto 2).
 */
export const getDishHistory = (data: RestaurantData[], minCount = 2): RestaurantDishHistory[] => {
  const labels = new Map<string, string>();
  const groups = new Map<
    string,
    {
      restaurantKey: string;
      dishKey: string;
      dishLabel: string;
      entries: (RestaurantDishEntry & { time: number })[];
    }
  >();

  groupByRestaurant(data).forEach((items, key) => labels.set(key, pickLabel(items)));

  for (const item of data) {
    for (const dish of item.dishes) {
      const groupKey = `${item.restaurantKey}::${dish.key}`;
      const group = groups.get(groupKey) ?? {
        restaurantKey: item.restaurantKey,
        dishKey: dish.key,
        dishLabel: dish.name,
        entries: []
      };
      group.entries.push({ date: item.date, price: dish.price, time: toTime(item.date) });
      group.dishLabel = dish.name;
      groups.set(groupKey, group);
    }
  }

  const result: RestaurantDishHistory[] = [];
  groups.forEach((group) => {
    if (group.entries.length < minCount) return;

    const entries = [...group.entries]
      .sort((a, b) => a.time - b.time)
      .map(({ date, price }) => ({ date, price }));
    const prices = entries.map((e) => e.price);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];

    result.push({
      restaurantKey: group.restaurantKey,
      restaurantLabel: labels.get(group.restaurantKey) ?? group.restaurantKey,
      dishKey: group.dishKey,
      dishLabel: group.dishLabel,
      entries,
      count: entries.length,
      firstPrice,
      lastPrice,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      change: lastPrice - firstPrice,
      changePercent: Math.round(((lastPrice - firstPrice) / firstPrice) * 1000) / 10
    });
  });

  return result.sort(
    (a, b) => b.count - a.count || a.restaurantLabel.localeCompare(b.restaurantLabel)
  );
};

// ── Posibles duplicados (solo informativo) ───────────────────────────────

const levenshtein = (a: string, b: string): number => {
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
};

/**
 * Pares de restaurantes con nombre casi igual (BurgerLand / BurguerLand).
 * Distancia ≤ 1 en nombres cortos y ≤ 2 en nombres de 8+ letras. Ignora nombres de
 * menos de 4 letras. No fusiona nada: el usuario corrige editando el comentario.
 */
export const getSimilarRestaurants = (stats: RestaurantStats[]): RestaurantSimilarPair[] => {
  const pairs: RestaurantSimilarPair[] = [];

  for (let i = 0; i < stats.length; i++) {
    for (let j = i + 1; j < stats.length; j++) {
      const a = stats[i];
      const b = stats[j];
      const minLength = Math.min(a.restaurantKey.length, b.restaurantKey.length);
      if (minLength < 4) continue;

      const distance = levenshtein(a.restaurantKey, b.restaurantKey);
      const threshold = minLength >= 8 ? 2 : 1;
      if (distance === 0 || distance > threshold) continue;

      pairs.push({
        keyA: a.restaurantKey,
        labelA: a.label,
        visitsA: a.visits,
        keyB: b.restaurantKey,
        labelB: b.label,
        visitsB: b.visits,
        distance
      });
    }
  }

  return pairs.sort(
    (x, y) => x.distance - y.distance || y.visitsA + y.visitsB - (x.visitsA + x.visitsB)
  );
};
