# components/CommentaryInput

Componente de entrada inteligente de comentarios.
Reemplaza `MyInput` de tipo `textarea` en `CreateExpenseScreen` y `CreateIncomeScreen`
cuando el feature flag `commentary_suggestions` está activo.

## Archivos

```
CommentaryInput.tsx          ← componente principal
TemplateChips.tsx            ← fila de chips de formato rápido
HistorySuggestions.tsx       ← dropdown de comentarios anteriores
useCommentaryInput.hook.ts   ← toda la lógica de estado
index.ts                     ← re-export
```

---

## Uso

```typescript
import CommentaryInput from '~/components/CommentaryInput';

// En CreateExpenseScreen
{isCommentarySuggestionsEnabled ? (
  <CommentaryInput
    control={control}
    setValue={setValue as (name: string, value: string) => void}
    currentValue={watch('commentary') ?? ''}
    subcategoryId={subcategoryId}
    subcategoryName={subcategoryName}
    categoryName={categoryName}
    recentExpenses={expenses as RecentExpenseForSuggestion[]}
  />
) : (
  <MyInput name="commentary" type="textarea" ... />
)}
```

## Props

| Prop              | Tipo                                    | Descripción                        |
| ----------------- | --------------------------------------- | ---------------------------------- |
| `control`         | `Control<any>`                          | react-hook-form control            |
| `setValue`        | `(name: string, value: string) => void` | Para inyectar templates al campo   |
| `currentValue`    | `string`                                | `watch('commentary') ?? ''`        |
| `subcategoryId`   | `number \| null`                        | ID de la subcategoría seleccionada |
| `subcategoryName` | `string?`                               | Nombre de la subcategoría          |
| `categoryName`    | `string?`                               | Nombre de la categoría padre       |
| `recentExpenses`  | `RecentExpenseForSuggestion[]?`         | Gastos ya cargados del backend     |

> **Nota sobre `setValue`:** react-hook-form tipifica `setValue` con los campos
> del formulario específico. Hacer cast explícito:
>
> ```typescript
> setValue={setValue as (name: string, value: string) => void}
> ```

---

## Lo que el usuario ve

```
┌─────────────────────────────────────────────┐
│  [Terapia]  [Consulta]  [Control]  [Fisiat.] │  ← TemplateChips
│                                              │     (solo si hay chips)
│  Comentario                                  │
│  ┌──────────────────────────────────────┐   │
│  │ Copago Colmedica terapia física #... │   │  ← MyInput (textarea)
│  └──────────────────────────────────────┘   │     borde verde = válido
│                                              │     borde amarillo = warning
│  ┌──────────────────────────────────────┐   │
│  │ 🕐 Comentarios recientes            │   │  ← HistorySuggestions
│  │  Copago Colmedica terapia #11/20    │   │     (aparece al hacer focus
│  │  Copago Colmedica consulta...       │   │      si hay historial)
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## `useCommentaryInput.hook.ts`

Toda la lógica en un hook. No tiene estado en el componente principal.

### Lo que hace

1. **Al cambiar `subcategoryId`** — carga en paralelo:
   - `getTemplateConfig()` → chips y parserType
   - `getCachedHistory()` → historial de AsyncStorage
   - Merge con `recentExpenses` del backend
   - Resultado: `allSuggestions` y `templateConfig`

2. **Al cambiar `recentExpenses`** — re-mergea con cache (el backend tarda más)

3. **Al cambiar `currentValue`** — con debounce de 200ms:
   - Filtra `allSuggestions` por lo que escribe
   - Valida el texto contra el parser (`enableValidation`)

### Flujo del dropdown de historial

```
Usuario hace focus en el textarea
  → MyInput.onFocus → openSuggestions()
  → si filteredSuggestions.length > 0 → showSuggestions = true
  → HistorySuggestions renderiza

Usuario toca una sugerencia
  → handleSuggestionSelect(commentary)
  → setValue('commentary', commentary)
  → hideSuggestions()

Usuario toca X del dropdown
  → hideSuggestions()
```

> **Por qué `filteredSuggestions` y no `allSuggestions` en `openSuggestions`:**
> `allSuggestions` puede estar vacío al hacer focus si la carga aún no terminó.
> `filteredSuggestions` se actualiza junto con `allSuggestions` en el mismo efecto.

---

## `TemplateChips.tsx`

Fila horizontal de chips. Solo se renderiza si `templateConfig.chips.length > 0`.

Al tocar un chip:

1. `setValue('commentary', chip.template)` — rellena el textarea
2. `hideSuggestions()` — cierra el dropdown si estaba abierto

El `hint` del chip seleccionado aparece bajo el textarea como texto de ayuda.

---

## `HistorySuggestions.tsx`

Dropdown que aparece al hacer focus si hay historial.

Cada item muestra:

- Texto del comentario (máx 2 líneas)
- Icono de fuente: `cloud-check` (live/backend) o `clock-outline` (cached/AsyncStorage)
- Fecha formateada y costo

---

## Feature flag

El componente solo se muestra si `commentary_suggestions` está activo:

```typescript
const { isEnabled: isCommentarySuggestionsEnabled } = useFeatureFlag('commentary_suggestions');
```

Si el flag está inactivo, `CreateExpenseScreen` usa el `MyInput` original sin cambios.
Esto permite activar/desactivar el sistema sin deployar.

---

## Validación visual del borde

Solo aplica para parsers con `assistanceLevel: 'structured'` y `enableValidation: true`
(utility, product, retention, copago).

| Estado    | Color del borde             | Cuándo                                    |
| --------- | --------------------------- | ----------------------------------------- |
| `valid`   | `colors.SUCCESS` (verde)    | Formato completo y correcto               |
| `warning` | `colors.WARNING` (amarillo) | Formato parcial — falta algo              |
| `neutral` | Normal (sin override)       | Campo vacío o subcategoría sin validación |

La validación usa regex livianos en `validateCommentary()` — no importa
el parser completo para evitar dependencia circular.

---

## Para ingresos (`CreateIncomeScreen`)

El componente se usa igual, con dos diferencias:

```typescript
// Offset para evitar colisión de IDs con subcategorías de gastos
const INCOME_CATEGORY_OFFSET = 100_000;
const incomeCommentaryId = categoryId ? categoryId + INCOME_CATEGORY_OFFSET : null;

<CommentaryInput
  ...
  subcategoryId={incomeCommentaryId}
  subcategoryName={categoryName}   // ← nombre de categoría como subcategoryName
  categoryName="Ingresos"          // ← hardcodeado
  recentExpenses={[]}              // ← ingresos no tienen array en memoria
/>
```

`recentExpenses={[]}` porque los ingresos no cargan gastos recientes.
El historial sigue funcionando vía AsyncStorage.
