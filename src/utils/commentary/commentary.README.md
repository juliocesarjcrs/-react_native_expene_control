# utils/commentary

Utilidades de storage y lógica de templates para el sistema de comentarios inteligentes.
Estos archivos son la capa intermedia entre `CommentaryInput` (UI) y `commentaryParser` (análisis).

## Archivos

```
commentaryTemplates.utils.ts   ← detectores + builders de chips
commentaryHistory.utils.ts     ← historial de comentarios en AsyncStorage
templateStorage.utils.ts       ← config de plantillas en AsyncStorage
```

---

## `commentaryTemplates.utils.ts`

### `getDefaultTemplateConfig(subcategoryId, subcategoryName, categoryName)`

**Función principal.** Detecta el tipo de subcategoría por nombre y retorna la config con chips.

```typescript
const config = getDefaultTemplateConfig(1444, 'Cuota moderadora', 'Salud');
// → { parserType: 'copago', chips: [Terapia, Consulta, Control, Fisiatría], ... }

const config = getDefaultTemplateConfig(99, 'Ropa', 'Vestuario');
// → { parserType: 'none', chips: [], assistanceLevel: 'free' }
```

La detección es **por nombre, no por ID** — funciona para cualquier usuario.

### `validateCommentary(commentary, config)`

Valida el texto actual contra el formato esperado del parser.
Solo aplica si `config.enableValidation === true` (parsers `structured`).

```typescript
validateCommentary('Consumo(79 Kw) 18 Mar - 17 Abr 2026 [Solos]', config);
// → { state: 'valid' }

validateCommentary('Consumo(79 Kw)', config);
// → { state: 'warning', message: 'Falta el periodo de fechas' }
```

Estados: `'valid'` (borde verde) | `'warning'` (borde amarillo) | `'neutral'` | `'empty'`

### `normalizeMonthAbbr(raw)`

Normaliza abreviaciones de mes con errores comunes.

```typescript
normalizeMonthAbbr('Enr'); // → 'Ene'
normalizeMonthAbbr('jan'); // → 'Ene'
normalizeMonthAbbr('ago'); // → 'Ago'
```

---

## `commentaryHistory.utils.ts`

### `saveCommentaryToHistory(subcategoryId, commentary, cost, date)`

Guarda un comentario en el historial local de la subcategoría.

- Evita duplicados exactos
- Mantiene máximo 20 entradas (más reciente primero)
- Fallo silencioso — no bloquea la UI

```typescript
// Llamar en onSubmit de CreateExpenseScreen después de crear el gasto
saveCommentaryToHistory(1444, 'Copago Colmedica terapia física #11/20', 43900, '2026-04-10');
```

### `getCachedHistory(subcategoryId)`

Lee el historial cacheado de AsyncStorage.
Clave: `commentary_history_{subcategoryId}`

### `mergeHistorySuggestions(liveExpenses, cached, maxSuggestions?)`

Fusiona gastos del backend con el cache local.

- Backend (`source: 'live'`) va primero — son más frescos
- Cache (`source: 'cached'`) complementa hasta `maxSuggestions` (default: 6)
- Deduplicación por texto normalizado

```typescript
const suggestions = mergeHistorySuggestions(expenses, cached);
// → [ { commentary, date, cost, source: 'live' }, ... ]
```

### `filterSuggestions(suggestions, query)`

Filtra sugerencias por lo que el usuario está escribiendo.
Búsqueda case-insensitive. Retorna todas si `query` está vacío.

---

## `templateStorage.utils.ts`

### `getTemplateConfig(subcategoryId, subcategoryName, categoryName)`

Lee la config de AsyncStorage. Si no existe o es obsoleta, genera el default.

**Lógica de versionado:**

```
Lee AsyncStorage "template_config_{id}"
  → Sin configVersion o version < CONFIG_VERSION → config obsoleta
      → getDefaultTemplateConfig() → genera chips frescos
      → persiste en background con configVersion actualizada
  → Version vigente → retorna tal cual
  → No existe → getDefaultTemplateConfig() sin persistir
```

> **Importante:** La primera vez que se entra a una subcategoría, la config
> no existe en AsyncStorage y se genera el default en cada render.
> Solo se persiste cuando el usuario guarda un gasto (`registerDefaultTemplateConfig`).

### `registerDefaultTemplateConfig(config)`

Persiste la config por defecto al crear el primer gasto en una subcategoría.
**NO marca `isCustomized: true`** — es solo un registro de uso.

```typescript
// Llamar en onSubmit de CreateExpenseScreen / CreateIncomeScreen
const defaultConfig = getDefaultTemplateConfig(subcategoryId, subcategoryName, categoryName);
registerDefaultTemplateConfig(defaultConfig).catch(() => {});
```

### `saveTemplateConfig(config)`

Guarda una config **editada manualmente por el usuario** desde Settings.
Marca `isCustomized: true` y actualiza `configVersion`.
**No usar para registro automático** — usar `registerDefaultTemplateConfig`.

### `resetTemplateConfig(subcategoryId)`

Elimina la config personalizada. La próxima vez se usará el default.

### `clearAllTemplateConfigs()`

Elimina **todas** las configs guardadas. Útil para debug o migraciones forzadas.
No afecta el historial de comentarios.

### `getAllCustomizedTemplates()`

Retorna todas las configs guardadas en AsyncStorage.
Usado por `CommentaryTemplatesScreen` en Settings.

---

## AsyncStorage — estructura de claves

```
template_config_1444     → SubcategoryTemplateConfig + configVersion
template_config_100554   → Config para categoría de ingresos (id + INCOME_CATEGORY_OFFSET)
commentary_history_1444  → CachedCommentaryHistory con últimas 20 entradas
```

### `configVersion`

Número en `templateStorage.utils.ts` que invalida configs obsoletas.
**Incrementar cuando se cambien chips o parserType de alguna subcategoría:**

```typescript
const CONFIG_VERSION = 2; // ← incrementar aquí al hacer cambios
```

Historial:

- `v1` — inicial (sin versión explícita)
- `v2` — copago estructurado, vacaciones, fix orden isCopago/isMortgage

---

## IDs de ingresos vs gastos

Los ingresos no tienen subcategorías, solo categorías. Para evitar colisión
en AsyncStorage con subcategorías de gastos que puedan tener el mismo ID:

```typescript
// CreateIncomeScreen
const INCOME_CATEGORY_OFFSET = 100_000;
const incomeCommentaryId = categoryId + INCOME_CATEGORY_OFFSET;
// Salario Julio (554) → template_config_100554
```
