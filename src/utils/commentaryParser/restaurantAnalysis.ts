/**
 * Análisis de restaurantes sobre una lista de gastos
 * Ubicación: src/utils/commentaryParser/restaurantAnalysis.ts
 *
 * Une el parser y las calculadoras para que el hook de la pantalla solo tenga que
 * traer los gastos. Es lógica pura (sin React ni servicios), por eso tiene tests.
 */

import {
  RestaurantData,
  RestaurantDishHistory,
  RestaurantSimilarPair,
  RestaurantStats
} from '~/shared/types/utils/commentaryParser/restaurant-analysis.types';
import {
  getDishHistory,
  getRestaurantStats,
  getSimilarRestaurants,
  parseRestaurantCommentary
} from './restaurantParser';

/** Lo mínimo que necesita el análisis de cada gasto. */
export interface RestaurantExpenseInput {
  commentary: string | null;
  cost: number;
  date: string;
}

export interface RestaurantAnalysis {
  /** Gastos que se leyeron como restaurante */
  records: RestaurantData[];
  /** Gastos recibidos que NO se leyeron (vacíos o con formato de producto) */
  skipped: number;
  stats: RestaurantStats[];
  dishHistory: RestaurantDishHistory[];
  similar: RestaurantSimilarPair[];
  totalCost: number;
  viaticosVisits: number;
  viaticosCost: number;
}

export const buildRestaurantAnalysis = (expenses: RestaurantExpenseInput[]): RestaurantAnalysis => {
  const records = expenses
    .map((e) => parseRestaurantCommentary(e.commentary, e.cost, e.date))
    .filter((r): r is RestaurantData => r !== null);

  const stats = getRestaurantStats(records);
  const viaticos = records.filter((r) => r.isViaticos);

  return {
    records,
    skipped: expenses.length - records.length,
    stats,
    dishHistory: getDishHistory(records),
    similar: getSimilarRestaurants(stats),
    totalCost: records.reduce((sum, r) => sum + r.cost, 0),
    viaticosVisits: viaticos.length,
    viaticosCost: viaticos.reduce((sum, r) => sum + r.cost, 0)
  };
};
