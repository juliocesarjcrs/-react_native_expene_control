import { calculateSavings } from '../investmentCalculations';
describe('Investment Calculations', () => {
  describe('calculateSavings', () => {
    test('Ejemplo 1 Nubank: $10M a 12 meses (8.25% E.A.)', () => {
      const result = calculateSavings({
        initialCapital: 10000000,
        annualRate: 8.25,
        horizonMonths: 12,
        apply4x1000: false,
        withholdingTax: 7
      });

      // Valores esperados según Nubank
      expect(result.balanceBeforeTaxes).toBeCloseTo(10825000, -3); // ±1000
      expect(result.grossEarnings).toBeCloseTo(825000, -3);

      // En este caso, el interés diario promedio es bajo, no debería haber retención
      // (825000 / 365 = 2260.27 COP/día ≈ 0.052 UVT < 0.055 UVT)
      expect(result.withholdingAmount).toBe(0);
      expect(result.isAboveUVTThreshold).toBe(false);
    });

    test('Ejemplo 2 Nubank: $20M a 12 meses (8.25% E.A.)', () => {
      const result = calculateSavings({
        initialCapital: 20_000_000,
        annualRate: 8.25,
        horizonMonths: 12,
        apply4x1000: false,
        withholdingTax: 7
      });

      // Valores esperados según Nubank
      expect(result.grossEarnings).toBeCloseTo(1645764, -3); // ±1000
      expect(result.withholdingAmount).toBeCloseTo(115203.5, -2); // ±100
      expect(result.balanceAfterTaxes).toBeCloseTo(21530560, -3);

      // En este caso SÍ debería haber retención
      // (1645764 / 365 = 4509 COP/día ≈ 0.104 UVT > 0.055 UVT)
      expect(result.isAboveUVTThreshold).toBe(true);
    });
    test('Ejemplo 3 Nubank: $11M a 12 meses (8.25% E.A.)', () => {
      const result = calculateSavings({
        initialCapital: 11_600_000,
        annualRate: 8.25,
        horizonMonths: 12,
        apply4x1000: false,
        withholdingTax: 7
      });

      // Valores esperados según Nubank
      expect(result.grossEarnings).toBeCloseTo(957000, -3); // ±1000
    });

    test('Calcula 4x1000 correctamente', () => {
      const result = calculateSavings({
        initialCapital: 10000000,
        annualRate: 8.25,
        horizonMonths: 12,
        apply4x1000: true, // Activar 4x1000
        withholdingTax: 7
      });

      // 4x1000 entrada
      expect(result.fourPerThousandEntry).toBe(10000000 * 0.004);

      // 4x1000 salida (sobre saldo después de retención)
      expect(result.fourPerThousandExit).toBeCloseTo(result.balanceAfterTaxes * 0.004, -2);

      // Total
      expect(result.fourPerThousandTotal).toBeCloseTo(
        result.fourPerThousandEntry + result.fourPerThousandExit,
        -2
      );
    });

    // test('Calcula tasa efectiva anual correctamente', () => {
    //   const result = calculateSavings({
    //     initialCapital: 10000000,
    //     annualRate: 8.25,
    //     horizonMonths: 12,
    //     apply4x1000: false,
    //     withholdingTax: 7,
    //   });

    //   // Para 12 meses, la tasa efectiva debería ser cercana a la tasa nominal
    //   // pero menor por los impuestos
    //   expect(result.effectiveAnnualRate).toBeLessThan(8.25);
    //   expect(result.effectiveAnnualRate).toBeGreaterThan(7);
    // });

    test('Calcula retorno real ajustado por inflación', () => {
      const result = calculateSavings({
        initialCapital: 10000000,
        annualRate: 8.25,
        horizonMonths: 12,
        apply4x1000: false,
        withholdingTax: 7,
        inflation: 5.5 // Inflación Colombia
      });

      // El retorno real debe ser menor que el nominal
      const nominalReturn = (result.finalAmount / result.totalDeposited - 1) * 100;
      expect(result.realReturn).toBeLessThan(nominalReturn);

      // Aproximadamente: (1 + 0.0825) / (1 + 0.055) - 1 ≈ 2.6%
      expect(result.realReturn).toBeGreaterThan(2);
      expect(result.realReturn).toBeLessThan(3);
    });

    test('Umbral UVT se calcula correctamente', () => {
      // UVT 2025 = 43,347 COP
      // Umbral = 0.055 UVT = 2,384 COP/día

      // Caso 1: Por debajo del umbral
      const low = calculateSavings({
        initialCapital: 5000000,
        annualRate: 8.25,
        horizonMonths: 12
      });

      expect(low.isAboveUVTThreshold).toBe(false);
      expect(low.withholdingAmount).toBe(0);

      // Caso 2: Por encima del umbral
      const high = calculateSavings({
        initialCapital: 50000000,
        annualRate: 8.25,
        horizonMonths: 12
      });

      expect(high.isAboveUVTThreshold).toBe(true);
      expect(high.withholdingAmount).toBeGreaterThan(0);
    });
  });
});
