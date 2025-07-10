import { extractProducts } from '../ExtractProducsts';
describe('extractProducts', () => {
  describe('Carulla receipts', () => {
    it('should parse multiple products from Carulla receipt', () => {
      const carullaText = `
          PLU DETALLE PRECIO
          1 1/u x 4.578 V . Ahorro 229 647588 GALLETA WAFER SI 4.349A
          2 1/u x 2.500 V . Ahorro 100 647589 LECHE ENTERA 2.400A
          Total Item :2
          `;

      expect(extractProducts(carullaText)).toEqual([
        { description: 'GALLETA WAFER SI', price: 4349 },
        { description: 'LECHE ENTERA', price: 2400 }
      ]);
    });

    it('should extract a single product line from invoice type Carulla', () => {
      const ocr =
        'DETALLE\tPRECIO\t\r\nPLU\t\r\n1/u x 16.900 V. Ahorro 3.000\t13.900\t\r\n3616630 Protectores Diar\t\r\nTotal Item : 1\t\r\n';
      expect(extractProducts(ocr)).toEqual([{ description: 'Protectores Diar', price: 13900 }]);
    });

    it('should handle multiple products from invoice type Carulla', () => {
      const ocr =
        'PRECIO\t\r\nPLU\tDETALLE\t\r\n1 1/u x 23.000 V. Ahorro 0\t\r\n172836 Huevo Napoles De\t23.000\t\r\n2 1/u x 2.350 V. Ahorro 0\t\r\n3343120 Mogolla Integral\t2.350\t\r\nTotal Item :2\t\r\n';
      expect(extractProducts(ocr)).toEqual([
        { description: 'Huevo Napoles De', price: 23000 },
        { description: 'Mogolla Integral', price: 2350 }
      ]);
    });
    it('should handle multiple(11) products from invoice type Carulla', () => {
      const ocr = `PLU\tDETALLE\tPRECIO\t\r\n1 0.305/KGM x 9.340 V. Ahorro 854\t\r\n1138\tRemolacha A Gran\t1.995\t\r\n2 0.750/KGM x 3.060 V. Ahorro 689\t\r\n1862\tAHUYAMA ENTERA\t1.606\t\r\n3 0.800/KGM x 6.600 V. Ahorro 1.584\t\r\n1279\tCebolla Roja.\t3.696\t\r\n4 1.140/KGM x 4.060 V. Ahorro 1.389\t\r\n1025\tChocolo Tierno(M\t3.239\t\r\n5 2. 415/KGM x 3.040 V. Ahorro 2.203\t\r\n1179\tPapaya Comun\t5.139\t\r\n6 0. 435/KGM x 7.460 V. Ahorro 974\t\r\n1002\tAcelga\t2.271\t\r\n7 0.475/KGM x 8.120 V. Ahorro 1.157\t\r\n1188\tPepino Zukini\t2.700\t\r\n8 0.860/KGM x 5.980 V. Ahorro 1.543\t\r\n1098\tTomate Chonto (A\t3.600\t\r\n9\t0.860/KGM x 3.980 V. Ahorro 1.026\t\r\n1141\tZanahoria A Gran\t2,397\t\r\n10 1.455/KGM x 2.960 V. Ahorro 1.292\t\r\n1161\tPlatano Maduro\t3. 015\t\r\n11 1.795/KGM x 4.800 V. Ahorro 2.584\t\r\n1260\tYuca fresca\t6.032\t\r\nTotal Item :11\t\r\nSUBTOTAL\t50.985\t\r\nDESCUENTO\t15.295\t\r\nAHORRO\t15.295\t\r\nVALOR TOTAL\t35.690\t\r\n`;
      expect(extractProducts(ocr)).toEqual([
        { description: 'Remolacha A Gran', price: 1995 },
        { description: 'AHUYAMA ENTERA', price: 1606 },
        { description: 'Cebolla Roja.', price: 3696 },
        { description: 'Chocolo Tierno(M', price: 3239 },
        { description: 'Papaya Comun', price: 5139 },
        { description: 'Acelga', price: 2271 },
        { description: 'Pepino Zukini', price: 2700 },
        { description: 'Tomate Chonto (A', price: 3600 },
        { description: 'Zanahoria A Gran', price: 2397 },
        { description: 'Platano Maduro', price: 3015 },
        { description: 'Yuca fresca', price: 6032 }
      ]);
    });

    describe('invoice type Exito', () => {
      it('should extract a single product from invoice type Exito', () => {
        const ocr =
          'PLU\tDETALLE\tPRECIO\t\r\n1 1/u x 4.578 V. Ahorro 229\t229\t\r\n647588 GALLETA WAFER SI\t4.349A\t\r\nTotal Item :1\t\r\n';
        expect(extractProducts(ocr)).toEqual([{ description: 'GALLETA WAFER SI', price: 4349 }]);
      });

      it('should parse single product from Carulla receipt', () => {
        const carullaText = `
          PLU DETALLE PRECIO
          1 1/u x 4.578 V . Ahorro 229 647588 GALLETA WAFER SI 4.349A
          Total Item :1
          `;

        expect(extractProducts(carullaText)).toEqual([{ description: 'GALLETA WAFER SI', price: 4349 }]);
      });
    });
  });

  describe('D1 receipts', () => {
    it('should handle multiple products from invoice type D1', () => {
      const ocr =
        '108 18U811\t\r\nHI\tCAN UM VALOR U\tCODIGO\tDESCRIPCION\tVALOR IU\t\r\n2,300\t\r\n1\t1 UN\t2,300 7700304378074 CREMA DE LECH\t2,300\t\r\n6,990\t\r\n2\t1 UN\t6,990 7700304811090 TOCINETA AHUM\t6,990\t\r\n1 UN\t4,500\t7700304016525 ARROZ PREMIUM\t4,500\t\r\n1 UN\t9,990\t7700304792825 CAFE INSTAN/L\t9,990\t\r\nTOTAL\t23,780\t\r\nOTRO\t-30\t\r\n';
      expect(extractProducts(ocr)).toEqual([
        { description: 'CREMA DE LECH', price: 2300 },
        { description: 'TOCINETA AHUM', price: 6990 },
        { description: 'ARROZ PREMIUM', price: 4500 },
        { description: 'CAFE INSTAN/L', price: 9990 }
      ]);
    });

    it('should handle from invoice type D1 Case 2', () => {
      const ocr =
        '#I\tCAN UM VALOR U\tLLO VU14\tCODIGO\tUo: 19:31\t\r\nDESCRIPCION\t\r\n1\t1\tUN\tVALOR ID\t\r\n4,300 7700304509423 INFUSION FRUT\t4,300 A\t\r\nFFF\tUN\tUN\t2,950 7700304649631 SALSA DE PINA\t2,250 7700304305209 SERVILLETA CO\t1,650 A\t2,950 A\t2,250 A\t\r\n2\tUN\t1,650 7700304861682 ESPONJA MALLA\t\r\n1\tUN\t9,990 7700304792825 CAFE INSTAN/L\t9,990 C\t\r\nTOTAL\t21,140\t\r\n';
      expect(extractProducts(ocr)).toEqual([
        { description: 'INFUSION FRUT', price: 4300 },
        { description: 'SALSA DE PINA', price: 2950 },
        { description: 'SERVILLETA CO', price: 2250 },
        { description: 'ESPONJA MALLA', price: 1650 },
        { description: 'CAFE INSTAN/L', price: 9990 }
      ]);
    });
    it('should handle from invoice type D1 Case 3', () => {
      const ocr =
        `Gereac in: 206/07/9 0.:32:26
        HI CAN CH VALOR U 000:00        DESCRTPOLON VALOR 1DI
        2, 10 70842579 JABON VELIEADO   2,00 A.
        2. UN   10 72176429 ICLA CD 2,00.
        3 10    6 260 72970876 PANEZLA RACI 6,206
        41 1 , 14,290 7040812 PAPE. HIGENI 4.280 A
        AlICI.  VACTAS`;
      expect(extractProducts(ocr)).toEqual([
        { description: 'JABON VELIEADO', price: 200 },
        { description: 'ICLA CD', price: 200 },
        { description: 'PANEZLA RACI', price: 6206 },
        { description: 'PAPE. HIGENI', price: 4280 }
      ]);
    });
    it('should handle from invoice type D1 Case 4', () => {
      const ocr ="#I CAN UM VALOR U\tCODIGO\tDESCRIPCION\tVALOR ID\t\r\n1\t1 UN\t2,600 7702084138039 HARINA DE MAI\t2,600 C\t\r\n2\t1 UN\t2, 100 7700304194575\tCOLORANTE NAT\t2,100\t\r\nTOTAL\t4,700\t\r\nFODMA DE PAGO• CONTANO - VAIOR PAGADO\t700\t\r\n";
      expect(extractProducts(ocr)).toEqual([
        { description: 'HARINA DE MAI', price: 2600 },
        { description: 'COLORANTE NAT', price: 2100 }
      ]);
    });
       it('should handle from invoice type D1 Case 5', () => {
      const ocr ="#I CAN UM VALOR U\tCODIGO\tDESCRIPCION\tVALOR ID\t\r\n1\tUN\t3,500 7700304211180\tDETERGENTE MU\t\r\n3,500 A\t\r\n2\tUN\t2,900 7700304530939 BLANQUEADOR B\t\r\n2,900 A\t\r\nTOTAL\t6,400\t\r\n";
      expect(extractProducts(ocr)).toEqual([
        { description: 'DETERGENTE MU', price: 3500 },
        { description: 'BLANQUEADOR B', price: 2900 }
      ]);
    });
  });
});
