import { parseRentCommentary } from '~/utils/commentaryParser/rentParser';

const parse = (commentary: string) => parseRentCommentary(commentary, 1_500_000, '2026-11-01');

describe('rentParser — pago completo con mes y año', () => {
  test('extrae el año: "Arriendo Mar 2026"', () => {
    expect(parse('Arriendo Mar 2026')).toMatchObject({
      paymentType: 'completo',
      month: 'Marzo',
      year: 2026,
      property: undefined
    });
  });

  test('acepta la abreviatura "May" (antes no se reconocía)', () => {
    expect(parse('Arriendo May 2026')).toMatchObject({ month: 'Mayo', year: 2026 });
  });

  test('acepta el mes completo', () => {
    expect(parse('Arriendo Mayo 2026')).toMatchObject({ month: 'Mayo', year: 2026 });
  });

  test('la propiedad va después del año', () => {
    expect(parse('Arriendo Feb 2026 Torre 2 apt 505')).toMatchObject({
      month: 'Febrero',
      year: 2026,
      property: 'Torre 2 apt 505'
    });
  });

  test('sin año, lo que sigue al mes es la propiedad', () => {
    expect(parse('Arriendo Marzo Torre 2')).toMatchObject({
      month: 'Marzo',
      year: undefined,
      property: 'Torre 2'
    });
  });

  test('un número de 4 dígitos que no está pegado al mes no se toma como año', () => {
    expect(parse('Arriendo Marzo Torre 2026')).toMatchObject({
      year: undefined,
      property: 'Torre 2026'
    });
  });

  test('la palabra que sigue a "Arriendo" no es un mes: todo es propiedad', () => {
    const house = parse('Arriendo Casa Centro');
    expect(house).toMatchObject({ paymentType: 'completo', property: 'Arriendo Casa Centro' });
    expect(house?.month).toBeUndefined();
    expect(house?.year).toBeUndefined();

    const onlyYear = parse('Arriendo 2026');
    expect(onlyYear).toMatchObject({ property: 'Arriendo 2026' });
    expect(onlyYear?.month).toBeUndefined();
  });

  test('el chip "Mes completo" (Arriendo {Mes} {Año}) se lee completo', () => {
    expect(parse('Arriendo Nov 2026')).toMatchObject({ month: 'Noviembre', year: 2026 });
  });
});

describe('rentParser — formatos que no cambian', () => {
  test('parcial con mes: "22 días mes Febrero 2026"', () => {
    expect(parse('22 días mes Febrero 2026')).toMatchObject({
      paymentType: 'parcial',
      days: 22,
      month: 'Febrero',
      year: 2026
    });
  });

  test('parcial con "May" abreviado también se normaliza', () => {
    expect(parse('22 días mes May 2026')).toMatchObject({ month: 'Mayo', year: 2026 });
  });

  test('parcial con propiedad', () => {
    expect(parse('9 días arriendo Torre 2. Apt 505')).toMatchObject({
      paymentType: 'parcial',
      days: 9,
      property: 'Torre 2. Apt 505'
    });
  });

  test('nuevo valor', () => {
    expect(parse('Nuevo valor apt 1004 Mirador Villa Verde')).toMatchObject({
      paymentType: 'nuevo_valor',
      isNewValue: true,
      property: 'apt 1004 Mirador Villa Verde'
    });
  });

  test('texto sin formato o vacío → null', () => {
    expect(parse('Pago de internet')).toBeNull();
    expect(parse('')).toBeNull();
    expect(parse('   ')).toBeNull();
  });
});
