/**
 * parseD1Pdf.test.ts
 *
 * Tests para el parser de facturas electrónicas PDF de D1.
 */

import { extractProducts } from '~/utils/parsers';

const FACTURA_D1_PDF_3_ITEMS = `Tiendas
de todos!
DI S A S
TIENDA-6A270040
FACTURA ELECTRÓNICA DE VENTA N: I1G1347763
FECHA:  2026-06-20 14:37:42
NUM. DOCUMENTO: 2222222222
ESTIMADO (A) :  CONSUMIDOR FINAL
DIRECCIÓN:      CALLE 6 CON CRA 9A ESQUINA
ÍTEM    CÓDIGO  DESCRIPCIÓN
CANT    UN. MED VR UNI  VR BASE DTO
IVA     ° IVA   INC     INC     *CARGO  VR TOTAL
1 7700304592739 TERMO CON VASO RED F
UND     14.900,00       12.521,00
2.378,99        19,00   14.900,00
2 7700304419739 SILLA PLEGABLE 20.09
2       UND     49.800,00       41.849,00
7.951,26        19,00   49.800,00
3 5906750847306 AGUA MICELAR DELIA 2
UND     4.500,00        3.782,00
718,49  19,00   4.500,00
TOTAL ARTICULOS :
•- [TOTALES DE FACTURA]
SUBTOTAL:       58.151,26
DESCUENTO:      0,00
BASE/IMP:       58.151,26
IVA:    11.048,74
AJUSTE A VUELTAS:       0,00
TOTAL:  69.200,00
• [FORMAS DE PAGO]---
FORMA DE PAGO:  CONTADO
EFECTIVO:       100.000,00
CAMBIO: - 30.800,00
- [DISCRIMINACIÓN DE IMPUESTOS]-
DESCRIPCION     BASE/CANT       IMPUESTO
IVA 19%:        58.151,26 11.048, 74
D1      S A S NIT 900276962-1
Somos Grandes contribuyentes y Agente retenedor de IVA
Resolución No. 200 del 27 de diciembre de 2024.
Línea de atención al cliente: : 018000120201
CUFE :  a3c38d52fcf1b8c8495bfa
Fecha y Hora Validación DIAN: 2026/06/20 14:37:47`;

describe('parseD1Pdf — factura electrónica PDF D1', () => {
  describe('Precios', () => {
    it('extrae VR_TOTAL correcto — no confunde con número de ítem ni multiplica decimales', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });

      expect(result).toHaveLength(3);

      // Verificar precios exactos — el bug anterior daba 1490000, 4980000, 450000
      const prices = result.map((p) => p.price).sort((a, b) => a - b);
      expect(prices).toEqual([4500, 14900, 49800]);
    });

    it('Termo Con Vaso Red: precio 14900', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      const termo = result.find((p) => p.description.toLowerCase().includes('termo'));
      expect(termo?.price).toBe(14900);
    });

    it('Silla Plegable: precio 49800 (cantidad 2, pero VR_TOTAL por ítem)', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      const silla = result.find((p) => p.description.toLowerCase().includes('silla'));
      expect(silla?.price).toBe(49800);
    });

    it('Agua Micelar: precio 4500', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      const agua = result.find((p) => p.description.toLowerCase().includes('agua'));
      expect(agua?.price).toBe(4500);
    });

    it('ningún precio es igual al número de ítem (1, 2, 3)', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      result.forEach((p) => expect(p.price).toBeGreaterThan(100));
    });

    it('ningún precio tiene decimales multiplicados (x100)', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      // Los precios reales son < 100.000, nunca > 1.000.000
      result.forEach((p) => expect(p.price).toBeLessThan(1_000_000));
    });
  });

  describe('Descripciones', () => {
    it('incluye tag [D1] en todas las descripciones', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      result.forEach((p) => expect(p.description).toContain('[D1]'));
    });

    it('aplica title case a las descripciones', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      // Ninguna descripción debe estar en MAYÚSCULAS puras
      result.forEach((p) => {
        expect(p.description).not.toBe(p.description.toUpperCase());
      });
    });

    it('no incluye metadata como descripción (CUFE, NIT, etc.)', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      const descriptions = result.map((p) => p.description.toUpperCase());
      expect(descriptions.join(' ')).not.toContain('CUFE');
      expect(descriptions.join(' ')).not.toContain('NIT');
      expect(descriptions.join(' ')).not.toContain('SUBTOTAL');
    });
  });

  describe('Filtrado de resumen', () => {
    it('no extrae líneas de totales como productos', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      // Solo debe haber 3 productos, no más (que incluirían totales)
      expect(result.length).toBe(3);
    });

    it('detecta D1 automáticamente por NIT sin storeHint', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Routing sourceType', () => {
    it('con sourceType pdf extrae productos correctamente', () => {
      const result = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      expect(result.length).toBe(3);
    });

    it('compatibilidad hacia atrás: sin sourceType no lanza error', () => {
      expect(() => extractProducts(FACTURA_D1_PDF_3_ITEMS)).not.toThrow();
    });

    it('con sourceType image extrae 0 o menos productos que pdf para esta estructura', () => {
      const pdfResult = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'pdf' });
      const imageResult = extractProducts(FACTURA_D1_PDF_3_ITEMS, { sourceType: 'image' });
      expect(pdfResult.length).toBeGreaterThanOrEqual(imageResult.length);
    });
  });
});
