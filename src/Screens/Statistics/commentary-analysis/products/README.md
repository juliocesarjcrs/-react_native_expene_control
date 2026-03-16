# ProductPrices Module

Módulo modular para análisis y comparación de precios de productos.

## 📁 Estructura

```
ProductPrices/
├── ProductPricesScreen.tsx          # Pantalla principal (coordinador)
├── index.ts                         # Exportaciones públicas
├── README.md                        # Este archivo
├── hooks/
│   ├── useProductData.ts            # Lógica de carga y agrupación
│   └── useProductExpansion.ts       # Estado de expansión de cards
├── components/
│   ├── ProductCard/                 # Card de producto completo
│   │   ├── ProductCard.tsx          # Coordinador del card
│   │   ├── ProductCardHeader.tsx    # Cabecera (nombre + promedio)
│   │   ├── ProductCardPrices.tsx    # Mejor/peor precio
│   │   └── ProductCardDetail.tsx    # Lista expandible de compras
│   ├── IncompleteCard/              # Card de producto incompleto
│   │   ├── IncompleteCard.tsx       # Coordinador del card
│   │   └── IncompleteCardDetail.tsx # Lista expandible con botón editar
│   ├── PurchaseDetailModal/         # Modal para ver/editar compra
│   │   ├── PurchaseDetailModal.tsx  # Container del modal
│   │   ├── PurchaseDetailView.tsx   # Vista de solo lectura
│   │   └── PurchaseEditForm.tsx     # Formulario de edición
│   └── shared/                      # Componentes reutilizables
│       ├── SectionHeader.tsx
│       ├── StatsGrid.tsx
│       ├── EmptyState.tsx
│       └── InfoBox.tsx
├── utils/
│   └── formatters.ts                # Helpers de formateo
└── types/
    └── index.ts                     # Tipos compartidos
```

## 🎯 Responsabilidades

### ProductPricesScreen (200 líneas)

- Coordina todos los componentes
- Maneja estado del modal
- Pasa callbacks a componentes hijos
- NO contiene lógica de negocio

### useProductData Hook

- Carga datos del backend
- Agrupa productos por nombre normalizado
- Calcula summaries (promedio, mejor/peor precio)
- Separa completos de incompletos
- Expone método de actualización

### useProductExpansion Hook

- Maneja qué cards están expandidas
- Provee métodos: toggle, collapseAll, expandAll
- Estado encapsulado en Set

### ProductCard

- Coordinador: maneja tap y expansión
- Delega render a subcomponentes
- Anima expansión con LayoutAnimation

### IncompleteCard

- Similar a ProductCard pero con UI de warning
- Botón "Editar" en vez de solo mostrar datos

### PurchaseDetailModal

- Decide si mostrar vista o formulario según `isIncomplete`
- Maneja cierre y guardado

## 🔄 Flujo de Datos

```
ProductPricesScreen
    ↓ loadData(filters)
useProductData
    ↓ fetch + parse + group
    ↓ completeSummaries, incompleteSummaries
ProductCard / IncompleteCard
    ↓ onPurchasePress(purchase)
PurchaseDetailModal
    ↓ onSave(updated)
useProductData.updatePurchase()
    ↓ API call + refresh
ProductPricesScreen (re-render)
```

## 🧪 Testing

### Hooks

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useProductExpansion } from './hooks/useProductExpansion';

test('should toggle expansion', () => {
  const { result } = renderHook(() => useProductExpansion());

  act(() => result.current.toggleExpanded('tomate'));
  expect(result.current.isExpanded('tomate')).toBe(true);
});
```

### Components

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { ProductCard } from './components/ProductCard/ProductCard';

test('should expand on press', () => {
  const onToggle = jest.fn();
  const { getByText } = render(
    <ProductCard summary={mock} onToggleExpand={onToggle} />
  );

  fireEvent.press(getByText('Tomate'));
  expect(onToggle).toHaveBeenCalled();
});
```

## 📦 Importación

```typescript
// Desde otro archivo
import ProductPricesScreen from '~/screens/Statistics/ProductPrices/ProductPricesScreen';

// O usando exports del index
import { useProductData, ProductCard } from '~/screens/Statistics/ProductPrices';
```

## 🚀 Próximas Mejoras

- [ ] Implementar actualización real en BD
- [ ] Agregar tests unitarios
- [ ] Agregar swipe-to-edit en incompletos
- [ ] Implementar pull-to-refresh
- [ ] Optimizar renders con React.memo
- [ ] Agregar skeleton loaders
- [ ] Implementar filtros avanzados
- [ ] Exportar a CSV/Excel

## 📝 Notas

- Todos los componentes usan `useThemeColors()` para dark mode
- Las animaciones usan `LayoutAnimation` (nativo)
- El formulario usa `react-hook-form` (ya en el proyecto)
- Los estilos usan `StyleSheet.create` (mejor performance)
