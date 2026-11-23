# components/CommentaryInput

Última verificación: 18 Nov 2026 · Estado: vigente (reemplaza a `CommentaryInput.README.md`)
Marcas: **[Verificado]** = contrastado con el código · **[Sin verificar]**.

Entrada inteligente del comentario. Reemplaza al `MyInput` de tipo textarea en `CreateExpenseScreen` y
`CreateIncomeScreen` cuando el feature flag `commentary_suggestions` está activo. Mapa del sistema:
`docs/specs/comentarios.md`; plantillas y caché: `src/utils/commentary/SPEC.md`.

```
CommentaryInput.tsx          componente principal
TemplateChips.tsx            fila de chips de formato rápido
HistorySuggestions.tsx       desplegable de comentarios anteriores        [Sin verificar]
useCommentaryInput.hook.ts   toda la lógica de estado
index.ts                     re-export
```

---

## 1. Uso y props [Verificado]

```tsx
import CommentaryInput from '~/components/CommentaryInput';

<CommentaryInput
  control={control}
  setValue={setValue}
  currentValue={commentaryValue} // useWatch({ control, name: 'commentary' }) ?? ''
  subcategoryId={subcategoryId}
  subcategoryName={subcategoryName}
  categoryName={categoryName}
  recentExpenses={expenses as RecentExpenseForSuggestion[]}
/>;
```

El componente es **genérico** (`CommentaryInput<T extends CommentaryForm>`, con `commentary: string` en el
formulario) y recibe `setValue` tipado (`UseFormSetValue<T>`): **no** hace falta ningún cast.

| Prop              | Tipo                            | Descripción                                                     |
| ----------------- | ------------------------------- | --------------------------------------------------------------- |
| `control`         | `Control<T>`                    | react-hook-form                                                 |
| `setValue`        | `UseFormSetValue<T>`            | Para inyectar el texto del chip o de una sugerencia             |
| `currentValue`    | `string`                        | Valor actual del campo (para filtrar y validar)                 |
| `subcategoryId`   | `number \| null`                | Id de la subcategoría (en ingresos, la categoría con offset)    |
| `subcategoryName` | `string?`                       | Para detectar la plantilla                                      |
| `categoryName`    | `string?`                       | Para detectar la plantilla                                      |
| `recentExpenses`  | `RecentExpenseForSuggestion[]?` | Gastos del backend ya cargados (referencia estable por defecto) |

- Límite del campo: **200 caracteres** (constante `MAX_LENGTH`), con y sin el feature flag; coincide con el
  backend.
- En `CreateExpenseScreen` va dentro del flag `commentary_suggestions`; sin flag se usa el `MyInput` simple.
- En `CreateIncomeScreen`: `subcategoryId = categoryId + INCOME_CATEGORY_OFFSET`, `subcategoryName` = nombre de
  la categoría, `categoryName="Ingresos"`, `recentExpenses={[]}`.

## 2. Lo que ve el usuario

1. **Chips** de formato (solo si la configuración los tiene), en una fila con scroll horizontal.
2. **Ayuda del chip** (texto `hint`) bajo la fila de chips, mientras el campo tenga texto.
   _(Requiere aplicar `cambios-previos-a-specs.md`; antes de eso no se mostraba nunca.)_
3. **Campo de texto** (`MyInput` textarea) con `smartPlaceholder` de la plantilla. El borde cambia de color
   según la validación, solo si la plantilla tiene `enableValidation`:

| Estado              | Borde            |
| ------------------- | ---------------- |
| `valid`             | `colors.SUCCESS` |
| `warning`           | `colors.WARNING` |
| `neutral` / `empty` | normal           |

4. **Desplegable de historial** al enfocar el campo, si hay sugerencias filtradas. Al tocar una, **reemplaza todo
   el texto** con el comentario completo anterior (platos y precios incluidos).

## 3. `useCommentaryInput.hook.ts` [Verificado]

Sin estado en el componente principal. Hace:

1. Al cambiar `subcategoryId`, `subcategoryName` o `categoryName`: `getTemplateConfig()` (chips y tipo).
   Cada resultado se guarda con la clave para la que se cargó; si no coincide con la actual, se ignora.
2. Al cambiar `subcategoryId` **o `recentExpenses`**: recarga `getCachedHistory()` y fusiona con el backend
   (`mergeHistorySuggestions`).
3. Con la escritura, con _debounce_ de **200 ms**: filtra las sugerencias (`filterSuggestions`) y valida
   (`validateCommentary`) solo si la plantilla lo pide.
4. `openSuggestions()` abre el desplegable solo si ya hay sugerencias filtradas.

## 4. Chips y sugerencias

- `TemplateChips` recibe `chips`, `onSelect(template, hint?)` y `activeHint?`. Al tocar un chip rellena el texto
  con la plantilla y cierra el desplegable.
- La ayuda se guarda junto a la subcategoría, así se descarta sola al cambiar de subcategoría, y no se muestra
  con el campo vacío.
- Las sugerencias del historial son comentarios **completos**: el mes actual (backend) más hasta 20 guardados
  (caché), máximo 6. No hay sugerencias de "solo el nombre del restaurante" (ver pendientes).

## 5. Decisiones y descartes

| Fecha      | Decisión                                                                | Por qué                                                 |
| ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| (anterior) | Feature flag `commentary_suggestions`                                   | Activar o apagar el sistema sin desplegar               |
| (anterior) | Validación visual con regex livianos                                    | No importar los parsers completos (ciclos)              |
| Nov 2026   | Mantener el desplegable de historial actual para nombres de restaurante | Sirve de aviso de variantes; se evalúa con datos reales |

## 6. Deuda y pendientes

- D2: `TemplateChips` usa chips propios con `TouchableOpacity`; el estándar pide `MyChip`.
- Sugerir solo nombres de restaurante (distintos del historial) si siguen apareciendo variantes
  (BurgerLand / BurguerLand).
- Verificar `HistorySuggestions.tsx` (no se vio el código).
