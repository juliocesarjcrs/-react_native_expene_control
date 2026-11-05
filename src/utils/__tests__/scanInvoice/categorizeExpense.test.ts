import { CategoryDropdown } from '~/shared/types/components/modal/MultiExpenseModal.type';
import { categorizeExpense } from '~/utils/scanInvoice';

const ID = {
  comidaLista: 1,
  mercado: 2,
  postres: 3,
  chucherias: 4,
  licores: 5,
  ingredientes: 6,
  onces: 7,
  proteinas: 8,
  gaseosas: 9,
  almuerzoComprado: 10,
  arriendo: 11,
  mudanza: 12,
  internet: 13,
  agua: 14,
  luz: 15,
  utensilios: 16,
  limpiezaHogar: 17,
  muebles: 18,
  gas: 19,
  servicioLimpieza: 20,
  peluqueria: 21,
  manicure: 22,
  aseoPersonal: 23
};

const buildCategories = (alimentacion: [string, number][]): CategoryDropdown[] => [
  {
    label: 'Alimentación',
    value: 414,
    subcategories: alimentacion.map(([label, value]) => ({ label, value }))
  },
  {
    label: 'Vivienda',
    value: 374,
    subcategories: [
      { label: 'Arriendo', value: ID.arriendo },
      { label: 'Mudanza', value: ID.mudanza },
      { label: 'Internet Hogar (Día 6)', value: ID.internet },
      { label: 'Agua (Día 25)', value: ID.agua },
      { label: 'Luz (Día 20)', value: ID.luz },
      { label: 'Utensilios domésticos', value: ID.utensilios },
      { label: 'Artículos limpieza hogar', value: ID.limpiezaHogar },
      { label: 'Muebles y aparatos de casa+ reparaciones', value: ID.muebles },
      { label: 'Gas(Día 10)', value: ID.gas },
      { label: 'Servicio de limpieza', value: ID.servicioLimpieza }
    ]
  },
  {
    label: 'Aseo y cuidado personal',
    value: 474,
    subcategories: [
      { label: 'Peluquería y estética', value: ID.peluqueria },
      { label: 'Manicure y pedicure', value: ID.manicure },
      { label: 'Artículos aseo personal', value: ID.aseoPersonal }
    ]
  },
  {
    label: 'Otra Categoría',
    value: 999,
    subcategories: [{ label: 'Subcategoría Genérica', value: 99 }]
  }
];

// Nombres NUEVOS (decisión de renombres, regla v7)
const newNames = buildCategories([
  ['Comida lista (sin plan: restaurante, domicilio, panadería)', ID.comidaLista],
  ['Mercado (almuerzo y básicos)', ID.mercado],
  ['Postres y helados comprados', ID.postres],
  ['Chucherías (dulce o snack empacado)', ID.chucherias],
  ['Licores', ID.licores],
  ['Ingredientes desayunos y cenas', ID.ingredientes],
  ['Onces (histórico - no usar)', ID.onces],
  ['Proteínas (carne, pollo, pescado)', ID.proteinas],
  ['Gaseosas (bebidas embotelladas)', ID.gaseosas],
  ['Almuerzo comprado - día de trabajo', ID.almuerzoComprado]
]);

// Nombres ANTERIORES: el OCR debe seguir funcionando antes de renombrar
const legacyNames = buildCategories([
  ['Comida fuera del hogar', ID.comidaLista],
  ['Mercado', ID.mercado],
  ['Postres', ID.postres],
  ['Chucherias', ID.chucherias],
  ['Licores', ID.licores],
  ['Desayunos y cenas', ID.ingredientes],
  ['Onces', ID.onces],
  ['Proteinas', ID.proteinas],
  ['Gaseosas', ID.gaseosas]
]);

const sub = (description: string, categories = newNames) =>
  categorizeExpense(description, categories).subcategoryId;

describe('categorizeExpense', () => {
  it('retorna null para ambos IDs cuando la descripción está vacía', () => {
    expect(categorizeExpense('', newNames)).toEqual({ categoryId: null, subcategoryId: null });
  });

  describe('Alimentación', () => {
    it.each([
      ['café con leche', ID.ingredientes],
      ['Huevo Napoles ', ID.ingredientes],
      ['Pan Integral', ID.ingredientes],
      ['Pan de Bono', ID.ingredientes],
      ['Panela', ID.ingredientes],
      ['Masa para Empanadas', ID.ingredientes],
      ['Yogurt Griego', ID.ingredientes],
      ['Chocolate en Polvo', ID.ingredientes],
      ['compra de fruta', ID.mercado],
      ['Pepino Res', ID.proteinas],
      ['Pecho Corriente', ID.proteinas],
      ['Lomo Caracha', ID.proteinas],
      ['coca cola', ID.gaseosas],
      ['chocolate', ID.chucherias],
      ['Chocolatina Jet Wafer', ID.chucherias],
      ['ron viejo', ID.licores],
      ['Cola y Pola Six Pack', ID.licores]
    ])('"%s" -> subcategoría %i', (description, expected) => {
      expect(sub(description)).toBe(expected);
    });
  });

  describe('Regla v7: embutidos, panadería y ex-Onces', () => {
    it.each([
      ['Jamón de Cerdo', ID.ingredientes],
      ['Chorizo', ID.ingredientes],
      ['Salchicha Perro', ID.ingredientes],
      ['Tocineta Ahumada', ID.ingredientes],
      ['Arepas Paisas', ID.ingredientes],
      ['Jamón pollo', ID.ingredientes], // empate 'jamon'/'pollo': gana la regla que va primero
      ['pastel hawaiano', ID.comidaLista],
      ['Pan Hawaiano', ID.comidaLista],
      ['Bocadillo Veleño', ID.chucherias],
      ['Mantecada', ID.chucherias],
      ['Maní', ID.chucherias],
      ['Maíz Pira', ID.chucherias],
      ['Galletas Integrales', ID.chucherias]
    ])('"%s" -> subcategoría %i', (description, expected) => {
      expect(sub(description)).toBe(expected);
    });
  });

  describe('Falsos positivos detectados en la auditoría', () => {
    it("'ron' ya no captura 'macarrón'", () => {
      expect(sub('Macarrón')).not.toBe(ID.licores);
      expect(sub('Macarrón')).toBe(ID.mercado);
    });

    it("'res' ya no captura 'crespa'", () => {
      expect(sub('Lechuga Crespa')).toBe(ID.mercado);
    });

    it("'pollo' ya no captura 'repollo'", () => {
      expect(sub('Repollo')).toBe(ID.mercado);
    });

    it("'cola' ya no captura 'colada' y 'Piña Colada' sigue en Licores", () => {
      expect(sub('Piña Colada')).toBe(ID.licores);
    });

    it("'lomo' no se pierde en 'solomo'", () => {
      expect(sub('Solomo')).toBe(ID.proteinas);
      expect(sub('Muslo')).toBe(ID.proteinas);
    });
  });

  describe('Formato del OCR (nombre — cantidad @ precio [tienda])', () => {
    it('decide solo por el nombre del producto', () => {
      expect(sub('Pechuga Blanca — 1,150 kg @ $20.900/kg [Carulla]')).toBe(ID.proteinas);
    });

    it('el nombre de la tienda no produce coincidencias', () => {
      expect(sub('Yuca — 1 kg @ $3.000/kg [Pollo Ya]')).toBe(ID.mercado);
    });
  });

  describe('Nombres anteriores a los renombres', () => {
    it('sigue funcionando con los nombres viejos', () => {
      expect(sub('Pechuga', legacyNames)).toBe(ID.proteinas);
      expect(sub('Galleta', legacyNames)).toBe(ID.chucherias);
      expect(sub('Leche Entera', legacyNames)).toBe(ID.ingredientes);
      expect(sub('Cerveza', legacyNames)).toBe(ID.licores);
      expect(sub('Gaseosa', legacyNames)).toBe(ID.gaseosas);
    });

    it('la regla de Comida lista se salta si la subcategoría aún no se llama así', () => {
      const withoutComidaLista = buildCategories([
        ['Comida fuera del hogar', ID.comidaLista],
        ['Mercado', ID.mercado],
        ['Desayunos y cenas', ID.ingredientes]
      ]);
      expect(sub('pastel hawaiano', withoutComidaLista)).toBe(ID.mercado);
    });
  });

  describe('Vivienda', () => {
    it.each([
      ['pago de alquiler', ID.arriendo],
      ['factura acueducto', ID.agua],
      ['servicio electricidad', ID.luz],
      ['pago wifi', ID.internet],
      ['detergente para ropa', ID.limpiezaHogar],
      ['Esponja Malla', ID.limpiezaHogar],
      ['Toalla de Cocina', ID.limpiezaHogar],
      ['Amb Ele Bri+Rep [Ara]', ID.limpiezaHogar],
      ['nuevo electrodoméstico', ID.muebles]
    ])('"%s" -> subcategoría %i', (description, expected) => {
      expect(sub(description)).toBe(expected);
    });
  });

  describe('Aseo y cuidado personal', () => {
    it.each([
      ['corte de cabello', ID.peluqueria],
      ['arreglo de uñas', ID.manicure],
      ['shampoo anticaspa', ID.aseoPersonal],
      ['protectores', ID.aseoPersonal],
      ['Copitos Little', ID.aseoPersonal],
      ['Talco Antibacterial', ID.aseoPersonal]
    ])('"%s" -> subcategoría %i', (description, expected) => {
      expect(sub(description)).toBe(expected);
    });

    it('"Peluquería y estética" ya no depende del nombre exacto', () => {
      expect(sub('peluqueria')).toBe(ID.peluqueria);
    });
  });

  describe('Sin coincidencia', () => {
    it('usa Mercado buscado por nombre, no por posición', () => {
      expect(sub('descripción desconocida')).toBe(ID.mercado);
      expect(sub('descripción desconocida', legacyNames)).toBe(ID.mercado);
    });

    it('si no hay subcategoría Mercado, usa la primera de la categoría', () => {
      const withoutMercado = buildCategories([
        ['Licores', ID.licores],
        ['Gaseosas', ID.gaseosas]
      ]);
      expect(sub('descripción desconocida', withoutMercado)).toBe(ID.licores);
    });

    it('usa la primera categoría disponible cuando no hay categorías principales', () => {
      const otherCategories: CategoryDropdown[] = [
        { label: 'Transporte', value: 100, subcategories: [{ label: 'Taxi', value: 101 }] }
      ];
      expect(categorizeExpense('descripción cualquiera', otherCategories)).toEqual({
        categoryId: 100,
        subcategoryId: 101
      });
    });

    it('maneja categorías sin subcategorías', () => {
      const noSubcategories: CategoryDropdown[] = [
        { label: 'Sin Sub', value: 200, subcategories: [] }
      ];
      expect(categorizeExpense('descripción', noSubcategories)).toEqual({
        categoryId: 200,
        subcategoryId: null
      });
    });
  });
});
