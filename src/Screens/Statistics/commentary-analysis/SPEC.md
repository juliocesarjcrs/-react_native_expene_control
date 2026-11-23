# Screens/Statistics/commentary-analysis

Última verificación: 18 Nov 2026 · Estado: parcial (reemplaza a `products/README.md`)
Marcas: **[Verificado]** = contrastado con el código · **[Sin verificar]**.

Pantallas que analizan los comentarios de gastos ya parseados. El menú se genera solo desde
`COMMENTARY_REGISTRY` (entradas con `hasScreen: true`). Mapa del sistema: `docs/specs/comentarios.md`;
formatos y calculadoras: `src/utils/commentaryParser/SPEC.md`. La parte visual manda `APP_DESIGN_STANDARD.md`.

```
commentary-analysis/
  CommentaryAnalysisScreen.tsx   menú (lee COMMENTARY_REGISTRY)                    [Verificado]
  components/FilterSelector.tsx  subcategoría + rango de fechas                    [Verificado]
  components/EditCommentaryModal.tsx   modal genérico para corregir comentarios    [Sin verificar]
  utility/       UtilityAnalysisScreen                                              [Sin verificar]
  products/      ProductPricesScreen + hooks + components                           [Verificado]
  retention/     RetentionAnalysisScreen                                            [Sin verificar]
  copago/        CopagoAnalysisScreen                                               [Sin verificar]
  vacation/      VacationAnalysisScreen                                             [Sin verificar]
  asset/         AssetAnalysisScreen                                                [Sin verificar]
  restaurants/   RestaurantAnalysisScreen + hooks/useRestaurantData                [Verificado]
```

---

## 1. `FilterSelector` [Verificado]

Selector de **una** subcategoría (por id) y un rango de fechas, con el botón "Analizar Comentarios".

| Prop                 | Descripción                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `type`               | `'expenses'` (subcategoría) o `'incomes'` (categoría)             |
| `onAnalyze(filters)` | Recibe `AnalysisFilters`                                          |
| `defaultDaysBack`    | Días hacia atrás para el inicio por defecto (365 si no se indica) |
| `defaultStartDate`   | Si se indica, **gana sobre** `defaultDaysBack`                    |

`AnalysisFilters`: `subcategoryId?`, `subcategoryName?`, `categoryId?`, `categoryName?`, `startDate`, `endDate`.
Una pantalla de análisis recibe los filtros, pide los gastos con `findExpensesBySubcategories`
(`subcategoriesId: number[]`, fechas) y parsea.

## 2. Patrón de una pantalla de análisis

- `Screen` coordina; un hook `use{X}Data` trae y calcula; la lógica pura vive en `utils/commentaryParser`.
- Los gastos llegan con `commentary` que puede ser `null`, `date` como texto y la subcategoría.
- Lo que el parser no lee se **cuenta aparte**; no desaparece en silencio.

## 3. `ProductPricesScreen` (`products/`) [Verificado]

Compara precios de productos entre compras.

```
ProductPricesScreen          coordinador; estado del modal; búsqueda
hooks/useProductData         carga, agrupa por nombre normalizado, calcula resúmenes
hooks/useProductExpansion    qué tarjetas están expandidas
components/ProductCard/      tarjeta completa (cabecera, mejor/peor precio, detalle)
components/IncompleteCard/   tarjeta de producto incompleto
components/PurchaseDetailModal/   ver/editar una compra
components/shared/           SectionHeader, StatsGrid, EmptyState, InfoBox
utils/formatters.ts, types/
```

- `useProductData` devuelve `loading`, `parsedData`, `groupedProducts`, `completeSummaries`,
  `incompleteSummaries`, `currentFilters`, `loadData`, `refreshData`. **No existe** `updatePurchase()` (el README
  anterior lo mencionaba).
- Un resumen es "completo" si `findBestPrice` devuelve un mejor precio; si no, es incompleto ("Sin datos de
  peso/precio").
- Deuda D7: el botón "Editar" no guarda (`handleSavePurchase` es un TODO). Para corregir un comentario se usa la
  edición normal del gasto.
- `components/shared/` (`SectionHeader`, `EmptyState`, `InfoBox`) los reutiliza la pantalla de restaurantes
  importando desde `../products/components/shared/`.

## 4. `RestaurantAnalysisScreen` (`restaurants/`) [Verificado]

Analiza Salidas a comer, Comida lista o Almuerzo comprado (**una** subcategoría por vez). Reglas del parser:
`src/utils/commentaryParser/SPEC.md` (4.12). Decisiones de negocio: `docs/domain/alimentacion.md`.

**Rango.** El inicio por defecto es el **05/11/2026** (constante `CUTOFF_DATE` en el archivo), o hoy si hoy es
anterior. Se puede mover hacia atrás con el selector. Si el rango empieza antes del 05/11, la pantalla avisa que
los comentarios viejos sin nombre aparecen como restaurantes sueltos.

**Orden de la pantalla**

1. Filtros, aviso del rango analizado y buscador de restaurante.
2. Resumen: visitas, gasto, restaurantes.
3. Avisos: viáticos de Silvia; registros omitidos (sin comentario, sin nombre en la primera línea o con formato de
   producto), que cuentan en el resumen por mes pero no en "Por restaurante".
4. **Resumen por mes**, **colapsado por defecto** (un toque lo despliega): para cada mes, días distintos,
   registros, gasto, gasto por día y variación contra el mes anterior (gasto y días). Los meses parciales no se
   comparan. Muestra los 12 más recientes con "Ver todos".
5. **Posibles duplicados** (si hay): nombres casi iguales; se corrigen editando el comentario.
6. **Por restaurante** (lo más visible): visitas, gasto, promedio de visitas sin evento ("Solo en eventos" si
   no hubo), última visita. Al tocar: grafías distintas, viáticos, eventos, y el historial de precio de los
   platos que se repiten (sin eventos).
7. **Eventos** (si hay): por evento, visitas, gasto, última fecha y restaurantes probados.

Sin registros en el rango → estado vacío con el formato esperado. Con registros pero ninguno legible → aviso.

`useRestaurantData` guarda juntos los gastos y el rango cargado, para que el resumen mensual nunca use un rango
viejo, y delega todo el cálculo en `buildRestaurantAnalysis` (lógica pura, con tests).

## 5. Agregar una pantalla de análisis

Después de los pasos 1 a 8 de `src/utils/commentaryParser/SPEC.md` (sección 5):

| #   | Archivo                                                                                      | Qué                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Screens/Statistics/commentary-analysis/{x}/{X}AnalysisScreen.tsx` (+ `hooks/use{X}Data.ts`) | La pantalla                                                                                                                            |
| 2   | `config/screenConfigs.ts`                                                                    | Título y subtítulo (`{x}Analysis`)                                                                                                     |
| 3   | `shared/types/navigator/stack.type.ts`                                                       | Ruta en `StatisticsStackParamList`                                                                                                     |
| 4   | `navigator/stack.tsx`                                                                        | `<StatisticsStack.Screen name="{x}Analysis" component={Routes.{X}AnalysisScreen} />` dentro de `StatisticsStackScreen`                 |
| 5   | `navigator/stackRoutes.ts`                                                                   | Import, entrada en `StackRoutesType` (`{X}AnalysisScreen: typeof {X}AnalysisScreen;`, con los dos puntos) y en el objeto `stackRoutes` |
| 6   | `commentary-registry.ts`                                                                     | `hasScreen: true`                                                                                                                      |

Trampas ya vistas: un espacio o texto suelto entre dos `Screen` rompe el navegador ("A navigator can only contain
'Screen', 'Group'..."); olvidar el `:` en `StackRoutesType` es un error de sintaxis; `useMemo(f, [])` rompe con el
compilador de React.

## 6. Deuda y pendientes

- **D1:** `RestaurantAnalysisScreen.tsx` incumple partes del estándar visual (ver `docs/constitution.md`).
  Refactor propuesto, pendiente de aprobación.
- Verificar las pantallas marcadas **[Sin verificar]** y `EditCommentaryModal`.
- Evaluar, tras usar la pantalla de restaurantes con datos reales: las tres subcategorías juntas.
- El texto "Sin formato reconocido" que se mencionaba en el diseño original no aparece en la pantalla de
  productos (usa "Sin datos de peso/precio"); en otras pantallas **[Sin verificar]**.
