/**
 * Tipos del análisis de restaurantes
 * Ubicación: src/shared/types/utils/commentaryParser/restaurant-analysis.types.ts
 */

/** Un plato con precio dentro del comentario ("Hamburguesa — $32.000"). */
export interface RestaurantDish {
  /** Nombre tal como se escribió */
  name: string;
  /** Nombre normalizado (minúsculas, sin tildes ni signos) para agrupar */
  key: string;
  /** Precio del plato en pesos */
  price: number;
}

/** Evento gastronómico marcado con #NombreEvento (Burger Master, Pizza Master...). */
export interface RestaurantEvent {
  /** Normalizado, sin espacios ni signos: "#Burger-Master" y "#burgermaster" comparten clave */
  key: string;
  /** Como se escribió, con guiones y guiones bajos convertidos en espacios */
  label: string;
}

/** Resultado de parsear un comentario de Salidas a comer / Comida lista / Almuerzo comprado. */
export interface RestaurantData {
  cost: number;
  date: string;
  /**
   * Nombre del restaurante tal como se escribió en la primera línea.
   * Vacío ('') si solo se escribió el evento (ej. "#BurgerMaster").
   */
  restaurant: string;
  /** Nombre normalizado, sin espacios: "Burger Land" y "BurgerLand" comparten clave. '' si no hay nombre. */
  restaurantKey: string;
  /** Platos con precio (líneas siguientes). Vacío si no hay ninguno. */
  dishes: RestaurantDish[];
  /** Personas mencionadas con @ (ej. ["Silvia"]) */
  mentions: string[];
  /** true si el comentario dice "viáticos" (almuerzo de una jornada de Silvia) */
  isViaticos: boolean;
  /** Evento gastronómico (primer #tag con letras). Sus precios no se comparan con los normales. */
  event?: RestaurantEvent;
  /** Texto después de " - " en la primera línea */
  note?: string;
}

export interface RestaurantStats {
  restaurantKey: string;
  /** Grafía más usada (en empate, la más reciente) */
  label: string;
  /** Todas las grafías distintas encontradas */
  variants: string[];
  /** Todas las visitas, con o sin evento */
  visits: number;
  totalCost: number;
  /** Promedio de las visitas normales (sin evento). 0 si solo hubo eventos. */
  avgCost: number;
  regularVisits: number;
  regularCost: number;
  eventVisits: number;
  eventCost: number;
  firstDate: string;
  lastDate: string;
  lastCost: number;
  viaticosVisits: number;
  viaticosCost: number;
}

export interface RestaurantEventStats {
  eventKey: string;
  label: string;
  visits: number;
  totalCost: number;
  /** Restaurantes distintos probados en el evento (sin repetir) */
  restaurants: string[];
  firstDate: string;
  lastDate: string;
}

export interface RestaurantDishEntry {
  date: string;
  price: number;
}

/** Evolución del precio de un mismo plato en un mismo restaurante. */
export interface RestaurantDishHistory {
  restaurantKey: string;
  restaurantLabel: string;
  dishKey: string;
  dishLabel: string;
  entries: RestaurantDishEntry[];
  count: number;
  firstPrice: number;
  lastPrice: number;
  minPrice: number;
  maxPrice: number;
  /** lastPrice - firstPrice */
  change: number;
  /** Variación porcentual del primero al último, con un decimal */
  changePercent: number;
}

/** Dos nombres de restaurante casi iguales (posible error de digitación). Solo informativo. */
export interface RestaurantSimilarPair {
  keyA: string;
  labelA: string;
  visitsA: number;
  keyB: string;
  labelB: string;
  visitsB: number;
  distance: number;
}
