# utils/commentary

Última verificación: 18 Nov 2026 · Estado: vigente (reemplaza a `commentary.README.md`)
Marcas: **[Verificado]** = contrastado con el código · **[Sin verificar]** = no se vio el código.

Capa intermedia entre `CommentaryInput` (UI) y `commentaryParser` (análisis): detecta qué plantilla corresponde a
una subcategoría, valida el texto en vivo y guarda en AsyncStorage el historial y la configuración. Mapa del
sistema: `docs/specs/comentarios.md`.

```
commentaryTemplates.utils.ts   detectores + builders de chips + validación
assetTemplates.utils.ts        detectores, chips y validación de bienes (se consulta PRIMERO)
copagoTemplates.utils.ts       chips y validación de copagos            [Sin verificar]
commentaryDate.utils.ts        normalizeMonthAbbr, formatDateShort, formatDateWithYear   [Sin verificar]
commentaryHistory.utils.ts     historial de comentarios en AsyncStorage
templateStorage.utils.ts       configuración de plantillas en AsyncStorage + versionado
```

---

## 1. `getDefaultTemplateConfig(subcategoryId, subcategoryName, categoryName)` [Verificado]

Detecta el tipo **por nombre** (minúsculas) y devuelve la configuración con sus chips. Orden de evaluación; el
primero que coincide gana:

| #   | Detector                 | Criterio (sobre el nombre; entre paréntesis, la categoría)                                                              | Resultado                         |
| --- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 0   | `getAssetTemplateConfig` | bienes: ver `docs/domain/bienes.md`                                                                                     | structured, `asset`               |
| 1   | `isRestaurant`           | contiene `salidas a comer`, `comida lista` o `almuerzo comprado`                                                        | semi, `custom`                    |
| 2   | `isUtilityLight`         | `luz`, `electricidad`, `energia`                                                                                        | structured, `utility` (Kw)        |
| 3   | `isUtilityWater`         | `agua` sin `aguardiente`                                                                                                | structured, `utility` (M3)        |
| 4   | `isUtilityGas`           | igual a `gas`, o empieza por `gas(` o `gas `                                                                            | structured, `utility` (M3)        |
| 5   | `isProteins`             | `proteina`, `proteína`, `carne`, `pollo`, `pescado`                                                                     | structured, `product` (proteins)  |
| 6   | `isGroceries`            | `mercado`, `verdura`, `fruta`                                                                                           | structured, `product` (groceries) |
| 7   | `isIngredients`          | `ingredientes` o `desayunos y cenas`                                                                                    | structured, `product` (groceries) |
| 8   | `isLiquor`               | `licor`, `cerveza`, `vino`                                                                                              | structured, `product` (liquor)    |
| 9   | `isRetention`            | `nómina`, `nomina`, `retenci`, `salario`, `seguridad social`                                                            | structured, `retention`           |
| 10  | `isCopago`               | `copago`, `moderadora`                                                                                                  | structured, `copago`              |
| 11  | `isMortgage`             | `apto`, `apartamento`, `préstamo`, `prestamo`, `cuota` (menos moderadora/copago)                                        | semi, `custom`                    |
| 12  | `isPsychology`           | `psicolog`, `terapia`, `consulta`                                                                                       | semi, `custom`                    |
| 13  | `isCellPlan`             | `celular`, `plan ` (con espacio), `teléfono`, `telefono`                                                                | semi, `custom`                    |
| 14  | `isTransport`            | `transporte`, `taxi`, `uber`, `bus`, `metrolinea`, `megabus`, `indriver`, `didi`, `beat` (o categoría con `transporte`) | semi, `custom`                    |
| 15  | `isFamilyAid`            | `ayuda`, `regalo` (o categoría con `regalo` y nombre con `familiar`)                                                    | semi, `custom`                    |
| 16  | `isNutrition`            | `nutrici`                                                                                                               | semi, `custom`                    |
| 17  | `isSports`               | `deporte`, `futsal`, `fútbol`, `futbol`, `gym`, `gimnasio`                                                              | semi, `custom`                    |
| 18  | `isRent`                 | `arriendo`, `arrendamiento`                                                                                             | semi, `custom`                    |
| 19  | `isVacation`             | `vacacion`, `vacación`, `viaje` (o categoría con `vacacion`)                                                            | semi, `vacation`                  |
| —   | respaldo                 | ninguno                                                                                                                 | free, `none`, sin chips           |

- **El orden importa:** `isCopago` va antes que `isMortgage` ("cuota moderadora" contiene "cuota"); los
  restaurantes van antes que celular porque `isCellPlan` busca `plan ` con espacio.
- Los criterios son subcadenas: `bus` coincide dentro de otras palabras. Si una subcategoría nueva recibe chips
  que no debe, es lo primero que se revisa.
- El contrato de nombres con comida está en `docs/domain/alimentacion.md`.
- Niveles: `structured` = tiene parser y validación en vivo; `semi` = chips de guía sin validación;
  `free` = sin chips, solo historial.

## 2. `validateCommentary(commentary, config)` [Verificado]

- Si `enableValidation` es falso → `neutral`; si el texto está vacío → `empty`.
- Casos con validación en vivo: `utility`, `product`, `retention`, `asset`, `copago`. Cualquier otro tipo →
  `neutral`.
- Usa expresiones regulares livianas, **no** importa los parsers completos (evita dependencias circulares).
- Estados: `valid` (borde verde) · `warning` (borde amarillo, con mensaje) · `neutral` · `empty`.
- Un parser con `enableValidation: true` necesita su `case` aquí; si no, el borde nunca cambia.

## 3. Historial (`commentaryHistory.utils.ts`) [Verificado]

- Clave: `commentary_history_{id}` con `{ subcategoryId, entries, savedAt }`.
- `saveCommentaryToHistory(id, comentario, costo, fecha)`: evita duplicados exactos, guarda máximo **20**
  entradas (la más reciente primero) y falla en silencio.
- `getCachedHistory(id)`: lee el caché (`[]` si no hay).
- `mergeHistorySuggestions(vivos, caché, máx = 6)`: primero los del backend (`source: 'live'`), luego el caché
  (`'cached'`); deduplica por texto en minúsculas; máximo 6.
- `filterSuggestions(sugerencias, texto)`: filtra por "contiene" sin distinguir mayúsculas; devuelve todas si el
  texto está vacío. Compara contra el comentario **completo**, no contra una línea.

## 4. Configuración de plantillas (`templateStorage.utils.ts`) [Verificado]

- Clave: `template_config_{id}`.
- `CONFIG_VERSION` (hoy **8**). Cualquier configuración guardada con una versión menor, o sin versión, se
  considera obsoleta. También lo es una de `utility`, `product`, `retention`, `copago`, `vacation` o `asset` con
  los chips vacíos.
- `getTemplateConfig(id, nombre, categoría)`:
  1. Lee AsyncStorage.
  2. Si existe y es **obsoleta** → genera el default, lo guarda en segundo plano (conservando solo la marca
     `isCustomized`) y devuelve el nuevo. Las personalizaciones de chips se pierden.
  3. Si existe y está vigente → la devuelve **tal cual**, aunque el nombre de la subcategoría haya cambiado.
  4. Si no existe, o el JSON está dañado → default sin guardar.
- `registerDefaultTemplateConfig(config)`: guarda el default con `isCustomized: false`. Se llama al guardar
  un gasto; **siempre sobrescribe** (deuda D6 si hubiera una configuración personalizada).
- `saveTemplateConfig(config)`: guarda con `isCustomized: true`. Solo para edición manual desde Ajustes.
- `resetTemplateConfig(id)`, `clearAllTemplateConfigs()` (no toca el historial),
  `getAllCustomizedTemplates()` (devuelve **todas** las configuraciones guardadas, no solo las personalizadas;
  la usa `CommentaryTemplatesScreen`).

### Historial de versiones

| Versión | Cambio                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------- |
| v1      | Inicial (sin versión)                                                                                |
| v2      | Copago estructurado, vacaciones, arreglo del orden `isCopago` / `isMortgage`                         |
| v3      | Parser de bienes (`asset`)                                                                           |
| v4 a v6 | Sin documentar                                                                                       |
| v7      | Restaurantes (Salidas a comer, Comida lista, Almuerzo comprado) e Ingredientes con chips de producto |
| v8      | Chip "Evento" (`#NombreEvento`) en restaurantes                                                      |

**Cuándo subirla:** al cambiar chips o `parserType` de cualquier subcategoría. Sin eso, quien ya tiene la
configuración guardada no ve el cambio.

## 5. Ids de ingresos [Verificado]

Los ingresos solo tienen categoría. Para no chocar en AsyncStorage con ids de subcategorías de gasto se usa
`INCOME_CATEGORY_OFFSET` (100.000), definido en `~/constants/commentary` (ver `cambios-previos-a-specs.md`):
categoría 554 → `template_config_100554`. `CreateIncomeScreen` pasa `categoryName="Ingresos"` y el nombre de la
categoría como `subcategoryName`.

## 6. Claves de AsyncStorage

```
template_config_1444      SubcategoryTemplateConfig + configVersion + isCustomized
template_config_100554    igual, para una categoría de ingresos
commentary_history_1444   CachedCommentaryHistory (últimas 20 entradas)
```

## 7. Tests

`src/utils/__tests__/commentary/` y `src/utils/__tests__/commentaryParser/templateChipSync.test.ts`
**[Sin verificar]** el contenido de los de `commentary/`.

## 8. Decisiones y descartes

| Fecha      | Decisión                                                                  | Por qué                                            |
| ---------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| (anterior) | Detectar por nombre, no por id                                            | Funciona para cualquier usuario                    |
| (anterior) | `registerDefaultTemplateConfig` en vez de `saveTemplateConfig` al guardar | El segundo marca la plantilla como editada         |
| Nov 2026   | Restaurantes se evalúan después de bienes y antes de servicios públicos   | No dependen de cómo se nombren otras subcategorías |
| Nov 2026   | `isIngredients` reutiliza los chips de Mercado                            | El formato de producto ya se pega allí             |

## 9. Pendientes

- D6: `registerDefaultTemplateConfig` puede pisar una plantilla personalizada.
- Documentar las versiones v4 a v6.
- Verificar `copagoTemplates.utils.ts`, `commentaryDate.utils.ts` y los tests de `utils/__tests__/commentary/`.
