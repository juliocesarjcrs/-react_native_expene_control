import { extractProducts } from '~/utils/parsers';
describe('extractProducts', () => {
  describe('Carulla receipts', () => {
    // ─────────────────────────────────────────────────────────────────────────
    // processAltCarulla
    // Criterio: "DETALLE PRECIO" aparece ANTES que PLU + tiene "Total Item :"
    // Formato: línea de unidad contiene el precio; descripción en línea siguiente
    // ─────────────────────────────────────────────────────────────────────────
    describe('processAltCarulla — DETALLE PRECIO antes que PLU', () => {
      it('parses a single product — price in unit line, desc in next line (original case 2)', () => {
        const ocr =
          'DETALLE\tPRECIO\t\r\nPLU\t\r\n1/u x 16.900 V. Ahorro 3.000\t13.900\t\r\n3616630 Protectores Diar\t\r\nTotal Item : 1\t\r\n';
        expect(extractProducts(ocr)).toEqual([
          { description: 'Protectores Diar [Carulla]', price: 13900 }
        ]);
      });

      it('parses multiple products — PRECIO header before PLU DETALLE (original case 3)', () => {
        const ocr =
          'PRECIO\t\r\nPLU\tDETALLE\t\r\n1 1/u x 23.000 V. Ahorro 0\t\r\n172836 Huevo Napoles De\t23.000\t\r\n2 1/u x 2.350 V. Ahorro 0\t\r\n3343120 Mogolla Integral\t2.350\t\r\nTotal Item :2\t\r\n';
        expect(extractProducts(ocr)).toEqual([
          { description: 'Huevo Napoles De [Carulla]', price: 23000 },
          { description: 'Mogolla Integral [Carulla]', price: 2350 }
        ]);
      });

      it('parses KGM + 1/u — ambiguous header with V. Ahorro column (original case 15)', () => {
        const ocr =
          '202b 10191\t\r\nDETALLE\tPRECIO\t\r\nPLU\tV. Ahorro\t6.225\t\r\n1 0.944/KGM x 21.980\t14.524\t\r\n737288 Tilapia Roja\t\r\n2 1/u x 14.950 V. Ahorro 3.738\t11.212A\t\r\n608937 Lavaplatos en Cr\t\r\nTotal Item :2\t\r\n35.699\t\r\n';
        expect(extractProducts(ocr)).toEqual([
          { description: 'Tilapia Roja [Carulla]', price: 14524 },
          { description: 'Lavaplatos En Cr [Carulla]', price: 11212 }
        ]);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // processExitoFormat
    // Criterio: PLU DETALLE PRECIO + V. Ahorro + sin ítems KGM
    // Formato: código + descripción + precio en la misma línea
    // ─────────────────────────────────────────────────────────────────────────
    describe('processExitoFormat — PLU DETALLE PRECIO sin ítems KGM', () => {
      it('parses Exito-style inline products with V . Ahorro (original case 1)', () => {
        const ocr = `
          PLU DETALLE PRECIO
          1 1/u x 4.578 V . Ahorro 229 647588 GALLETA WAFER SI 4.349A
          2 1/u x 2.500 V . Ahorro 100 647589 LECHE ENTERA 2.400A
          Total Item :2
          `;
        expect(extractProducts(ocr)).toEqual([
          { description: 'Galleta Wafer Si [Exito]', price: 4349 },
          { description: 'Leche Entera [Exito]', price: 2400 }
        ]);
      });

      it('parses tab-separated product name — desc spread across tab columns (original case 13)', () => {
        const ocr = `PLU	DETALLE	PRECIO
        1	1/u x 4.900 V. Ahorro 770
        3524902 Patitos	Humedos	4. 130A
        Total Item :1
        `;
        expect(extractProducts(ocr)).toEqual([
          { description: 'Patitos Humedos [Exito]', price: 4130 }
        ]);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // processCarullaCase5
    // Criterio: PLU DETALLE (sin columna PRECIO en el header) + Total Item
    // Formato: precio puede aparecer en la línea del producto o en la siguiente
    // ─────────────────────────────────────────────────────────────────────────
    describe('processCarullaCase5 — PLU DETALLE sin columna PRECIO', () => {
      it('handles broken header — PRECIO misplaced mid-receipt (original case 5)', () => {
        const ocr = `PLU	DETALLE
        1 0. 345/KGM x 10.480 V. Ahorro 1.085	PRECIO
        1137	HABICHUELA A GRA
        2	1/u x 7.500 V. Ahorro 2.250	2.531
        1443	Champi#%n Tajado
        3	0.945/KGM * 2.040 V. Ahorro 578	5.250
        394644 PEPINO COHOMBRO	1.350
        4 1. 065/KGM x 5.700 V. Ahorro 1.821
        1141	Zanahoria A Gran	4.250
        5	1.560/KGM x 4.700 V. Ahorro 2.200
        1260	Yuca fresca	5.132
        6 0.480/KGM x 7.180 V. Ahorro 1.034
        1290	Lechuga	Batavia	2.412
        Total Item :6`;
        expect(extractProducts(ocr)).toEqual([
          {
            description:
              'Habichuela A Gra — 0.345 kg @ $7.335/kg (antes $10.480/kg, -30%) [Carulla]',
            price: 2531
          },
          { description: 'Champi#%N Tajado [Carulla]', price: 5250 },
          {
            description: 'Pepino Cohombro — 0.945 kg @ $1.428/kg (antes $2.040/kg, -30%) [Carulla]',
            price: 1350
          },
          {
            description:
              'Zanahoria A Gran — 1.065 kg @ $3.990/kg (antes $5.700/kg, -30%) [Carulla]',
            price: 4250
          },
          {
            description: 'Yuca Fresca — 1.560 kg @ $3.290/kg (antes $4.700/kg, -30%) [Carulla]',
            price: 5132
          },
          {
            description: 'Lechuga Batavia — 0.480 kg @ $5.026/kg (antes $7.180/kg, -30%) [Carulla]',
            price: 2412
          }
        ]);
      });

      it('handles PRECIO header before PLU DETALLE — price on product line (original case 8)', () => {
        const ocr = `PRECIO
        PLU	DETALLE
        1 1/u x 7.440 V. Ahorro 0
        3354234 Esparcible	7.440A
        2 1/u x 5.450 V. Ahorro	273	5.177
        337695 Queso D/Crema	7
        Total Item :2`;
        expect(extractProducts(ocr)).toEqual([
          { description: 'Esparcible [Carulla]', price: 7440 },
          { description: 'Queso D/Crema [Carulla]', price: 7 }
        ]);
      });

      it('handles price embedded in unit line with comma savings value (original case 9)', () => {
        const ocr = `PRECIO
        PLU	DETALLE
        1 1/u x 7,440 V. Ahorro 0	7.440A
        3354234 Esparcible
        2 1/u x 5,450 V. Ahorro	273
        337695 Queso D/Crema	5.177
        Total Item 12	`;
        expect(extractProducts(ocr)).toEqual([
          { description: 'Esparcible [Carulla]', price: 273 },
          { description: 'Queso D/Crema [Carulla]', price: 5177 }
        ]);
      });

      it('handles price with internal space — "7. 440A" style OCR noise (original case 10)', () => {
        const ocr = `PRECIO
        PLU	DETALLE
        1 1/u x 7.440 V. Ahorro 0
        3354234 Esparcible	7. 440A
        2 1/u x 5,450 V. Ahorro	273	5.177
        337695 Queso D/Crema
        Total Item :2`;
        expect(extractProducts(ocr)).toEqual([
          { description: 'Esparcible [Carulla]', price: 440 },
          { description: 'Queso D/Crema [Carulla]', price: 2 }
        ]);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // processCarullaCase6
    // Criterio: PLU DETALLE PRECIO + al menos un ítem KGM
    // Formato: varía entre sub-patrones internos (PRIORIDAD 1–4 + principal)
    // ─────────────────────────────────────────────────────────────────────────
    describe('processCarullaCase6 — PLU DETALLE PRECIO con ítems KGM', () => {
      // PRIORIDAD 1: KGM + ahorro separado por espacio → precio en línea del producto
      describe('PRIORIDAD 1 — KGM con ahorro en espacio, precio en línea de producto', () => {
        it('parses 11 KGM products with discount — price always in product line (original case 4)', () => {
          const ocr = `PLU\tDETALLE\tPRECIO\t\r\n1 0.305/KGM x 9.340 V. Ahorro 854\t\r\n1138\tRemolacha A Gran\t1.995\t\r\n2 0.750/KGM x 3.060 V. Ahorro 689\t\r\n1862\tAHUYAMA ENTERA\t1.606\t\r\n3 0.800/KGM x 6.600 V. Ahorro 1.584\t\r\n1279\tCebolla Roja.\t3.696\t\r\n4 1.140/KGM x 4.060 V. Ahorro 1.389\t\r\n1025\tChocolo Tierno(M\t3.239\t\r\n5 2. 415/KGM x 3.040 V. Ahorro 2.203\t\r\n1179\tPapaya Comun\t5.139\t\r\n6 0. 435/KGM x 7.460 V. Ahorro 974\t\r\n1002\tAcelga\t2.271\t\r\n7 0.475/KGM x 8.120 V. Ahorro 1.157\t\r\n1188\tPepino Zukini\t2.700\t\r\n8 0.860/KGM x 5.980 V. Ahorro 1.543\t\r\n1098\tTomate Chonto (A\t3.600\t\r\n9\t0.860/KGM x 3.980 V. Ahorro 1.026\t\r\n1141\tZanahoria A Gran\t2,397\t\r\n10 1.455/KGM x 2.960 V. Ahorro 1.292\t\r\n1161\tPlatano Maduro\t3. 015\t\r\n11 1.795/KGM x 4.800 V. Ahorro 2.584\t\r\n1260\tYuca fresca\t6.032\t\r\nTotal Item :11\t\r\nSUBTOTAL\t50.985\t\r\nDESCUENTO\t15.295\t\r\nAHORRO\t15.295\t\r\nVALOR TOTAL\t35.690\t\r\n`;
          expect(extractProducts(ocr)).toEqual([
            {
              description:
                'Remolacha A Gran — 0.305 kg @ $6.540/kg (antes $9.340/kg, -30%) [Carulla]',
              price: 1995
            },
            {
              description:
                'Ahuyama Entera — 0.750 kg @ $2.141/kg (antes $3.060/kg, -30%) [Carulla]',
              price: 1606
            },
            {
              description: 'Cebolla Roja — 0.800 kg @ $4.620/kg (antes $6.600/kg, -30%) [Carulla]',
              price: 3696
            },
            {
              description:
                'Chocolo Tiernom — 1.140 kg @ $2.842/kg (antes $4.060/kg, -30%) [Carulla]',
              price: 3239
            },
            {
              description: 'Papaya Comun — 2.415 kg @ $2.128/kg (antes $3.040/kg, -30%) [Carulla]',
              price: 5139
            },
            {
              description: 'Acelga — 0.435 kg @ $5.221/kg (antes $7.460/kg, -30%) [Carulla]',
              price: 2271
            },
            {
              description: 'Pepino Zukini — 0.475 kg @ $5.684/kg (antes $8.120/kg, -30%) [Carulla]',
              price: 2700
            },
            {
              description: 'Tomate Chonto — 0.860 kg @ $4.186/kg (antes $5.980/kg, -30%) [Carulla]',
              price: 3600
            },
            {
              description:
                'Zanahoria A Gran — 0.860 kg @ $2.787/kg (antes $3.980/kg, -30%) [Carulla]',
              price: 2397
            },
            {
              description:
                'Platano Maduro — 1.455 kg @ $2.072/kg (antes $2.960/kg, -30%) [Carulla]',
              price: 3015
            },
            {
              description: 'Yuca Fresca — 1.795 kg @ $3.360/kg (antes $4.800/kg, -30%) [Carulla]',
              price: 6032
            }
          ]);
        });
      });

      // PRIORIDAD 2: KGM + precio al final de la línea de unidad → desc en línea siguiente sin precio
      describe('PRIORIDAD 2 — KGM con precio en línea de unidad, desc en línea siguiente', () => {
        it('parses KGM with zero savings and 1/u mixed — price inline (original case 6)', () => {
          const ocr = `PLU	DETALLE	PRECIO
        1 0.265/KGM x 26.600 V. Ahorro 0
        237700 Carne Asar Freir	7.049
        2 1/u x 3.780 V. Ahorro 0
        1486	Aguacate Und	3.780
        Total Item :26`;
          expect(extractProducts(ocr)).toEqual([
            {
              description: 'Carne Asar Freir — 0.265 kg @ $26.600/kg [Carulla]',
              price: 7049
            },
            { description: 'Aguacate Und [Carulla]', price: 3780 }
          ]);
        });

        it('parses KGM with discount — price in product line, desc in next line (original case 12)', () => {
          const ocr = `PLU	DETALLE	PRECIO
        1 0.995/KGM x 4.260 V. Ahorro 848
        1253	Banano	3.391
        2 1.345/KGM x 2.720 V. Ahorro 0
        1141	Zanahoria A Gran	3.658
        3 1/u x 6.770 V. Ahorro 0
        942160 Panela 4 Und	6.770
        Total Item :3`;
          expect(extractProducts(ocr)).toEqual([
            {
              description: 'Banano — 0.995 kg @ $3.408/kg (antes $4.260/kg, -20%) [Carulla]',
              price: 3391
            },
            {
              description: 'Zanahoria A Gran — 1.345 kg @ $2.720/kg [Carulla]',
              price: 3658
            },
            { description: 'Panela 4 Und [Carulla]', price: 6770 }
          ]);
        });

        it('parses KGM item without item number in unit line (original case 17)', () => {
          const ocr = `PLU	DETALLE	PRECIO
          1 1/u x 6.770 V. Ahorro 0
          942160 Panela 4 Und	6.770
          0.710/KGM x 3.900 V. Ahorro 0
          1179	Papaya Comun	2.769
          Total Item :2
        `;
          expect(extractProducts(ocr)).toEqual([
            { description: 'Panela 4 Und [Carulla]', price: 6770 },
            {
              description: 'Papaya Comun — 0.710 kg @ $3.900/kg [Carulla]',
              price: 2769
            }
          ]);
        });
      });

      // PRIORIDAD 3: 1/u con precio embebido en línea de unidad → desc en línea siguiente
      describe('PRIORIDAD 3 — 1/u con precio embebido en línea de unidad', () => {
        it('handles IMP.CONS line noise and duplicate products (original case 7)', () => {
          const ocr = `PLU	DETALLE	PRECIO
        1 1/u x 12.500 V. Ahorro 1.875
        449804 SIXPACK COLA&POL	10.625A
        IMP. CONS. LICORES	: 840
        2 1/u x 7.830 V. Ahorro 4.698
        857582 Galletas antojos	3.132A
        1/u x 7,830 V. Ahorro 4.698
        857582 Galletas antojos	3.132A
        4 1.085/KGM x 19.900 V. Ahorro 3.239
        3618617 Pechuga Blanca M	18.353
        5 1/u x 11,600 V. Ahorro 6.960
        1546100 Galletas Yogurt	4.640A
        6 1/u x 7.210 V. Ahorro 0
        3531022 Salsa Sabor Ajo	7.210A
        7 0.555/KGM x 6.280 V. Ahorro 0
        1166	Cebolla Blanca S	3.485
        8	1/u x 6.600 V. Ahorro 1, 980
        3578929 Chorizo Santarro	4.620A
        Impuesto ICUI 20% $665
        9 1/u x 15.350 V. Ahorro 9.210
        3649296 Choco Cookies Ch	6. 140A
        Total Item :9`;
          expect(extractProducts(ocr)).toEqual([
            { description: 'Sixpack Cola&Pol [Carulla]', price: 10625 },
            { description: 'Galletas Antojos [Carulla]', price: 3132 },
            { description: 'Galletas Antojos [Carulla]', price: 3132 },
            {
              description:
                'Pechuga Blanca M — 1.085 kg @ $16.915/kg (antes $19.900/kg, -15%) [Carulla]',
              price: 18353
            },
            { description: 'Galletas Yogurt [Carulla]', price: 4640 },
            { description: 'Salsa Sabor Ajo [Carulla]', price: 7210 },
            {
              description: 'Cebolla Blanca — 0.555 kg @ $6.280/kg [Carulla]',
              price: 3485
            },
            { description: 'Chorizo Santarro [Carulla]', price: 4620 },
            { description: 'Choco Cookies Ch [Carulla]', price: 6140 }
          ]);
        });
      });

      // Mixed: múltiples sub-patrones en el mismo recibo
      describe('mixed sub-patterns — PRIORIDAD 1 + 2 + principal en el mismo recibo', () => {
        it('handles KGM + 1/u mix — last product missing price is skipped (original case 11)', () => {
          const ocr = `PLU	DETALLE	PRECIO
        1 0.965/KGM x 21.500 V. Ahorro 4.150
        3618616 Pechuga Campesin	16.598
        2 1.140/KGM x 19.900 V. Ahorro	4.537
        3618617 Pechuga Blanca M	18.149
        3 0.500/KGM x 46.280 V. Ahorro	4.628
        847221 LOMO CARACHA*	18.512
        4 1/u x 19.900 V. Ahorro 0
        3207320 Estuche Surtido	19. 900A
        5 0.905/KGM x 2.400 V. Ahorro 0
        1055	Limon Tahiti A G	2.172
        6 0. 570/KGM x 29.280 V. Ahorro	3.338	13.352
        876865 PECHO CORRIENTE
        - Total Item :6`;
          expect(extractProducts(ocr)).toEqual([
            {
              description:
                'Pechuga Campesin — 0.965 kg @ $17.199/kg (antes $21.500/kg, -20%) [Carulla]',
              price: 16598
            },
            {
              description:
                'Pechuga Blanca M — 1.140 kg @ $15.920/kg (antes $19.900/kg, -20%) [Carulla]',
              price: 18149
            },
            {
              description:
                'Lomo Caracha — 0.500 kg @ $37.024/kg (antes $46.280/kg, -20%) [Carulla]',
              price: 18512
            },
            { description: 'Estuche Surtido [Carulla]', price: 19900 },
            {
              description: 'Limon Tahiti A G — 0.905 kg @ $2.400/kg [Carulla]',
              price: 2172
            }
            // Pecho Corriente omitido: precio en línea de unidad sin producto en siguiente → no parseable
          ]);
        });

        it('handles partial KGM lines — product with two extra noise price columns (original case 16)', () => {
          const ocr = `PLU	DETALLE	PRECIO
        1 1.990/KGM x 19,900 V. Ahorro 7.920
        3618617 Pechuga Blanca M	31.581
        2 0.590/KGM * 21.640 V. Ahorro 638
        353067 PEPINO RES*	12.130
        3 0. 500/KGM * 21.640 V. Ahorro	541
        353067 PEPINO RES*	10.279	1.347
        4 0.920/KGM x 29.280 V. Ahorro
        876865 PECHO CORRIENTE	25.591
        Total Item :4
       `;
          expect(extractProducts(ocr)).toEqual([
            {
              description:
                'Pechuga Blanca M — 1.990 kg @ $15.920/kg (antes $19.900/kg, -20%) [Carulla]',
              price: 31581
            },
            {
              description: 'Pepino Res — 0.590 kg @ $20.559/kg (antes $21.640/kg, -5%) [Carulla]',
              price: 12130
            },
            { description: 'Pecho Corriente [Carulla]', price: 25591 }
          ]);
        });

        it('handles large mixed receipt — 1/u and KGM, price after tab in unit line (original case 18)', () => {
          const ocr = `PLU	DETALLE	PRECIO
        1 1/u x 17.900 V. Ahorro 0
        3598388 Huevo Napoles Li	17,900
        2 1/u x 17.350 V. Ahorro 0
        3555950 Bebida Lactea Ba	17.350A
        3 1/u x 10.450 V. Ahorro 0
        3611964 Granola Familiar	10. 450A
        4 1/u x 10.380 V. Ahorro 0
        1721	Fresa	10.380
        5 0.485/KGM x 5.720 V. Ahorro 0
        1532	Aguacate Hass	2.774
        15 0.625/KGM x 4.180 V. Ahorro 0	2.613
        1166	Cebolla Blanca S
        7 1.390/KGM x 3.160 V. Ahorro	0	4.392
        1253	Banano
        8 1/u x 2.980 V. Ahorro 0	2.980
        3750923 Leche Semid Desl
        9 1/u x 2.980 V.Ahorro 0	2,980
        3750923 Leche Semid Desl
        10 1/u x 2.800 V. Ahorro	2.800A
        806731 Pasabocas Con To
        : 1
        `;
          expect(extractProducts(ocr)).toEqual([
            { description: 'Huevo Napoles Li [Carulla]', price: 17900 },
            { description: 'Bebida Lactea Ba [Carulla]', price: 17350 },
            { description: 'Granola Familiar [Carulla]', price: 10450 },
            { description: 'Fresa [Carulla]', price: 10380 },
            {
              description: 'Aguacate Hass — 0.485 kg @ $5.720/kg [Carulla]',
              price: 2774
            },
            {
              description: 'Cebolla Blanca — 0.625 kg @ $4.180/kg [Carulla]',
              price: 2613
            },
            {
              description: 'Banano — 1.390 kg @ $3.160/kg [Carulla]',
              price: 4392
            },
            { description: 'Leche Semid Desl [Carulla]', price: 2980 },
            { description: 'Leche Semid Desl [Carulla]', price: 2980 },
            { description: 'Pasabocas Con To [Carulla]', price: 2800 }
          ]);
        });
      });

      // ── Bug pendiente ────────────────────────────────────────────────────────
      // Tab como separador entre ahorro y precio en línea de unidad.
      // Ver: carulla-parser-context.md → Bug A y Bug B
      // ────────────────────────────────────────────────────────────────────────
      describe('tab-separated price in unit line [BUG PENDIENTE]', () => {
        it('handles tab between savings and price — Pepino KGM price=0 workaround (original case 19)', () => {
          const ocr = `PLU	DETALLE	PRECIO
        1 1/u x 12.500 V. Ahorro 3.125
        449804 SIXPACK COLA&POL	9.375A
        IMP. CONS. LICORES	:840
        1/u x 31.000 V. Ahorro 0
        3409475 CafÃº Liofilizado	31. 000E
        3	1/u x 32.850 V. Ahorro 6.570
        3079238 Desod Barra Derm	26. 280A
        4 1/u x 32.850 V. Ahorro 6.570
        3079238 Desod Barra Derm	26. 280A
        5 1/u x 43.350 V. Ahorro 17.340
        114143 Cepillo de Dient	26. 010A
        6 1/u x 45.600 V. Ahorro 15.960
        3384077 Crema Dental Tot	29.640A
        7 1/u x 30.300 V. Ahorro 9,090	21. 210A
        3019241 Enjuague Bucal T	0
        8 1.150/KGM x 26.980 V. Ahorro	31.027
        353067 PEPINO RES*
        9 1/u x 14.950 V. Ahorro 2,990	11. 960A
        313461 Galletas Origina
        10 1/u x 6.600 V. Ahorro 990	5.610A
        1209602 PONQUE TRADICION
        11 0.965/KGM x 32.980 V. Ahorro 0	31.826
        869437 AMPOLLETA CORRIE
        Total Item :11
        `;
          expect(extractProducts(ocr)).toEqual([
            { description: 'Sixpack Cola&Pol [Carulla]', price: 9375 },
            // Café Liofilizado omitido: sin número de ítem al inicio de la línea de unidad
            { description: 'Desod Barra Derm [Carulla]', price: 26280 },
            { description: 'Desod Barra Derm [Carulla]', price: 26280 },
            { description: 'Cepillo De Dient [Carulla]', price: 26010 },
            { description: 'Crema Dental Tot [Carulla]', price: 29640 },
            // Enjuague Bucal T omitido: "0" al final de la línea del producto es ambiguo/ruido OCR
            // BUG A: PRIORIDAD 1 captura "V. Ahorro\t31.027" como ahorro en vez de precio
            {
              description: 'Pepino Res — 1.150 kg @ $-0/kg (antes $26.980/kg, -100%) [Carulla]',
              price: 0
            },
            // BUG B: falta .replace(/\s/g,'') en cleanPrice de PRIORIDAD 3 → "11. 960" da 11 en vez de 11960
            { description: 'Galletas Origina [Carulla]', price: 11960 },
            { description: 'Ponque Tradicion [Carulla]', price: 5610 },
            { description: 'Ampolleta Corrie — 0.965 kg @ $32.980/kg [Carulla]', price: 31826 }
          ]);
        });
      });
    });
  });

  describe('invoice type Exito', () => {
    it('should extract a single product from invoice type Exito', () => {
      const ocr =
        'PLU\tDETALLE\tPRECIO\t\r\n1 1/u x 4.578 V. Ahorro 229\t229\t\r\n647588 GALLETA WAFER SI\t4.349A\t\r\nTotal Item :1\t\r\n';
      expect(extractProducts(ocr)).toEqual([
        { description: 'Galleta Wafer Si [Exito]', price: 4349 }
      ]);
    });

    it('should parse single product from Carulla receipt', () => {
      const carullaText = `
          PLU DETALLE PRECIO
          1 1/u x 4.578 V . Ahorro 229 647588 GALLETA WAFER SI 4.349A
          Total Item :1
          `;

      expect(extractProducts(carullaText)).toEqual([
        { description: 'Galleta Wafer Si [Exito]', price: 4349 }
      ]);
    });
  });

  describe('D1 receipts', () => {
    it('should handle multiple products from invoice type D1', () => {
      const ocr =
        '108 18U811\t\r\nHI\tCAN UM VALOR U\tCODIGO\tDESCRIPCION\tVALOR IU\t\r\n2,300\t\r\n1\t1 UN\t2,300 7700304378074 CREMA DE LECH\t2,300\t\r\n6,990\t\r\n2\t1 UN\t6,990 7700304811090 TOCINETA AHUM\t6,990\t\r\n1 UN\t4,500\t7700304016525 ARROZ PREMIUM\t4,500\t\r\n1 UN\t9,990\t7700304792825 CAFE INSTAN/L\t9,990\t\r\nTOTAL\t23,780\t\r\nOTRO\t-30\t\r\n';
      expect(extractProducts(ocr)).toEqual([
        { description: 'Crema De Lech [D1]', price: 2300 },
        { description: 'Tocineta Ahum [D1]', price: 6990 },
        { description: 'Arroz Premium [D1]', price: 4500 },
        { description: 'Cafe Instan/L [D1]', price: 9990 }
      ]);
    });

    it('should handle from invoice type D1 Case 2', () => {
      const ocr =
        '#I\tCAN UM VALOR U\tLLO VU14\tCODIGO\tUo: 19:31\t\r\nDESCRIPCION\t\r\n1\t1\tUN\tVALOR ID\t\r\n4,300 7700304509423 INFUSION FRUT\t4,300 A\t\r\nFFF\tUN\tUN\t2,950 7700304649631 SALSA DE PINA\t2,250 7700304305209 SERVILLETA CO\t1,650 A\t2,950 A\t2,250 A\t\r\n2\tUN\t1,650 7700304861682 ESPONJA MALLA\t\r\n1\tUN\t9,990 7700304792825 CAFE INSTAN/L\t9,990 C\t\r\nTOTAL\t21,140\t\r\n';
      expect(extractProducts(ocr)).toEqual([
        { description: 'Infusion Frut [D1]', price: 4300 },
        { description: 'Salsa De Pina [D1]', price: 2950 },
        { description: 'Servilleta Co [D1]', price: 2250 },
        { description: 'Esponja Malla [D1]', price: 1650 },
        { description: 'Cafe Instan/L [D1]', price: 9990 }
      ]);
    });
    it('should handle from invoice type D1 Case 3', () => {
      const ocr = `valludulul Blal AUL0
        #I CAN UM VALOR U	CODIGO	DESCRIPCION	VALOR ID
        1	2 UN	11,900 7700304792825 CAFE INSTAN/L	23,800 C
        2	1 UN	1,300 7700304305223 AJO MALLA X 3	1,300 6
        3	1 UN	3, 850 7700304918294 CREMA LAVALOZ	3,850
        4	1 UN	2,300 7700304305292 GELATINA SIN	2,300	A
        5	1 UN	3,490 7700304357307 GELATINA SABO	3,490	A
        6	1 UN	7,490 7702914604383 CHOCORAMO 65G	7,490	A
        TOTAL	42,230
        DACAN`;
      expect(extractProducts(ocr)).toEqual([
        { description: 'Cafe Instan/L [D1]', price: 23800 },
        { description: 'Ajo Malla X [D1]', price: 1300 },
        { description: 'Crema Lavaloz [D1]', price: 3850 },
        { description: 'Gelatina Sin [D1]', price: 2300 },
        { description: 'Gelatina Sabo [D1]', price: 3490 },
        { description: 'Chocoramo [D1]', price: 7490 }
      ]);
    });
    it('should handle from invoice type D1 Case 4', () => {
      const ocr =
        '#I CAN UM VALOR U\tCODIGO\tDESCRIPCION\tVALOR ID\t\r\n1\t1 UN\t2,600 7702084138039 HARINA DE MAI\t2,600 C\t\r\n2\t1 UN\t2, 100 7700304194575\tCOLORANTE NAT\t2,100\t\r\nTOTAL\t4,700\t\r\nFODMA DE PAGO• CONTANO - VAIOR PAGADO\t700\t\r\n';
      expect(extractProducts(ocr)).toEqual([
        { description: 'Harina De Mai [D1]', price: 2600 },
        { description: 'Colorante Nat [D1]', price: 2100 }
      ]);
    });
    it('should handle from invoice type D1 Case 5', () => {
      const ocr =
        '#I CAN UM VALOR U\tCODIGO\tDESCRIPCION\tVALOR ID\t\r\n1\tUN\t3,500 7700304211180\tDETERGENTE MU\t\r\n3,500 A\t\r\n2\tUN\t2,900 7700304530939 BLANQUEADOR B\t\r\n2,900 A\t\r\nTOTAL\t6,400\t\r\n';
      expect(extractProducts(ocr)).toEqual([
        { description: 'Detergente Mu [D1]', price: 3500 },
        { description: 'Blanqueador [D1]', price: 2900 }
      ]);
    });
    it('should handle from invoice type D1 Case 6', () => {
      const ocr = `CULM
        #I CAN UM VALOR U	CODIGO	DESCRIPCION	VALOR ID
        1	1 UN	2,600 7702084138039 HARINA DE MAI	2,600 C
        1 UN	25,950 7700304833252 ACEITE CANOLA	25,950 A
        1 UN	1,650 7700304644988 TOALLA DE COC	1,650 A
        C
        UN	1,700 7700304473953 HARINA DE TRI	1	,700
        UN	1,300 7700304305223 AJO MALLA X 3	2	600 6
        UN	2,000 7702007224023 CHOCOLATINA W	4,000 A
        38,500`;
      expect(extractProducts(ocr)).toEqual([
        { description: 'Harina De Mai [D1]', price: 2600 },
        { description: 'Aceite Canola [D1]', price: 25950 },
        { description: 'Toalla De Coc [D1]', price: 1650 },
        { description: 'Harina De Tri [D1]', price: 1700 },
        { description: 'Ajo Malla X [D1]', price: 2600 },
        { description: 'Chocolatina W [D1]', price: 4000 }
      ]);
    });
  });
  describe('DolarCity receipts', () => {
    it('should handle multiple products DollarCity case(1)', () => {
      const ocr =
        '1\tBOLSA RECICLADA\t\r\n1112\t430.00 B\t\r\n1 @\t430.00\t\r\n2\tSCRUBBER-CLEANZ ESPONJA QUITAM\t\r\n220810003773\t5000.00 B\t\r\n1\t5000.00\t\r\n3\tCANDELA GRANDE DE CUMPLEAÑOS #\t\r\n667888278244\t2500.00 B\t\r\n1\t2500.00\t\r\n4\tALFOMBRA DE BAÑO DE ESPUMA\t\r\n667888388400\t18000.00 B\t\r\n1@\t18000.00\t\r\n5\tMARCADORES MAGNETICOS C/BORRAD\t\r\n667888463459\t12000.00 B\t\r\n1 @ 12000.00\t\r\n6\tGOL BARRA CON ARROZ INFLADO 3U\t\r\n7702007080612\t4000.00 B\t\r\n1 0\t4000.00\t\r\n7 GALLETAS CON ALMENDRA KURABIE\t\r\n7703963056086\t10000.00 B\t\r\n1 @ 10000.00\t\r\n8\tImpuesto Bolsa Plástica\t\r\n999999\t70.00 P\t\r\n1\t70.00\t\r\nTOTAL\tCOP 52000,00\t\r\nMASTERCARD\t\r\nCOP 52000.00\t\r\nREGISTRO DE LA TRANSACCION\t\r\n';
      expect(extractProducts(ocr)).toEqual([
        { description: 'Bolsa Reciclada', price: 430 },
        { description: 'Scrubber-Cleanz Esponja Quitam', price: 5000 },
        { description: 'Candela Grande De CumpleañOs #', price: 2500 },
        { description: 'Alfombra De BañO De Espuma', price: 18000 },
        { description: 'Marcadores Magneticos C/Borrad', price: 12000 },
        { description: 'Gol Barra Con Arroz Inflado 3u', price: 0 }, //4000
        { description: 'Galletas Con Almendra Kurabie', price: 10000 },
        { description: 'Impuesto Bolsa PláStica', price: 1 } // 70
      ]);
    });
  });
  describe('Ara receipts', () => {
    it('should handle Ara receipsts (case 1)', () => {
      const ocr =
        'Jeronimo Martins Colombia S. A. S.\t\r\nNIT: 900. 480. 569-1\t\r\nComprobante de entrega\t\r\nArtículo\tDescripción\tValor\t\r\n07704269659070 CEPIL DENTAL\t4.490 G\t\r\n07704269131675 REMOV BEBEAU\t5. 490 G\t\r\n07704269474024 ROD DESM B. B\t3. 150 G\t\r\n17704269613539 TOAL HUME BB\t7. 680 G\t\r\n2 UN X\t3. 840\t\r\n07704269374454 LIMP AGENTEX\t2. 250 G\t\r\n07706261000072 PANDERO MINI\t5. 990 D\t\r\nTotal\t\r\n29. 050\t\r\nEfectivo\t50. 000\t\r\nCambio:\t20. 950$\t\r\nArticulos Vendidos: 7\t\r\n';
      expect(extractProducts(ocr)).toEqual([
        { description: 'Cepil Dental [Ara]', price: 4490 },
        { description: 'Remov Bebeau [Ara]', price: 5490 },
        { description: 'Rod Desm B B [Ara]', price: 3150 },
        { description: 'Toal Hume Bb [Ara]', price: 7680 },
        { description: 'Limp Agentex [Ara]', price: 2250 },
        { description: 'Pandero Mini [Ara]', price: 5990 }
      ]);
    });
    it('should handle Ara receipsts (case 2)', () => {
      const ocr = `alle de
        Artículo	Valor
        DescripciÃ³n
        07704269865907 MAQ AFE SKI/	2. 990 G
        07707301111642 PAN PERRO 37	3. 600 E
        07704269434585 TOSTONES PLA	4. 400 G
        Total	:	64. 520
        Efectivo	100. 000`;
      expect(extractProducts(ocr)).toEqual([
        { description: 'Maq Afe Ski/ [Ara]', price: 2990 },
        { description: 'Pan Perro [Ara]', price: 373600 }, // mejora cuando tiene números
        { description: 'Tostones Pla [Ara]', price: 4400 }
      ]);
    });
    it('should handle Ara receipsts (case 3)', () => {
      const ocr = `TUNIN UL TOUC
          # Articulo	Descripcion	Valor Imp.
          1 7704269114289 FUSILLI ARRI	3. 990 D
          1 UN	X	3. 990
          2 7707597576149 VELAS MEDITA	18. 990 G
          1 UN	18. 990
          3 7704269691636 QUESO SABANE	9. 990 B
          1 UN	X	9. 990
          4 7704269459830 QUESO HOLAND	8. 300 G
          1 UN	8.300
          5 7704269415195 MAIZ DUCLE	X	5. 990 G
          1 UN	5. '	990
          6 7704269100701 LENTEJA DL	3. 190 E
          1 UN	X	3. 190
          44. 946
          SUB TOTAL:	44. 946
          TATAI.`;
      expect(extractProducts(ocr)).toEqual([
        { description: 'Fusilli Arri [Ara]', price: 3990 },
        { description: 'Velas Medita [Ara]', price: 18990 },
        { description: 'Queso Sabane [Ara]', price: 9990 },
        { description: 'Queso Holand [Ara]', price: 8300 },
        { description: 'Maiz Ducle X [Ara]', price: 5990 },
        { description: 'Lenteja Dl [Ara]', price: 3190 }
      ]);
    });

    it('should handle Ara receipsts (case 4)', () => {
      const ocr = `Articulo	Descripcion
        7704269113343 LECHE DESL	Valor Imp	2. 890	B
        2	1 UN	X	2. 890
        7702047040058 COLADA VAINI	3. 500 G
        2 UN	X	1. 750
        SUB TOTAL:	5, 831
        Ð¢Ð¾Ñ‚Ð»Ñ– .
        `;
      expect(extractProducts(ocr)).toEqual([
        { description: 'Leche Desl Valor Imp [Ara]', price: 2890 },
        { description: 'Colada Vaini [Ara]', price: 3500 }
      ]);
    });
  });
  describe('drogueries', () => {
    it('cruz verde case(1)', () => {
      const ocr = `DETALLE DE VENTA
          DESCRIPCION	CANT	TARIFA IVA VALOR
          DAGYNFIL (2+2) % CTX20GR	0%	71.400
          TUBO
          ***13_AC FARMA AGOSTO	-8. 500
          TOTAL AHORRO	-8. 500
          TOTAL SIN REDONDEO	62. 900
          REDONDEO
          TOTAL FACTURA	62. 900
        `;
      expect(extractProducts(ocr)).toEqual([
        { description: 'Dagynfil (2+2) % Ctx20gr 0%', price: 62900 }
      ]);
    });
    it('cruz verde case(2)', () => {
      const ocr = `DETALLE DE VENTA
        DESCRIPCION	CANT	TARIFA IVA VALOR
        137.30
        AMOXIDAL 1000MG TAB	7	0%
        0
        CJX28	CAJA	-13.730
        ***15_MIERCOLES DE MEDICAMENTOS CLU
        TOTAL AHORRO	-13. 730
        TOTAL SIN REDONDEO	123. 570
        REDONDEO
        TOTAL FACTURA	73541
        `;
      expect(extractProducts(ocr)).toEqual([
        { description: 'Amoxidal 1000mg Tab 7 0%', price: 123570 }
      ]);
    });
  });
  describe('other receipts', () => {
    it('should handle other receipsts with headers', () => {
      const ocr = `Precio Cantidad UN Producto $ 8.500,00 1 Und. GENOVESA BAILEYS PORCIÓN $ 7.500,00 1 Und. GE NOVESA CHOCOLATE PORCIÓN  25.000,00 $ 1 Und. TORTA ENVINADA OCTAVO Und. ALFAJOR CAJA X 8 UN $ 10.000,00 $
      $ 25.000,00 $ 1 Und. TORTA ENVINADA OCTAVO Und. ALFAJOR CAJA X 8 UN $ 10.000,00 $`;
      expect(extractProducts(ocr)).toEqual([
        { description: 'Genovesa Baileys PorcióN', price: 8500 },
        { description: 'Ge Novesa Chocolate PorcióN', price: 7500 },
        { description: 'Torta Envinada Octavo', price: 25000 }
        // { description: 'Alfajor Caja X 8 Un', price: 10000 }
      ]);
    });
    it('should extract products from tabular receipt layout Restaurant case(2)', () => {
      const ocr = `Valor,	Valor
        Producto	Cant,	Unit	Total
        PETIT DEJEUNER	26,500	26,500
        TORTAS PORCION	1	14,000	14,000
        CHOCOLATE
        `;
      expect(extractProducts(ocr)).toEqual([
        { description: 'Petit Dejeuner', price: 26500 },
        { description: 'Tortas Porcion', price: 14000 }
      ]);
    });
  });
  describe('Super Carnes JH receipts', () => {
    it('should parse products with weight from Super Carnes JH (case 1)', () => {
      const ocr = `DantUIN. CKA 29 #33-40
        CODIGO	PRODUCTO	TOTAL | IVA
        4040 Tilapia rio claro	16.435 | 0
        0,865 KGS X $19.000
        3003 Muslo A Granel	11.618 | 0
        1,570 KGS X	$7.400
        TOTAL KILOS: 2.435
        TOTAL UNIDADES: 0
        SUBTOTAL	$28.053
        $0
        DESCUENTO
        $0
        IVA
        $28.053
        TOTAL`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Tilapia Rio Claro — 0.865 kg @ $19.000/kg [SuperCarnesJH]', price: 16435 },
        { description: 'Muslo A Granel — 1.57 kg @ $7.400/kg [SuperCarnesJH]', price: 11618 }
      ]);
    });

    it('should handle Super Carnes JH with gramos instead of kilos (case 2)', () => {
      const ocr = `CODIGO	PRODUCTO	TOTAL | IVA
        5020 Carne Molida Premium	8.500 | 0
        500 GRS X $17.000
        2010 Pechuga Sin Hueso	12.750 | 0
        750 GRAMOS X $17.000
        TOTAL KILOS: 1.250
        TOTAL UNIDADES: 0`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Carne Molida Premium — 0.5 kg @ $17.000/kg [SuperCarnesJH]', price: 8500 },
        { description: 'Pechuga Sin Hueso — 0.75 kg @ $17.000/kg [SuperCarnesJH]', price: 12750 }
      ]);
    });

    it('should handle Super Carnes JH with OCR errors (case 3)', () => {
      const ocr = `CODIGO	PRODUCTO	TOTAL | IVA
        4040 Tilapia rio claro	16435 | 0
        0.865 KG X $19000
        3003 Muslo A Granel	11618 | 0
        1.570 KILOS X 7400
        TOTAL KILOS: 2.435`;

      expect(extractProducts(ocr)).toEqual([
        {
          description: 'Tilapia Rio Claro 16435 | 0 — 0.865 kg @ $19.000/kg [SuperCarnesJH]',
          price: 16435
        },
        {
          description: 'Muslo A Granel 11618 | 0 — 1.57 kg @ $7.400/kg [SuperCarnesJH]',
          price: 11618
        }
      ]);
    });

    it('should handle Super Carnes JH without total price on same line (case 4)', () => {
      const ocr = `CODIGO	PRODUCTO
        4040 Tilapia rio claro
        0,865 KGS X $19.000
        16.435
        3003 Muslo A Granel
        1,570 KGS X $7.400
        11.618
        TOTAL KILOS: 2.435`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Tilapia Rio Claro — 0.865 kg @ $19.000/kg [SuperCarnesJH]', price: 16435 },
        { description: 'Muslo A Granel — 1.57 kg @ $7.400/kg [SuperCarnesJH]', price: 11618 }
      ]);
    });

    it('should limit products by TOTAL UNIDADES when present (case 5)', () => {
      const ocr = `CODIGO	PRODUCTO	TOTAL | IVA
        4040 Tilapia rio claro	16.435 | 0
        0,865 KGS X $19.000
        3003 Muslo A Granel	11.618 | 0
        1,570 KGS X	$7.400
        5050 Extra Product	5.000 | 0
        0.500 KGS X $10.000
        TOTAL KILOS: 2.935
        TOTAL UNIDADES: 2`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Tilapia Rio Claro — 0.865 kg @ $19.000/kg [SuperCarnesJH]', price: 16435 },
        { description: 'Muslo A Granel — 1.57 kg @ $7.400/kg [SuperCarnesJH]', price: 11618 }
      ]);
    });

    it('should handle Super Carnes JH with mixed spacing (case 6)', () => {
      const ocr = `CODIGO PRODUCTO TOTAL|IVA
        4040 Tilapia rio claro 16.435|0
        0,865KGS X$19.000
        3003 Muslo A Granel 11.618|0
        1,570 KGS X $7.400
        TOTAL KILOS:2.435`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Tilapia Rio Claro — 0.865 kg @ $19.000/kg [SuperCarnesJH]', price: 16435 },
        { description: 'Muslo A Granel — 1.57 kg @ $7.400/kg [SuperCarnesJH]', price: 11618 }
      ]);
    });
  });
  describe('Fruver La Granja receipts', () => {
    it('should parse products with mixed units from Fruver La Granja (case 1)', () => {
      const ocr = `in. 18/12/2025 10:00
        I PRODUCTO	CANT V.UNID	V.PROD
        N MANGO TOMY	0,665 KI	1.900	1.264
        N PAPA CRIOLLA	0,445 KI	4.400	1.958
        N PLATANO VERDE	0,395 KI	3.580	1.414
        N BANDEJA MANZANA	1 UN	5.500	5.500
        N FRESA BANDEJA	1 UN	4.500	4.500
        TOTAL PROD: 5`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Mango Tomy — 0.665 kg @ $1.900/kg [FruverLaGranja]', price: 1264 },
        { description: 'Papa Criolla — 0.445 kg @ $4.400/kg [FruverLaGranja]', price: 1958 },
        { description: 'Platano Verde — 0.395 kg @ $3.580/kg [FruverLaGranja]', price: 1414 },
        { description: 'Bandeja Manzana — 1 un @ $5.500/un [FruverLaGranja]', price: 5500 },
        { description: 'Fresa Bandeja — 1 un @ $4.500/un [FruverLaGranja]', price: 4500 }
      ]);
    });

    it('should handle Fruver La Granja with KG instead of KI (case 2)', () => {
      const ocr = `PRODUCTO	CANT V.UNID	V.PROD
        N TOMATE CHONTO	1,250 KG	3.200	4.000
        N CEBOLLA CABEZONA	0,850 KG	2.800	2.380
        N ZANAHORIA	0,500 KG	3.600	1.800`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Tomate Chonto — 1.25 kg @ $3.200/kg [FruverLaGranja]', price: 4000 },
        { description: 'Cebolla Cabezona — 0.85 kg @ $2.800/kg [FruverLaGranja]', price: 2380 },
        { description: 'Zanahoria — 0.5 kg @ $3.600/kg [FruverLaGranja]', price: 1800 }
      ]);
    });

    it('should handle Fruver La Granja with decimal points instead of commas (case 3)', () => {
      const ocr = `PRODUCTO	CANT V.UNID	V.PROD
        N MANGO TOMY	0.665 KI	1.900	1.264
        N PAPA CRIOLLA	0.445 KI	4.400	1.958
        N BANDEJA MANZANA	1 UN	5.500	5.500`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Mango Tomy — 0.665 kg @ $1.900/kg [FruverLaGranja]', price: 1264 },
        { description: 'Papa Criolla — 0.445 kg @ $4.400/kg [FruverLaGranja]', price: 1958 },
        { description: 'Bandeja Manzana — 1 un @ $5.500/un [FruverLaGranja]', price: 5500 }
      ]);
    });

    it('should handle Fruver La Granja with UND instead of UN (case 4)', () => {
      const ocr = `PRODUCTO	CANT V.UNID	V.PROD
        N AGUACATE HASS	3 UND	2.500	7.500
        N LIMON TAHITI	2 UNID	1.000	2.000
        N PIMENTON ROJO	1 UN	3.200	3.200`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Aguacate Hass — 3 un @ $2.500/un [FruverLaGranja]', price: 7500 },
        { description: 'Limon Tahiti — 2 un @ $1.000/un [FruverLaGranja]', price: 2000 },
        { description: 'Pimenton Rojo — 1 un @ $3.200/un [FruverLaGranja]', price: 3200 }
      ]);
    });

    it('should handle Fruver La Granja with KILO instead of KI (case 5)', () => {
      const ocr = `PRODUCTO	CANT V.UNID	V.PROD
        N ARRACACHA	1,200 KILO	4.500	5.400
        N YUCA	0,750 K	3.000	2.250`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Arracacha — 1.2 kg @ $4.500/kg [FruverLaGranja]', price: 5400 },
        { description: 'Yuca — 0.75 kg @ $3.000/kg [FruverLaGranja]', price: 2250 }
      ]);
    });

    it('should handle Fruver La Granja without "N" prefix (case 6)', () => {
      const ocr = `PRODUCTO	CANT V.UNID	V.PROD
        MANGO TOMY	0,665 KI	1.900	1.264
        PAPA CRIOLLA	0,445 KI	4.400	1.958
        BANDEJA MANZANA	1 UN	5.500	5.500`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Mango Tomy — 0.665 kg @ $1.900/kg [FruverLaGranja]', price: 1264 },
        { description: 'Papa Criolla — 0.445 kg @ $4.400/kg [FruverLaGranja]', price: 1958 },
        { description: 'Bandeja Manzana — 1 un @ $5.500/un [FruverLaGranja]', price: 5500 }
      ]);
    });

    it('should handle Fruver La Granja with prices in separate line (case 7)', () => {
      const ocr = `PRODUCTO	CANT V.UNID	V.PROD
        N MANGO TOMY	0,665 KI
        1.900	1.264
        N PAPA CRIOLLA	0,445 KI
        4.400	1.958`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Mango Tomy — 0.665 kg @ $1.900/kg [FruverLaGranja]', price: 1264 },
        { description: 'Papa Criolla — 0.445 kg @ $4.400/kg [FruverLaGranja]', price: 1958 }
      ]);
    });

    it('should handle Fruver La Granja with multiple units of same product (case 8)', () => {
      const ocr = `PRODUCTO	CANT V.UNID	V.PROD
        N AGUACATE HASS	5 UN	2.500	12.500
        N LIMON TAHITI	10 UN	500	5.000
        N TOMATE	2,5 KI	3.200	8.000`;

      expect(extractProducts(ocr)).toEqual([
        { description: 'Aguacate Hass — 5 un @ $2.500/un [FruverLaGranja]', price: 12500 },
        { description: 'Limon Tahiti — 10 un @ $500/un [FruverLaGranja]', price: 5000 },
        { description: 'Tomate — 2.5 kg @ $3.200/kg [FruverLaGranja]', price: 8000 }
      ]);
    });
  });
});
