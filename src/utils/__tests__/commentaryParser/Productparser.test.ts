import {
  parseProductCommentary,
  findBestPrice,
  findCheapestStore
} from '~/utils/commentaryParser/productParser';
describe('productParser', () => {
  // ============================================================
  // PATRÓN 1: Completo con descuento
  // ============================================================
  describe('Patrón 1: Completo con descuento', () => {
    test('debe parsear producto pesado con coma decimal', () => {
      const result = parseProductCommentary(
        'Limón Mandarino — 0,180 kg @ $5.840/kg (antes $7.000/kg, -20%) [Carulla]',
        1051,
        '2026-02-28'
      );

      expect(result).not.toBeNull();
      expect(result?.product).toBe('Limón Mandarino');
      expect(result?.quantity).toBe(0.18);
      expect(result?.unit).toBe('kg');
      expect(result?.pricePerKg).toBe(5840);
      expect(result?.originalPricePerKg).toBe(7000);
      expect(result?.discountPercent).toBe(20);
      expect(result?.store).toBe('Carulla');
      expect(result?.isWeighed).toBe(true);
      expect(result?.isIncomplete).toBe(false);
    });

    test('debe parsear producto pesado con punto decimal', () => {
      const result = parseProductCommentary(
        'Papaya — 1.545 kg @ $3.344/kg (antes $4.180/kg, -20%) [Carulla]',
        5166,
        '2026-02-28'
      );

      expect(result).not.toBeNull();
      expect(result?.quantity).toBe(1.545);
      expect(result?.pricePerKg).toBe(3344);
    });

    test('debe parsear producto por unidad con descuento', () => {
      const result = parseProductCommentary(
        'Yogurt Semidesc — 1 un @ $1.953 (antes $2.790, -30%) [Carulla]',
        1953,
        '2026-02-28'
      );

      expect(result).not.toBeNull();
      expect(result?.product).toBe('Yogurt Semidesc');
      expect(result?.quantity).toBe(1);
      expect(result?.unit).toBe('un');
      expect(result?.pricePerKg).toBe(1953);
      expect(result?.originalPricePerKg).toBe(2790);
      expect(result?.discountPercent).toBe(30);
      expect(result?.isWeighed).toBe(false);
      expect(result?.isIncomplete).toBe(false);
    });

    test('debe parsear con precio usando punto de miles', () => {
      const result = parseProductCommentary(
        'Fettuccine — 1 un @ $5.610 (antes $9.350, -40%) [Carulla]',
        5610,
        '2026-02-28'
      );

      expect(result?.pricePerKg).toBe(5610);
      expect(result?.originalPricePerKg).toBe(9350);
    });

    test('debe parsear con precio usando coma de miles', () => {
      const result = parseProductCommentary(
        'Producto — 1 un @ $25,400 (antes $30,000, -15%) [Tienda]',
        25400,
        '2026-02-28'
      );

      expect(result?.pricePerKg).toBe(25400);
      expect(result?.originalPricePerKg).toBe(30000);
    });
  });

  // ============================================================
  // PATRÓN 2: Completo sin descuento
  // ============================================================
  describe('Patrón 2: Completo sin descuento', () => {
    test('debe parsear producto pesado sin descuento', () => {
      const result = parseProductCommentary(
        'Limón Tahití — 1,280 kg @ $1.980/kg [Carulla]',
        2534,
        '2026-02-28'
      );

      expect(result).not.toBeNull();
      expect(result?.product).toBe('Limón Tahití');
      expect(result?.quantity).toBe(1.28);
      expect(result?.pricePerKg).toBe(1980);
      expect(result?.unit).toBe('kg');
      expect(result?.discountPercent).toBeUndefined();
      expect(result?.originalPricePerKg).toBeUndefined();
      expect(result?.isIncomplete).toBe(false);
    });

    test('debe parsear producto por unidad sin descuento', () => {
      const result = parseProductCommentary(
        'Polvo Hornear — 1 un @ $5.600 [Carulla]',
        5600,
        '2026-02-28'
      );

      expect(result?.quantity).toBe(1);
      expect(result?.unit).toBe('un');
      expect(result?.pricePerKg).toBe(5600);
      expect(result?.isWeighed).toBe(false);
    });

    test('debe parsear cantidad con coma decimal', () => {
      const result = parseProductCommentary(
        'Banano — 1,245 kg @ $3.360/kg [Carulla]',
        4183,
        '2026-02-28'
      );

      expect(result?.quantity).toBe(1.245);
    });
  });

  // ============================================================
  // PATRÓN 2B: Completo sin descuento SIN tienda
  // ============================================================
  describe('Patrón 2B: Completo sin descuento SIN tienda', () => {
    test('debe parsear producto con @ pero sin tienda', () => {
      const result = parseProductCommentary(
        'Cadera Corriente — 0.525 kg @ $30.158/kg',
        15833,
        '2026-02-07'
      );

      expect(result).not.toBeNull();
      expect(result?.product).toBe('Cadera Corriente');
      expect(result?.quantity).toBe(0.525);
      expect(result?.pricePerKg).toBe(30158);
      expect(result?.unit).toBe('kg');
      expect(result?.store).toBeUndefined();
      expect(result?.isIncomplete).toBe(false);
    });

    test('debe parsear producto por unidad sin tienda', () => {
      const result = parseProductCommentary('Yogurt Natural — 1 un @ $3.500', 3500, '2026-02-07');

      expect(result).not.toBeNull();
      expect(result?.product).toBe('Yogurt Natural');
      expect(result?.quantity).toBe(1);
      expect(result?.unit).toBe('un');
      expect(result?.pricePerKg).toBe(3500);
      expect(result?.store).toBeUndefined();
    });
  });

  // ============================================================
  // PATRÓN 4B: Formato antiguo "a" CON tienda
  // ============================================================
  describe('Patrón 4B: Formato antiguo "a" CON tienda', () => {
    test('debe parsear formato antiguo "a" con tienda', () => {
      const result = parseProductCommentary(
        'Tilapia — 0.39 kg a $20.000/kg [SuperCarnesJH]',
        7800,
        '2026-02-03'
      );

      expect(result).not.toBeNull();
      expect(result?.product).toBe('Tilapia');
      expect(result?.quantity).toBe(0.39);
      expect(result?.pricePerKg).toBe(20000);
      expect(result?.unit).toBe('kg');
      expect(result?.store).toBe('SuperCarnesJH');
      expect(result?.isIncomplete).toBe(false);
    });

    test('debe parsear con cantidad punto decimal y tienda', () => {
      const result = parseProductCommentary(
        'Pechuga Blanca — 1.27 kg a $18.000/kg [Carulla]',
        22860,
        '2026-02-03'
      );

      expect(result).not.toBeNull();
      expect(result?.quantity).toBe(1.27);
      expect(result?.pricePerKg).toBe(18000);
      expect(result?.store).toBe('Carulla');
    });

    test('debe parsear con cantidad coma decimal y tienda', () => {
      const result = parseProductCommentary(
        'Salmón — 0,5 kg a $35.000/kg [Pescadería]',
        17500,
        '2026-02-03'
      );

      expect(result).not.toBeNull();
      expect(result?.quantity).toBe(0.5);
      expect(result?.pricePerKg).toBe(35000);
      expect(result?.store).toBe('Pescadería');
    });
  });

  // ============================================================
  // PATRÓN 3A: Con cantidad pero sin precio/kg (calculado)
  // ============================================================
  describe('Patrón 3A: Con cantidad, sin precio/kg', () => {
    test('debe calcular precio/kg desde costo total', () => {
      const result = parseProductCommentary('Tomate — 0,5 kg [D1]', 2500, '2026-02-28');

      expect(result).not.toBeNull();
      expect(result?.product).toBe('Tomate');
      expect(result?.quantity).toBe(0.5);
      expect(result?.pricePerKg).toBe(5000); // 2500 / 0.5
      expect(result?.isIncomplete).toBe(false);
    });
  });

  // ============================================================
  // PATRÓN 3B: Solo tienda (incompleto)
  // ============================================================
  describe('Patrón 3B: Solo tienda', () => {
    test('debe marcar como incompleto productos solo con tienda', () => {
      const result = parseProductCommentary('Salchicha Par [D1]', 8990, '2026-02-28');

      expect(result).not.toBeNull();
      expect(result?.product).toBe('Salchicha Par');
      expect(result?.store).toBe('D1');
      expect(result?.quantity).toBe(1);
      expect(result?.pricePerKg).toBe(8990);
      expect(result?.isIncomplete).toBe(true);
    });

    test('debe parsear nombres con espacios', () => {
      const result = parseProductCommentary('Esparcible Aj [D1]', 5490, '2026-02-28');

      expect(result?.product).toBe('Esparcible Aj');
      expect(result?.store).toBe('D1');
    });

    test('debe parsear tiendas de 3 letras', () => {
      const result = parseProductCommentary('Azucar Moren [Ara]', 4150, '2026-03-02');

      expect(result?.store).toBe('Ara');
    });
  });

  // ============================================================
  // PATRÓN 6: Solo nombre (incompleto)
  // ============================================================
  describe('Patrón 6: Solo nombre', () => {
    test('debe marcar como incompleto productos sin formato', () => {
      const result = parseProductCommentary('Banano y pitaya', 2500, '2026-03-01');

      expect(result).not.toBeNull();
      expect(result?.product).toBe('Banano y pitaya');
      expect(result?.quantity).toBe(1);
      expect(result?.pricePerKg).toBe(2500);
      expect(result?.isIncomplete).toBe(true);
      expect(result?.store).toBeUndefined();
    });

    test('debe inferir isWeighed desde catálogo', () => {
      const result = parseProductCommentary('Papa', 2000, '2026-03-01');

      expect(result?.isWeighed).toBe(true); // Papa está en catálogo
      expect(result?.unit).toBe('kg');
    });

    test('debe inferir producto no pesado si no está en catálogo', () => {
      const result = parseProductCommentary('Galletas Saladas', 3500, '2026-03-01');

      expect(result?.isWeighed).toBe(false);
      expect(result?.unit).toBe('un');
    });
  });

  // ============================================================
  // CASOS EDGE
  // ============================================================
  describe('Casos edge', () => {
    test('debe manejar nombres con tildes', () => {
      const result = parseProductCommentary(
        'Limón Tahití — 1,5 kg @ $2.000/kg [Carulla]',
        3000,
        '2026-02-28'
      );

      expect(result?.product).toBe('Limón Tahití');
    });

    test('debe manejar nombres con paréntesis', () => {
      const result = parseProductCommentary(
        'Tomate Chonto (A — 1,2 kg @ $3.500/kg [Carulla]',
        4200,
        '2026-02-28'
      );

      expect(result?.product).toBe('Tomate Chonto (A');
    });

    test('debe manejar cantidad sin decimales', () => {
      const result = parseProductCommentary('Papa — 2 kg @ $2.500/kg [D1]', 5000, '2026-02-28');

      expect(result?.quantity).toBe(2);
    });

    test('debe manejar saltos de línea del OCR', () => {
      const result = parseProductCommentary(
        'Producto\n— 1,5 kg @ $3.000/kg [Tienda]',
        4500,
        '2026-02-28'
      );

      expect(result).not.toBeNull();
      expect(result?.product).toBe('Producto');
    });

    test('debe rechazar comentarios vacíos', () => {
      const result = parseProductCommentary('', 1000, '2026-02-28');
      expect(result).toBeNull();
    });

    test('debe rechazar comentarios solo con espacios', () => {
      const result = parseProductCommentary('   ', 1000, '2026-02-28');
      expect(result).toBeNull();
    });
  });

  // ============================================================
  // VALIDACIÓN DE COHERENCIA
  // ============================================================
  describe('Validación de coherencia precio × cantidad', () => {
    test('debe calcular correctamente con cantidad decimal', () => {
      const result = parseProductCommentary(
        'Producto — 0,625 kg @ $7.168/kg [Tienda]',
        4480,
        '2026-02-28'
      );

      expect(result?.quantity).toBe(0.625);
      expect(result?.pricePerKg).toBe(7168);
      // 0.625 × 7168 = 4480 ✓
    });

    test('debe aceptar pequeñas diferencias por redondeo', () => {
      const result = parseProductCommentary(
        'Producto — 1,545 kg @ $3.344/kg [Tienda]',
        5166, // 1.545 × 3344 = 5166.48 → redondea a 5166
        '2026-02-28'
      );

      expect(result).not.toBeNull();
      expect(Math.abs(result!.pricePerKg * result!.quantity - 5166)).toBeLessThan(2);
    });
  });

  // ============================================================
  // CLASIFICACIÓN isWeighed
  // ============================================================
  describe('Clasificación de productos pesados', () => {
    test('debe marcar frutas como pesadas', () => {
      const fruits = ['Banano', 'Papaya', 'Limón', 'Mandarina', 'Piña', 'Sandia'];

      fruits.forEach((fruit) => {
        const result = parseProductCommentary(
          `${fruit} — 1 kg @ $3.000/kg [Tienda]`,
          3000,
          '2026-02-28'
        );
        expect(result?.isWeighed).toBe(true);
      });
    });

    test('debe marcar verduras como pesadas', () => {
      const veggies = ['Papa', 'Cebolla', 'Tomate', 'Zanahoria', 'Lechuga'];

      veggies.forEach((veggie) => {
        const result = parseProductCommentary(
          `${veggie} — 1 kg @ $2.000/kg [Tienda]`,
          2000,
          '2026-02-28'
        );
        expect(result?.isWeighed).toBe(true);
      });
    });

    test('debe marcar productos procesados como NO pesados', () => {
      const processed = ['Yogurt', 'Fettuccine', 'Polvo Hornear', 'Jamón'];

      processed.forEach((product) => {
        const result = parseProductCommentary(
          `${product} — 1 un @ $5.000 [Tienda]`,
          5000,
          '2026-02-28'
        );
        expect(result?.isWeighed).toBe(false);
      });
    });

    test('debe respetar unit explícito sobre catálogo', () => {
      // Lechuga normalmente es pesada, pero si dice "1 un" debe respetarlo
      const result = parseProductCommentary(
        'Lechuga Crespa — 1 un @ $2.870 [Carulla]',
        2870,
        '2026-02-28'
      );

      expect(result?.unit).toBe('un');
      expect(result?.isWeighed).toBe(false); // unit='un' sobrescribe catálogo
    });
  });

  // ============================================================
  // FORMATOS ESPECÍFICOS DE TIENDAS
  // ============================================================
  describe('Formatos específicos de tiendas', () => {
    test('debe parsear formato Carulla con descuento', () => {
      const result = parseProductCommentary(
        'Arveja En Vaina — 0,350 kg @ $7.169/kg (antes $10.240/kg, -30%) [Carulla]',
        2509,
        '2026-03-03'
      );

      expect(result?.store).toBe('Carulla');
      expect(result?.discountPercent).toBe(30);
    });

    test('debe parsear formato D1 simple', () => {
      const result = parseProductCommentary('Lenteja El Es [D1]', 2850, '2026-02-28');

      expect(result?.store).toBe('D1');
      expect(result?.isIncomplete).toBe(true);
    });

    test('debe parsear formato Ara', () => {
      const result = parseProductCommentary('Marg Rama Mu [Ara]', 3990, '2026-03-02');

      expect(result?.store).toBe('Ara');
    });
  });

  // ============================================================
  // REGRESIÓN: Casos previamente fallidos
  // ============================================================
  describe('Regresión: casos que fallaban antes', () => {
    test('debe parsear correctamente Limón Mandarino con coma', () => {
      const cases = [
        { commentary: 'Limón Mandarino — 0,180 kg @ $5.840/kg [Carulla]', cost: 1051, qty: 0.18 },
        { commentary: 'Limón Mandarino — 0,990 kg @ $5.840/kg [Carulla]', cost: 5782, qty: 0.99 },
        {
          commentary: 'Limón Mandarino — 1,350 kg @ $4.088/kg (antes $5.840/kg, -30%) [Carulla]',
          cost: 5519,
          qty: 1.35
        }
      ];

      cases.forEach(({ commentary, cost, qty }) => {
        const result = parseProductCommentary(commentary, cost, '2026-02-28');
        expect(result).not.toBeNull();
        expect(result?.product).toBe('Limón Mandarino');
        expect(result?.quantity).toBeCloseTo(qty, 2);
        expect(result?.isIncomplete).toBe(false);
      });
    });

    test('NO debe capturar @ como nombre de producto', () => {
      const result = parseProductCommentary(
        '@ $2.156/kg (antes $3.080/kg, -30%) [Carulla]',
        2220,
        '2026-02-17'
      );

      expect(result?.product).not.toBe('@ $2.156/kg (antes $3.080/kg, -30%)');
      expect(result?.product).toContain('sin nombre');
      expect(result?.isIncomplete).toBe(true);
    });
  });

  // ============================================================
  // UTILIDADES: findBestPrice()
  // ============================================================
  describe('findBestPrice()', () => {
    test('debe encontrar mejor y peor precio en productos completos', () => {
      const products = [
        parseProductCommentary('Limón — 1 kg @ $5.000/kg [Carulla]', 5000, '2026-02-28'),
        parseProductCommentary('Limón — 1 kg @ $3.000/kg [D1]', 3000, '2026-02-28'),
        parseProductCommentary('Limón — 1 kg @ $7.000/kg [Éxito]', 7000, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const { best, worst, savings } = findBestPrice(products, 'limon');

      expect(best).not.toBeNull();
      expect(worst).not.toBeNull();
      expect(best?.pricePerKg).toBe(3000);
      expect(worst?.pricePerKg).toBe(7000);
      expect(savings).toBe(4000);
    });

    test('debe excluir registros incompletos del cálculo', () => {
      const products = [
        parseProductCommentary('Papa — 1 kg @ $2.500/kg [Carulla]', 2500, '2026-02-28'),
        parseProductCommentary('Papa [D1]', 1000, '2026-02-28'), // incompleto
        parseProductCommentary('Papa — 1 kg @ $3.000/kg [Éxito]', 3000, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const { best, worst } = findBestPrice(products, 'papa');

      // Debe ignorar el de $1.000 porque es incompleto
      expect(best?.pricePerKg).toBe(2500);
      expect(worst?.pricePerKg).toBe(3000);
    });

    test('debe manejar productos con tildes en la normalización', () => {
      const products = [
        parseProductCommentary(
          'Limón Mandarino — 0,180 kg @ $5.840/kg [Carulla]',
          1051,
          '2026-02-28'
        ),
        parseProductCommentary(
          'Limón Mandarino — 0,990 kg @ $5.840/kg [Carulla]',
          5782,
          '2026-02-28'
        ),
        parseProductCommentary(
          'Limón Mandarino — 1,350 kg @ $4.088/kg (antes $5.840/kg, -30%) [Carulla]',
          5519,
          '2026-03-03'
        )
      ].filter((p) => p !== null) as any[];

      // Clave normalizada (sin tilde): "limon mandarino"
      const { best, worst, savings } = findBestPrice(products, 'limon mandarino');

      expect(best).not.toBeNull();
      expect(worst).not.toBeNull();
      expect(best?.pricePerKg).toBe(4088);
      expect(worst?.pricePerKg).toBe(5840);
      expect(savings).toBe(1752);
    });

    test('debe manejar productos con caracteres especiales', () => {
      const products = [
        parseProductCommentary('Ñame — 1 kg @ $3.500/kg [Tienda]', 3500, '2026-02-28'),
        parseProductCommentary('Ñame — 1 kg @ $2.800/kg [Tienda]', 2800, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const { best, worst } = findBestPrice(products, 'name'); // normalizado

      expect(best?.pricePerKg).toBe(2800);
      expect(worst?.pricePerKg).toBe(3500);
    });

    test('debe retornar null si todos los productos son incompletos', () => {
      const products = [
        parseProductCommentary('Producto [D1]', 2000, '2026-02-28'),
        parseProductCommentary('Producto', 3000, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const { best, worst, savings } = findBestPrice(products, 'producto');

      expect(best).toBeNull();
      expect(worst).toBeNull();
      expect(savings).toBe(0);
    });

    test('debe funcionar con array vacío', () => {
      const { best, worst, savings } = findBestPrice([], 'cualquiera');

      expect(best).toBeNull();
      expect(worst).toBeNull();
      expect(savings).toBe(0);
    });

    test('debe funcionar con un solo producto', () => {
      const products = [
        parseProductCommentary('Tomate — 1 kg @ $3.500/kg [Carulla]', 3500, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const { best, worst, savings } = findBestPrice(products, 'tomate');

      expect(best?.pricePerKg).toBe(3500);
      expect(worst?.pricePerKg).toBe(3500);
      expect(savings).toBe(0);
    });

    test('debe manejar productos con mayúsculas/minúsculas mixtas', () => {
      const products = [
        parseProductCommentary('BANANO — 1 kg @ $4.000/kg [Carulla]', 4000, '2026-02-28'),
        parseProductCommentary('Banano — 1 kg @ $3.500/kg [D1]', 3500, '2026-02-28'),
        parseProductCommentary('banano — 1 kg @ $5.000/kg [Éxito]', 5000, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const { best, worst } = findBestPrice(products, 'banano');

      expect(best?.pricePerKg).toBe(3500);
      expect(worst?.pricePerKg).toBe(5000);
    });

    test('debe ignorar comparación de nombre si productos ya vienen filtrados', () => {
      // Caso real: useProductData ya agrupa por nombre, así que todos los
      // productos en el array tienen el mismo nombre normalizado
      const products = [
        parseProductCommentary(
          'Arveja En Vaina — 0,5 kg @ $7.000/kg [Carulla]',
          3500,
          '2026-02-28'
        ),
        parseProductCommentary('Arveja En Vaina — 0,3 kg @ $10.000/kg [Éxito]', 3000, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      // Aunque la clave sea diferente, debe funcionar porque todos son del mismo grupo
      const { best, worst } = findBestPrice(products, 'arveja en vaina');

      expect(best?.pricePerKg).toBe(7000);
      expect(worst?.pricePerKg).toBe(10000);
    });
  });

  // ============================================================
  // UTILIDADES: findCheapestStore()
  // ============================================================
  describe('findCheapestStore()', () => {
    test('debe calcular promedio por tienda', () => {
      const products = [
        parseProductCommentary('Papa — 1 kg @ $2.000/kg [Carulla]', 2000, '2026-02-28'),
        parseProductCommentary('Papa — 1 kg @ $3.000/kg [Carulla]', 3000, '2026-02-28'),
        parseProductCommentary('Papa — 1 kg @ $1.500/kg [D1]', 1500, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const stats = findCheapestStore(products);

      expect(stats['Carulla'].count).toBe(2);
      expect(stats['Carulla'].avgPrice).toBe(2500); // (2000 + 3000) / 2
      expect(stats['D1'].count).toBe(1);
      expect(stats['D1'].avgPrice).toBe(1500);
    });

    test('debe excluir productos incompletos', () => {
      const products = [
        parseProductCommentary('Tomate — 1 kg @ $3.000/kg [Carulla]', 3000, '2026-02-28'),
        parseProductCommentary('Tomate [Carulla]', 5000, '2026-02-28'), // incompleto
        parseProductCommentary('Tomate — 1 kg @ $2.500/kg [D1]', 2500, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const stats = findCheapestStore(products);

      // Carulla debe tener count=1 (no 2), excluyendo el incompleto
      expect(stats['Carulla'].count).toBe(1);
      expect(stats['Carulla'].avgPrice).toBe(3000);
    });

    test('debe excluir productos sin tienda', () => {
      const products = [
        parseProductCommentary('Banano — 1 kg @ $3.500/kg [Carulla]', 3500, '2026-02-28'),
        parseProductCommentary('Banano', 2000, '2026-02-28') // sin tienda
      ].filter((p) => p !== null) as any[];

      const stats = findCheapestStore(products);

      expect(stats['Carulla']).toBeDefined();
      expect(Object.keys(stats).length).toBe(1); // Solo Carulla
    });

    test('debe manejar múltiples tiendas', () => {
      const products = [
        parseProductCommentary('Limón — 1 kg @ $2.000/kg [Carulla]', 2000, '2026-02-28'),
        parseProductCommentary('Limón — 1 kg @ $1.500/kg [D1]', 1500, '2026-02-28'),
        parseProductCommentary('Limón — 1 kg @ $2.200/kg [Éxito]', 2200, '2026-02-28'),
        parseProductCommentary('Limón — 1 kg @ $1.800/kg [D1]', 1800, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const stats = findCheapestStore(products);

      expect(Object.keys(stats).length).toBe(3);
      expect(stats['D1'].count).toBe(2);
      expect(stats['D1'].avgPrice).toBe(1650); // (1500 + 1800) / 2
    });

    test('debe retornar objeto vacío si no hay productos con tienda', () => {
      const products = [
        parseProductCommentary('Papa', 2000, '2026-02-28'),
        parseProductCommentary('Tomate', 3000, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const stats = findCheapestStore(products);

      expect(Object.keys(stats).length).toBe(0);
    });

    test('debe manejar tiendas con nombres especiales', () => {
      const products = [
        parseProductCommentary('Producto — 1 kg @ $3.000/kg [Ara]', 3000, '2026-02-28'),
        parseProductCommentary('Producto — 1 kg @ $2.500/kg [Ara]', 2500, '2026-02-28')
      ].filter((p) => p !== null) as any[];

      const stats = findCheapestStore(products);

      expect(stats['Ara']).toBeDefined();
      expect(stats['Ara'].avgPrice).toBe(2750);
    });
  });
});
