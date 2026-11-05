import { buildRestaurantAnalysis } from '~/utils/commentaryParser/restaurantAnalysis';

const expenses = [
  { commentary: 'BurgerLand\nHamburguesa — $30.000', cost: 45_000, date: '2026-11-06' },
  { commentary: 'Burger Land\nHamburguesa — $33.000', cost: 50_000, date: '2026-11-20' },
  { commentary: 'BurguerLand', cost: 40_000, date: '2026-12-01' },
  { commentary: 'Gustosos @Silvia viáticos', cost: 28_000, date: '2026-11-12' },
  { commentary: 'Pastel — 1 un @ $3.000 [Carulla]', cost: 3_000, date: '2026-11-13' },
  { commentary: null, cost: 9_000, date: '2026-11-14' },
  { commentary: '   ', cost: 9_000, date: '2026-11-15' }
];

describe('buildRestaurantAnalysis', () => {
  const analysis = buildRestaurantAnalysis(expenses);

  test('cuenta lo leído y lo omitido', () => {
    expect(analysis.records).toHaveLength(4);
    expect(analysis.skipped).toBe(3);
  });

  test('totales y viáticos', () => {
    expect(analysis.totalCost).toBe(45_000 + 50_000 + 40_000 + 28_000);
    expect(analysis.viaticosVisits).toBe(1);
    expect(analysis.viaticosCost).toBe(28_000);
  });

  test('agrupa por restaurante y ordena por gasto', () => {
    expect(analysis.stats.map((s) => [s.restaurantKey, s.visits])).toEqual([
      ['burgerland', 2],
      ['burguerland', 1],
      ['gustosos', 1]
    ]);
  });

  test('historial de platos del mismo restaurante', () => {
    expect(analysis.dishHistory).toHaveLength(1);
    expect(analysis.dishHistory[0].changePercent).toBe(10);
  });

  test('avisa BurgerLand / BurguerLand como posibles duplicados', () => {
    expect(analysis.similar).toHaveLength(1);
    expect(analysis.similar[0].distance).toBe(1);
  });

  test('una lista vacía no rompe', () => {
    const empty = buildRestaurantAnalysis([]);
    expect(empty.records).toEqual([]);
    expect(empty.skipped).toBe(0);
    expect(empty.totalCost).toBe(0);
  });
});
