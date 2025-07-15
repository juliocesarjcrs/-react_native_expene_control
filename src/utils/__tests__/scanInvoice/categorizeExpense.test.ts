import { CategoryDropdown } from '~/shared/types/components/modal/MultiExpenseModal.type';
import { categorizeExpense } from '~/utils/scanInvoice';

describe('categorizeExpense', () => {
  const mockCategories: CategoryDropdown[] = [
    {
      label: 'Alimentación',
      value: 414,
      subcategories: [
        { label: 'Desayunos y cenas', value: 1 },
        { label: 'Mercado', value: 2 },
        { label: 'Proteinas', value: 3 },
        { label: 'Gaseosas', value: 4 },
        { label: 'Chucherias', value: 5 },
        { label: 'Licores', value: 6 },
        { label: 'Onces', value: 7 }
      ]
    },
    {
      label: 'Vivienda',
      value: 374,
      subcategories: [
        { label: 'Arriendo', value: 8 },
        { label: 'Agua (Día 25)', value: 9 },
        { label: 'Luz (Día 20)', value: 10 },
        { label: 'Gas(Día 10)', value: 11 },
        { label: 'Internet Hogar (Día 6)', value: 12 },
        { label: 'Artículos limpieza hogar', value: 13 },
        { label: 'Muebles y aparatos de casa+ reparaciones', value: 14 }
      ]
    },
    {
      label: 'Aseo y cuidado personal',
      value: 474,
      subcategories: [
        { label: 'Peluquería', value: 15 },
        { label: 'Manicure y pedicure', value: 16 },
        { label: 'Artículos aseo personal', value: 17 }
      ]
    },
    {
      label: 'Otra Categoría',
      value: 999,
      subcategories: [
        { label: 'Subcategoría Genérica', value: 18 }
      ]
    }
  ];

  it('debería retornar null para ambos IDs cuando la descripción está vacía', () => {
    const result = categorizeExpense('', mockCategories);
    expect(result).toEqual({ categoryId: null, subcategoryId: null });
  });

  describe('Categoría Alimentación', () => {
    it('debería categorizar como "Desayunos y cenas" para descripción con "café"', () => {
      const result = categorizeExpense('café con leche', mockCategories);
      expect(result).toEqual({ categoryId: 414, subcategoryId: 1 });
    });
    it('debería categorizar como "Desayunos y cenas" para descripción con "Huevo Napoles "', () => {
      const result = categorizeExpense('Huevo Napoles ', mockCategories);
      expect(result).toEqual({ categoryId: 414, subcategoryId: 1 });
    });

    it('debería categorizar como "Mercado" para descripción con "fruta"', () => {
      const result = categorizeExpense('compra de fruta', mockCategories);
      expect(result).toEqual({ categoryId: 414, subcategoryId: 2 });
    });

    it('debería categorizar como "Proteinas" para descripción con "pollo"', () => {
      const result = categorizeExpense('pechuga de pollo', mockCategories);
      expect(result).toEqual({ categoryId: 414, subcategoryId: 3 });
    });

    it('debería categorizar como "Gaseosas" para descripción con "coca cola"', () => {
      const result = categorizeExpense('coca cola', mockCategories);
      expect(result).toEqual({ categoryId: 414, subcategoryId: 4 });
    });

    it('debería categorizar como "Chucherias" para descripción con "chocolate"', () => {
      const result = categorizeExpense('chocolate', mockCategories);
      expect(result).toEqual({ categoryId: 414, subcategoryId: 5 });
    });

    it('debería categorizar como "Licores" para descripción con "ron"', () => {
      const result = categorizeExpense('ron viejo', mockCategories);
      expect(result).toEqual({ categoryId: 414, subcategoryId: 6 });
    });

    it('debería categorizar como "Onces" para descripción con "pastel"', () => {
      const result = categorizeExpense('pastel de chocolate', mockCategories);
      expect(result).toEqual({ categoryId: 414, subcategoryId: 5 });
    });
  });

  describe('Categoría Vivienda', () => {
    it('debería categorizar como "Arriendo" para descripción con "alquiler"', () => {
      const result = categorizeExpense('pago de alquiler', mockCategories);
      expect(result).toEqual({ categoryId: 374, subcategoryId: 8 });
    });

    it('debería categorizar como "Agua" para descripción con "acueducto"', () => {
      const result = categorizeExpense('factura acueducto', mockCategories);
      expect(result).toEqual({ categoryId: 374, subcategoryId: 9 });
    });

    it('debería categorizar como "Luz" para descripción con "electricidad"', () => {
      const result = categorizeExpense('servicio electricidad', mockCategories);
      expect(result).toEqual({ categoryId: 374, subcategoryId: 10 });
    });

    it('debería categorizar como "Gas" para descripción con "gas natural"', () => {
      const result = categorizeExpense('gas natural', mockCategories);
      expect(result).toEqual({ categoryId: 374, subcategoryId: 11 });
    });

    it('debería categorizar como "Internet" para descripción con "wifi"', () => {
      const result = categorizeExpense('pago wifi', mockCategories);
      expect(result).toEqual({ categoryId: 374, subcategoryId: 12 });
    });

    it('debería categorizar como "Artículos limpieza" para descripción con "detergente"', () => {
      const result = categorizeExpense('detergente para ropa', mockCategories);
      expect(result).toEqual({ categoryId: 374, subcategoryId: 13 });
    });

    it('debería categorizar como "Muebles y reparaciones" para descripción con "electrodoméstico"', () => {
      const result = categorizeExpense('nuevo electrodoméstico', mockCategories);
      expect(result).toEqual({ categoryId: 374, subcategoryId: 14 });
    });
  });

  describe('Categoría Aseo personal', () => {
    it('debería categorizar como "Peluquería" para descripción con "corte de cabello"', () => {
      const result = categorizeExpense('corte de cabello', mockCategories);
      expect(result).toEqual({ categoryId: 474, subcategoryId: 15 });
    });

    it('debería categorizar como "Manicure" para descripción con "uñas"', () => {
      const result = categorizeExpense('arreglo de uñas', mockCategories);
      expect(result).toEqual({ categoryId: 474, subcategoryId: 16 });
    });

    it('debería categorizar como "Artículos aseo" para descripción con "shampoo"', () => {
      const result = categorizeExpense('shampoo anticaspa', mockCategories);
      expect(result).toEqual({ categoryId: 474, subcategoryId: 17 });
    });
  });

  it('debería usar la primera categoría principal cuando no hay coincidencia', () => {
    const result = categorizeExpense('descripción desconocida', mockCategories);
    // La primera categoría principal es Alimentación (414) y su primera subcategoría es Desayunos y cenas (1)
    expect(result).toEqual({ categoryId: 414, subcategoryId: 1 });
  });

  it('debería usar la primera categoría disponible cuando no hay categorías principales', () => {
    const otherCategories: CategoryDropdown[] = [
      {
        label: 'Transporte',
        value: 100,
        subcategories: [{ label: 'Taxi', value: 101 }]
      }
    ];
    const result = categorizeExpense('descripción cualquiera', otherCategories);
    expect(result).toEqual({ categoryId: 100, subcategoryId: 101 });
  });

  it('debería manejar categorías sin subcategorías', () => {
    const noSubcategories: CategoryDropdown[] = [
      {
        label: 'Sin Sub',
        value: 200,
        subcategories: []
      }
    ];
    const result = categorizeExpense('descripción', noSubcategories);
    expect(result).toEqual({ categoryId: 200, subcategoryId: null });
  });
});