import {
  parseRestaurantCommentary,
  getRestaurantStats,
  getDishHistory,
  getSimilarRestaurants
} from '~/utils/commentaryParser/restaurantParser';

const parse = (commentary: string | null, cost = 50_000, date = '2026-11-06') =>
  parseRestaurantCommentary(commentary, cost, date);

describe('restaurantParser — nombre', () => {
  test('una sola línea es el nombre del restaurante', () => {
    const result = parse('BurgerLand');
    expect(result).not.toBeNull();
    expect(result?.restaurant).toBe('BurgerLand');
    expect(result?.restaurantKey).toBe('burgerland');
    expect(result?.dishes).toEqual([]);
    expect(result?.isViaticos).toBe(false);
  });

  test('"Burger Land" y "BurgerLand" comparten clave; las tildes no cuentan', () => {
    expect(parse('Burger Land')?.restaurantKey).toBe('burgerland');
    expect(parse('Café Ñandú')?.restaurantKey).toBe('cafenandu');
  });

  test('"BurgerLand" y "BurguerLand" NO comparten clave (se avisan aparte)', () => {
    expect(parse('BurguerLand')?.restaurantKey).not.toBe(parse('BurgerLand')?.restaurantKey);
  });

  test('la nota después de " - " no ensucia el nombre', () => {
    const result = parse('Gurmet - cumpleaños de Silvia');
    expect(result?.restaurant).toBe('Gurmet');
    expect(result?.note).toBe('cumpleaños de Silvia');
  });

  test('un guion dentro del nombre sin espacios se conserva', () => {
    expect(parse('Pan-Pa-Ya')?.restaurant).toBe('Pan-Pa-Ya');
  });

  test('soporta saltos de línea de Windows', () => {
    const result = parse('BurgerLand\r\nHamburguesa — $32.000\r\n');
    expect(result?.restaurant).toBe('BurgerLand');
    expect(result?.dishes).toHaveLength(1);
  });
});

describe('restaurantParser — platos', () => {
  test('lee distintos formatos de precio', () => {
    const result = parse(
      [
        'BurgerLand',
        'Hamburguesa — $32.000',
        'Perro - 18.500',
        'Lomo — 52 mil',
        'Jugo $7.500',
        'Postre: 12,000'
      ].join('\n')
    );
    expect(result?.dishes.map((d) => [d.name, d.price])).toEqual([
      ['Hamburguesa', 32000],
      ['Perro', 18500],
      ['Lomo', 52000],
      ['Jugo', 7500],
      ['Postre', 12000]
    ]);
  });

  test('ignora líneas sin precio y las de propina, domicilio y similares', () => {
    const result = parse(
      [
        'BurgerLand',
        'Hamburguesa — $32.000',
        'Propina',
        'Propina — $5.000',
        'Domicilio $3.000',
        'qué rico'
      ].join('\n')
    );
    expect(result?.dishes.map((d) => d.name)).toEqual(['Hamburguesa']);
  });

  test('acepta viñetas y conserva números dentro del nombre del plato', () => {
    const result = parse('Gustosos\n- Bandeja paisa 2 — $45.000');
    expect(result?.dishes[0].name).toBe('Bandeja paisa 2');
    expect(result?.dishes[0].price).toBe(45000);
  });

  test('NO valida que los platos sumen el costo', () => {
    const result = parse('BurgerLand\nHamburguesa — $32.000', 999_999);
    expect(result).not.toBeNull();
    expect(result?.cost).toBe(999_999);
  });

  test('la clave del plato ignora tildes y mayúsculas', () => {
    const a = parse('Gurmet\nPechuga a la Plancha — $30.000');
    const b = parse('Gurmet\npechuga a la plancha — $32.000');
    expect(a?.dishes[0].key).toBe(b?.dishes[0].key);
  });
});

describe('restaurantParser — viáticos y menciones', () => {
  test('@Silvia viáticos en la primera línea', () => {
    const result = parse('Gustosos @Silvia viáticos');
    expect(result?.restaurant).toBe('Gustosos');
    expect(result?.isViaticos).toBe(true);
    expect(result?.mentions).toEqual(['Silvia']);
  });

  test('viáticos en otra línea también cuenta, y no genera platos', () => {
    const result = parse('Gustosos\n@Silvia viáticos');
    expect(result?.isViaticos).toBe(true);
    expect(result?.dishes).toEqual([]);
  });

  test('sin la palabra viáticos, una mención no marca viáticos', () => {
    const result = parse('Gustosos @Silvia');
    expect(result?.isViaticos).toBe(false);
    expect(result?.mentions).toEqual(['Silvia']);
  });

  test('una primera línea que solo trae la mención no es un restaurante', () => {
    expect(parse('@Silvia viáticos')).toBeNull();
  });
});

describe('restaurantParser — rechazos', () => {
  test.each([
    ['vacío', ''],
    ['solo espacios', '   \n  '],
    ['formato de producto con tienda', 'Pastel — 1 un @ $3.000 [Carulla]'],
    ['producto con tienda y sin precio', 'Pastel Hawaiano [D1]'],
    ['producto con peso en kg', 'Pechuga — 0,500 kg @ $20.900/kg'],
    ['solo un número', '12345']
  ])('rechaza: %s', (_label, commentary) => {
    expect(parse(commentary)).toBeNull();
  });

  test('null y undefined no rompen', () => {
    expect(parse(null)).toBeNull();
    expect(parseRestaurantCommentary(undefined, 1, '2026-11-06')).toBeNull();
  });

  test('el ejemplo del registry se parsea', () => {
    expect(parse('BurgerLand\nHamburguesa — $32.000')).toBeTruthy();
  });
});

describe('restaurantParser — estadísticas', () => {
  const a = parse('BurgerLand\nHamburguesa — $30.000', 45_000, '2026-11-06')!;
  const b = parse('Burger Land', 52_000, '2026-11-20')!;
  const c = parse('BurguerLand\nHamburguesa — $33.000', 48_000, '2026-12-04')!;
  const d = parse('Gustosos @Silvia viáticos', 28_000, '2026-11-12')!;
  const e = parse('BurgerLand\nHamburguesa — $33.000', 50_000, '2026-12-10')!;

  test('agrupa por clave y ordena por gasto', () => {
    const stats = getRestaurantStats([a, b, c, d]);
    expect(stats.map((s) => s.restaurantKey)).toEqual(['burgerland', 'burguerland', 'gustosos']);

    const burger = stats[0];
    expect(burger.visits).toBe(2);
    expect(burger.totalCost).toBe(97_000);
    expect(burger.avgCost).toBe(48_500);
    expect(burger.firstDate).toBe('2026-11-06');
    expect(burger.lastDate).toBe('2026-11-20');
    expect(burger.lastCost).toBe(52_000);
    expect(burger.variants.sort()).toEqual(['Burger Land', 'BurgerLand']);
  });

  test('suma los viáticos aparte', () => {
    const gustosos = getRestaurantStats([a, d]).find((s) => s.restaurantKey === 'gustosos')!;
    expect(gustosos.viaticosVisits).toBe(1);
    expect(gustosos.viaticosCost).toBe(28_000);
  });

  test('la grafía más usada es la etiqueta', () => {
    const stats = getRestaurantStats([a, a, b]);
    expect(stats[0].label).toBe('BurgerLand');
  });

  test('historial de un plato: variación de precio en el mismo restaurante', () => {
    const history = getDishHistory([a, e]);
    expect(history).toHaveLength(1);
    expect(history[0].count).toBe(2);
    expect(history[0].firstPrice).toBe(30_000);
    expect(history[0].lastPrice).toBe(33_000);
    expect(history[0].change).toBe(3_000);
    expect(history[0].changePercent).toBe(10);
  });

  test('un plato con un solo registro no sale (minCount 2)', () => {
    expect(getDishHistory([a, c])).toEqual([]);
    expect(getDishHistory([a, c], 1)).toHaveLength(2);
  });

  test('avisa nombres casi iguales y no avisa los distintos', () => {
    const pairs = getSimilarRestaurants(getRestaurantStats([a, c, d]));
    expect(pairs).toHaveLength(1);
    expect([pairs[0].keyA, pairs[0].keyB].sort()).toEqual(['burgerland', 'burguerland']);
    expect(pairs[0].distance).toBe(1);
  });

  test('Gurmet / Gourmet se detectan como posibles duplicados', () => {
    const g1 = parse('Gurmet', 30_000)!;
    const g2 = parse('Gourmet', 30_000)!;
    expect(getSimilarRestaurants(getRestaurantStats([g1, g2]))).toHaveLength(1);
  });

  test('listas vacías no rompen', () => {
    expect(getRestaurantStats([])).toEqual([]);
    expect(getDishHistory([])).toEqual([]);
    expect(getSimilarRestaurants([])).toEqual([]);
  });
});
