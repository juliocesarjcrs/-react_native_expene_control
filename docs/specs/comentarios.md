# Sistema de comentarios inteligentes: mapa

Última verificación: 18 Nov 2026 · Estado: vigente
Marcas: **[Sin verificar]** = no se contrastó con código.

Este documento es el **mapa**: qué piezas hay, cómo se conectan y dónde vive cada detalle. No repite los
detalles; los tiene el `SPEC.md` de cada módulo.

---

## 1. Qué problema resuelve

Sin guía, los comentarios de gasto quedan inconsistentes ("Luz", "pago luz", "servicio eléctrico") y no se
pueden analizar. El sistema:

1. **Al crear un gasto:** sugiere chips de formato rápido y el historial de comentarios, para escribir
   siempre igual.
2. **En estadísticas:** parsea esos comentarios y muestra análisis (consumo, precio por kg, sesiones de
   terapia, visitas a restaurantes...).

## 2. Piezas y dónde vive cada una

| Capa                                     | Carpeta                                                       | Detalle en                                           |
| ---------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| Entrada (UI)                             | `components/CommentaryInput/`                                 | `src/components/CommentaryInput/SPEC.md`             |
| Plantillas, historial, caché             | `utils/commentary/`                                           | `src/utils/commentary/SPEC.md`                       |
| Parsers y análisis                       | `utils/commentaryParser/`                                     | `src/utils/commentaryParser/SPEC.md`                 |
| Tipos de cada parser y registry          | `shared/types/utils/commentaryParser/`                        | este documento (registry)                            |
| Tipos de plantillas                      | `shared/types/screens/settings/commentary-templates.types.ts` | `utils/commentary/SPEC.md`                           |
| Pantallas de análisis                    | `Screens/Statistics/commentary-analysis/`                     | `src/Screens/Statistics/commentary-analysis/SPEC.md` |
| Edición de plantillas                    | `Screens/Settings/CommentaryTemplatesScreen`                  | `utils/commentary/SPEC.md` **[Sin verificar]**       |
| OCR de facturas (otra entrada de gastos) | `utils/scanInvoice`, `utils/canonicalizer`, `utils/parsers/`  | `docs/specs/ocr.md`                                  |

## 3. Flujo

**Crear un gasto**

```
Usuario elige subcategoría en CreateExpenseScreen
  → CommentaryInput recibe id, nombre de subcategoría y nombre de categoría
  → useCommentaryInput: getTemplateConfig() (chips) + getCachedHistory() (AsyncStorage)
  → mergeHistorySuggestions(): gastos del backend primero, luego caché; sin duplicados; máx. 6
  → Usuario toca un chip (rellena el texto) o una sugerencia, edita y guarda
  → onSubmit: CreateExpense + saveCommentaryToHistory + registerDefaultTemplateConfig
```

**Analizar**

```
Usuario abre Estadísticas → Análisis de comentarios (menú generado desde COMMENTARY_REGISTRY)
  → entra a la pantalla del parser (ruta del registry)
  → FilterSelector: subcategoría (por id) + rango de fechas
  → findExpensesBySubcategories() → parse*Commentary() por gasto → agrupar y calcular
```

## 4. `COMMENTARY_REGISTRY` (fuente de verdad central)

Archivo: `shared/types/utils/commentaryParser/commentary-registry.ts`. Cada parser tiene **una** entrada.

| parserType | Detectores de subcategoría                                                          | Ruta               | Pantalla (`hasScreen`) |
| ---------- | ----------------------------------------------------------------------------------- | ------------------ | ---------------------- |
| utility    | Luz, Agua, Gas                                                                      | utilityAnalysis    | sí                     |
| product    | Proteínas, Mercado, Licores, Ingredientes desayunos y cenas                         | productPrices      | sí                     |
| retention  | Retenciones Julio, Retenciones Silvia                                               | retentionAnalysis  | sí                     |
| transport  | Taxi, Bus, Uber / Beat / InDrive, Transporte del Trabajo, Transporte a clase inglés | transportAnalysis  | no                     |
| familyAid  | Regalos, Ayuda familiar                                                             | familyAidAnalysis  | no                     |
| nutrition  | Nutrición                                                                           | nutritionAnalysis  | no                     |
| sports     | Deportes                                                                            | sportsAnalysis     | no                     |
| rent       | Arriendo                                                                            | rentAnalysis       | no                     |
| copago     | Cuota moderadora, Copago                                                            | copagoAnalysis     | sí                     |
| vacation   | Vacaciones, Viaje                                                                   | vacationAnalysis   | sí                     |
| asset      | Apartamento, Lote, Casa, Finca, Local (categoría "Bancarios y de inversión")        | assetAnalysis      | sí                     |
| restaurant | Salidas a comer, Comida lista, Almuerzo comprado                                    | restaurantAnalysis | sí                     |

Campos de una entrada: `parserType`, `displayName`, `subtitle`, `icon`, `iconColorKey`, `route`,
`subcategoryDetectors`, `exampleCommentary` (**debe parsear sin devolver null**), `hasScreen?`,
`detectorCategoryName?`.

- `hasScreen: true` solo si la pantalla existe: así el menú no muestra una opción que no abre nada.
- `ParserType` (en `utils/commentaryParser/index.ts`) y `TemplateParserType` (en
  `commentary-templates.types.ts`) **no son lo mismo**: los parsers sin validación en vivo usan
  `parserType: 'custom'` en la plantilla (ej. transporte, restaurantes).
- Las rutas `transportAnalysis`, `familyAidAnalysis`, `nutritionAnalysis`, `sportsAnalysis` y `rentAnalysis`
  están en `StatisticsStackParamList` pero no tienen pantalla registrada en el navegador.

## 5. Orden de los detectores y reglas de caché

El orden de evaluación de los detectores de subcategoría y las reglas de `CONFIG_VERSION` están en
`src/utils/commentary/SPEC.md`. **El orden importa:** `isCopago` va antes que `isMortgage` porque "cuota
moderadora" contiene "cuota".

## 6. Dependencias de nombres con el dominio

Los chips y el OCR leen fragmentos de los nombres de subcategoría. El contrato completo de comida está en
`docs/domain/alimentacion.md` y el de bienes en `docs/domain/bienes.md`.

## 7. Checklist: agregar un parser nuevo

Está en `src/utils/commentaryParser/SPEC.md` (sección "Agregar un parser"). Un parser vive en nueve sitios; si
falta uno, algo falla en silencio.

## 8. Tests del sistema

| Archivo                      | Qué verifica                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `templateChipSync.test.ts`   | El `exampleCommentary` parsea; cada detector activa el parserType correcto; los chips de subcategorías `structured` generan texto parseable |
| `registry-integrity.test.ts` | Campos obligatorios, parserType único, rutas válidas, parsers reales (smoke)                                                                |
| Un test por parser           | Formato, rechazos, cálculos                                                                                                                 |

Si fallan: ver la tabla de causas en `src/utils/commentaryParser/SPEC.md`.

## 9. Decisiones de diseño

- **Por nombre y no por id:** los ids son de cada usuario; los nombres parecidos funcionan para cualquiera.
- **`configVersion` en AsyncStorage:** sin versionado, un cambio de chips no llega a quien ya tiene la
  configuración vieja guardada.
- **`registerDefaultTemplateConfig` y no `saveTemplateConfig`:** el segundo marca la plantilla como
  personalizada (edición manual en Ajustes); el primero solo deja el "sello de uso".
- **Historial local además del backend:** el backend trae los gastos del mes elegido; AsyncStorage conserva
  los últimos 20 comentarios de otros meses. El backend siempre va primero.
- **Tests por tipo de parser y no por el orquestador:** el orquestador con mapa de ids se eliminó; los tests
  llaman directo a cada parser.

## 10. Historial de cambios del sistema

| Fecha    | Cambio                                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------- |
| Nov 2026 | Se elimina `SUBCATEGORY_PARSER_MAP`, `getParserType`, `parseCommentary` y `registerSubcategoryParser` (nadie los usaba) |
| Nov 2026 | Nuevo parser `restaurant` (Salidas a comer, Comida lista, Almuerzo comprado) y su pantalla                              |
| Nov 2026 | Detector `isIngredients` (chips de producto para Ingredientes desayunos y cenas)                                        |
| Nov 2026 | Chip "Evento" y `CONFIG_VERSION` = 8                                                                                    |

## 11. Pendientes

Ver el apartado de pendientes de cada `SPEC.md` y `docs/constitution.md` (deuda técnica).
