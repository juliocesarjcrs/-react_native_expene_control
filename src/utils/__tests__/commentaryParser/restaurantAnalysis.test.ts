import {
  buildRestaurantAnalysis,
  getMonthlySummary,
  toDateKey
} from '~/utils/commentaryParser/restaurantAnalysis';

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

  test('cuenta lo recibido, lo leído y lo omitido', () => {
    expect(analysis.expenseCount).toBe(7);
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

  test('el resumen mensual cuenta TODOS los gastos, también los sin comentario', () => {
    const nov = analysis.monthly.find((m) => m.month === '2026-11')!;
    expect(nov.visits).toBe(6);
    expect(nov.days).toBe(6);
  });

  test('sin eventos, el análisis no los reporta', () => {
    expect(analysis.events).toEqual([]);
    expect(analysis.eventVisits).toBe(0);
    expect(analysis.eventCost).toBe(0);
  });

  test('reporta los eventos, incluso los que no traen restaurante', () => {
    const withEvents = buildRestaurantAnalysis([
      { commentary: 'Gurmet #BurgerMaster', cost: 22_000, date: '2026-11-26' },
      { commentary: '#BurgerMaster', cost: 18_000, date: '2026-11-27' },
      { commentary: 'BurgerLand', cost: 40_000, date: '2026-11-28' }
    ]);
    expect(withEvents.events).toHaveLength(1);
    expect(withEvents.eventVisits).toBe(2);
    expect(withEvents.eventCost).toBe(40_000);
    expect(withEvents.records).toHaveLength(3);
    expect(withEvents.stats.map((s) => s.restaurantKey).sort()).toEqual(['burgerland', 'gurmet']);
  });

  test('una lista vacía no rompe', () => {
    const empty = buildRestaurantAnalysis([]);
    expect(empty.expenseCount).toBe(0);
    expect(empty.records).toEqual([]);
    expect(empty.skipped).toBe(0);
    expect(empty.totalCost).toBe(0);
    expect(empty.monthly).toEqual([]);
    expect(empty.events).toEqual([]);
  });
});

describe('getMonthlySummary', () => {
  const lunches = [
    { cost: 20_000, date: '2026-09-03' },
    { cost: 15_000, date: '2026-09-03' }, // mismo día: cuenta un solo día
    { cost: 25_000, date: '2026-09-10' },
    { cost: 30_000, date: '2026-11-02' },
    { cost: 50_000, date: '2026-11-05' }
  ];

  test('días distintos, registros y gasto por mes', () => {
    const [sep] = getMonthlySummary(lunches);
    expect(sep.label).toBe('Sep 2026');
    expect(sep.visits).toBe(3);
    expect(sep.days).toBe(2);
    expect(sep.total).toBe(60_000);
    expect(sep.avgPerDay).toBe(30_000);
  });

  test('rellena con ceros los meses sin registros', () => {
    const months = getMonthlySummary(lunches);
    expect(months.map((m) => m.month)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(months[1]).toMatchObject({ visits: 0, days: 0, total: 0, avgPerDay: 0 });
  });

  test('variación contra el mes anterior (meses completos)', () => {
    const months = getMonthlySummary(lunches, { start: '2026-09-01', end: '2026-11-30' });
    expect(months[0].changePercent).toBeNull(); // no hay mes anterior
    expect(months[1].changePercent).toBe(-100);
    expect(months[1].daysChange).toBe(-2);
    expect(months[2].changePercent).toBeNull(); // el anterior fue 0
    expect(months[2].daysChange).toBe(2);
  });

  test('sube el porcentaje cuando el gasto aumenta', () => {
    const months = getMonthlySummary(
      [
        { cost: 100_000, date: '2026-09-10' },
        { cost: 120_000, date: '2026-10-10' }
      ],
      { start: '2026-09-01', end: '2026-10-31' }
    );
    expect(months[1].changePercent).toBe(20);
    expect(months[1].daysChange).toBe(0);
  });

  test('el primer y el último mes del rango son parciales y no se comparan', () => {
    const months = getMonthlySummary(lunches, { start: '2026-09-15', end: '2026-11-10' });
    expect(months.map((m) => m.isPartial)).toEqual([true, false, true]);
    expect(months[1].changePercent).toBeNull(); // el anterior es parcial
    expect(months[2].changePercent).toBeNull();
    expect(months[2].daysChange).toBeNull();
  });

  test('un rango que termina en el último día del mes no es parcial', () => {
    const months = getMonthlySummary([{ cost: 1, date: '2026-02-10' }], {
      start: '2026-02-01',
      end: '2026-02-28'
    });
    expect(months[0].isPartial).toBe(false);
  });

  test('con rango, un mes sin datos igual aparece', () => {
    const months = getMonthlySummary([], { start: '2026-11-05', end: '2026-12-10' });
    expect(months.map((m) => m.month)).toEqual(['2026-11', '2026-12']);
    expect(months.every((m) => m.visits === 0)).toBe(true);
  });

  test('ignora fechas con formato inválido y acepta ISO con hora', () => {
    const months = getMonthlySummary([
      { cost: 10, date: 'sin fecha' },
      { cost: 20, date: '2026-11-05T00:00:00.000Z' }
    ]);
    expect(months).toHaveLength(1);
    expect(months[0].total).toBe(20);
  });

  test('sin gastos y sin rango devuelve lista vacía', () => {
    expect(getMonthlySummary([])).toEqual([]);
  });
});

describe('toDateKey', () => {
  test('usa la fecha local, no UTC', () => {
    expect(toDateKey(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05');
    expect(toDateKey(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});

describe('buildRestaurantAnalysis — registros reales de prueba', () => {
  const real = [
    {
      cost: 69_000,
      commentary:
        'Sublime Pasta Fresca\nLasagña mixta - $23.500\nCanelones mixtos - $24.500\nJugo Agua - $7.000\nJugo Leche - $8.000\nPropina $6.000',
      date: '2026-11-07'
    },
    {
      cost: 66_000,
      commentary: 'Expofuturo\nCarne a la llanera $60.000\n2 Limonadas $6.000',
      date: '2026-11-07'
    },
    {
      cost: 13_000,
      commentary: 'Torta chocolate $7.000\nCafé con leche $6.000',
      date: '2026-11-07'
    },
    {
      cost: 103_900,
      commentary: 'Cherry Hill Food\nBaby Beef 400 gr $74.000\nJugo Agua $9.900',
      date: '2026-11-08'
    }
  ];
  const result = buildRestaurantAnalysis(real, { start: '2026-11-01', end: '2026-11-09' });

  test('la visita sin nombre no crea un restaurante falso', () => {
    expect(result.stats.map((s) => s.restaurantKey)).toEqual([
      'cherryhillfood',
      'sublimepastafresca',
      'expofuturo'
    ]);
    expect(result.records).toHaveLength(3);
    expect(result.skipped).toBe(1);
  });

  test('la visita sin nombre sí cuenta en el resumen por mes', () => {
    const nov = result.monthly.find((m) => m.month === '2026-11')!;
    expect(nov.visits).toBe(4);
    expect(nov.days).toBe(2);
    expect(nov.total).toBe(251_900);
  });
});

describe('buildRestaurantAnalysis — feria con puestos sin nombre', () => {
  test('los registros con #Evento y sin restaurante cuentan solo como evento', () => {
    const fair = buildRestaurantAnalysis([
      { commentary: '#Expofuturo\nCarne a la llanera $60.000', cost: 66_000, date: '2026-11-07' },
      { commentary: 'Torta $7.000 #Expofuturo', cost: 7_000, date: '2026-11-07' },
      { commentary: '#Expofuturo\nArepa de choclo', cost: 9_000, date: '2026-11-07' }
    ]);
    expect(fair.stats).toEqual([]);
    expect(fair.events).toHaveLength(1);
    expect(fair.events[0].visits).toBe(3);
    expect(fair.events[0].totalCost).toBe(82_000);
    expect(fair.events[0].restaurants).toEqual([]);
  });

  test('un plato SIN precio en la primera línea se lee como nombre de puesto', () => {
    const fair = buildRestaurantAnalysis([
      { commentary: 'Arepa de choclo #Expofuturo', cost: 9_000, date: '2026-11-07' }
    ]);
    expect(fair.stats.map((s) => s.label)).toEqual(['Arepa de choclo']);
    expect(fair.stats[0].regularVisits).toBe(0);
    expect(fair.events[0].restaurants).toEqual(['Arepa de choclo']);
  });
});
