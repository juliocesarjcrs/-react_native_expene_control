import {
  parseRestaurantCommentary,
  getRestaurantStats,
  getDishHistory,
  getEventStats,
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

describe('restaurantParser — eventos (#NombreEvento)', () => {
  test('el tag marca el evento y no es parte del nombre', () => {
    const result = parse('Crepes & Waffles #BurgerMaster');
    expect(result?.restaurant).toBe('Crepes & Waffles');
    expect(result?.event).toEqual({ key: 'burgermaster', label: 'BurgerMaster' });
  });

  test('#BurgerMaster, #burger-master y #Burger_Master son el mismo evento', () => {
    const keys = ['#BurgerMaster', '#burger-master', '#Burger_Master'].map(
      (tag) => parse(`Gurmet ${tag}`)?.event?.key
    );
    expect(new Set(keys)).toEqual(new Set(['burgermaster']));
    expect(parse('Gurmet #burger-master')?.event?.label).toBe('burger master');
  });

  test('las tildes no cuentan en la clave del evento', () => {
    expect(parse('Gurmet #EjeCafeteroGourmét')?.event?.key).toBe('ejecafeterogourmet');
  });

  test('"#4" no es un evento y tampoco queda en el nombre', () => {
    const result = parse('Gustosos #4');
    expect(result?.event).toBeUndefined();
    expect(result?.restaurant).toBe('Gustosos');
  });

  test('el tag puede ir con nota, viáticos y mención', () => {
    const result = parse('Gurmet #PizzaMaster @Silvia viáticos - cumpleaños');
    expect(result?.restaurant).toBe('Gurmet');
    expect(result?.event?.key).toBe('pizzamaster');
    expect(result?.isViaticos).toBe(true);
    expect(result?.mentions).toEqual(['Silvia']);
    expect(result?.note).toBe('cumpleaños');
  });

  test('el tag en otra línea también cuenta, y se quita de los platos', () => {
    const result = parse('Gurmet\nLomo #BurgerMaster — $30.000');
    expect(result?.event?.key).toBe('burgermaster');
    expect(result?.dishes[0].name).toBe('Lomo');
  });

  test('solo el evento: cuenta como evento, sin restaurante', () => {
    const result = parse('#BurgerMaster');
    expect(result).not.toBeNull();
    expect(result?.restaurant).toBe('');
    expect(result?.restaurantKey).toBe('');
    expect(result?.event?.key).toBe('burgermaster');
  });

  test('sin nombre y sin evento sigue siendo null', () => {
    expect(parse('#4')).toBeNull();
    expect(parse('#')).toBeNull();
  });

  describe('estadísticas', () => {
    const a = parse('BurgerLand\nHamburguesa — $30.000', 45_000, '2026-11-06')!;
    const b = parse('Burger Land', 50_000, '2026-11-20')!;
    const ev = parse('BurgerLand #BurgerMaster\nHamburguesa — $20.000', 25_000, '2026-11-25')!;
    const e = parse('BurgerLand\nHamburguesa — $33.000', 50_000, '2026-12-10')!;
    const ev2 = parse('Gurmet #BurgerMaster', 22_000, '2026-11-26')!;
    const onlyEvent = parse('#PizzaMaster', 18_000, '2026-11-28')!;

    test('el promedio usa solo las visitas normales; el total incluye el evento', () => {
      const burger = getRestaurantStats([a, b, ev]).find((s) => s.restaurantKey === 'burgerland')!;
      expect(burger.visits).toBe(3);
      expect(burger.totalCost).toBe(120_000);
      expect(burger.regularVisits).toBe(2);
      expect(burger.regularCost).toBe(95_000);
      expect(burger.eventVisits).toBe(1);
      expect(burger.eventCost).toBe(25_000);
      expect(burger.avgCost).toBe(47_500);
    });

    test('un restaurante visitado solo en eventos tiene promedio 0', () => {
      const gurmet = getRestaurantStats([ev2]).find((s) => s.restaurantKey === 'gurmet')!;
      expect(gurmet.regularVisits).toBe(0);
      expect(gurmet.avgCost).toBe(0);
      expect(gurmet.eventVisits).toBe(1);
    });

    test('el historial de platos excluye los eventos', () => {
      const history = getDishHistory([a, ev, e]);
      expect(history).toHaveLength(1);
      expect(history[0].count).toBe(2);
      expect(history[0].firstPrice).toBe(30_000);
      expect(history[0].lastPrice).toBe(33_000);
      expect(history[0].minPrice).toBe(30_000);
    });

    test('con includeEvents el historial los incluye', () => {
      const history = getDishHistory([a, ev, e], 2, true);
      expect(history[0].count).toBe(3);
      expect(history[0].minPrice).toBe(20_000);
    });

    test('un registro solo con evento no cuenta en ningún restaurante', () => {
      expect(getRestaurantStats([onlyEvent])).toEqual([]);
      expect(getDishHistory([onlyEvent], 1)).toEqual([]);
    });

    test('estadísticas por evento', () => {
      const events = getEventStats([a, ev, ev2, onlyEvent]);
      expect(events.map((x) => x.eventKey)).toEqual(['pizzamaster', 'burgermaster']);

      const burgerMaster = events.find((x) => x.eventKey === 'burgermaster')!;
      expect(burgerMaster.visits).toBe(2);
      expect(burgerMaster.totalCost).toBe(47_000);
      expect(burgerMaster.restaurants).toEqual(['BurgerLand', 'Gurmet']);
      expect(burgerMaster.firstDate).toBe('2026-11-25');
      expect(burgerMaster.lastDate).toBe('2026-11-26');

      const pizzaMaster = events.find((x) => x.eventKey === 'pizzamaster')!;
      expect(pizzaMaster.restaurants).toEqual([]);
    });

    test('sin eventos devuelve lista vacía', () => {
      expect(getEventStats([a, b])).toEqual([]);
    });
  });
});

describe('restaurantParser — visitas sin nombre (la primera línea es un plato)', () => {
  test('una primera línea con precio no es un restaurante', () => {
    expect(parse('Torta chocolate $7.000\nCafé con leche $6.000')).toBeNull();
  });

  test('también con "mil"', () => {
    expect(parse('Torta chocolate 7 mil')).toBeNull();
  });

  test('un $ sin número no cuenta como precio', () => {
    expect(parse('Steak $$ House')?.restaurant).toBe('Steak $$ House');
  });

  test('con evento, cuenta como evento sin restaurante y conserva los platos', () => {
    const result = parse('Torta chocolate $7.000 #Expofuturo\nCafé con leche $6.000');
    expect(result).not.toBeNull();
    expect(result?.restaurant).toBe('');
    expect(result?.restaurantKey).toBe('');
    expect(result?.event?.key).toBe('expofuturo');
    expect(result?.dishes.map((d) => [d.name, d.price])).toEqual([
      ['Torta chocolate', 7000],
      ['Café con leche', 6000]
    ]);
  });

  test('solo el evento en la primera línea y los platos debajo', () => {
    const result = parse('#Expofuturo\nCarne a la llanera $60.000\n2 Limonadas $6.000');
    expect(result?.restaurant).toBe('');
    expect(result?.event?.key).toBe('expofuturo');
    expect(result?.dishes).toHaveLength(2);
  });

  test('un restaurante con nombre normal y platos debajo no cambia', () => {
    const result = parse('Expofuturo\nCarne a la llanera $60.000');
    expect(result?.restaurant).toBe('Expofuturo');
    expect(result?.dishes).toHaveLength(1);
  });

  test('la propina se ignora y no es un plato', () => {
    const result = parse('Sublime Pasta Fresca\nLasagña mixta - $23.500\nPropina $6.000');
    expect(result?.dishes.map((d) => d.name)).toEqual(['Lasagña mixta']);
  });
});
