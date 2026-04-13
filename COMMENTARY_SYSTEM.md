# 📝 COMMENTARY_SYSTEM.md

> Sistema de Comentarios Inteligentes — Documentación completa  
> App: Finanzas personales React Native + TypeScript  
> Última actualización: Abril 2026

---

## ¿Qué es este sistema?

Cuando el usuario registra un gasto, escribe un comentario libre. Sin guía, esos comentarios quedan inconsistentes ("Luz", "pago luz", "servicio eléctrico") y no se pueden analizar después.

Este sistema resuelve dos problemas:

1. **Al crear gastos** — sugiere chips de formato rápido y muestra historial de comentarios anteriores, para que el usuario escriba siempre en el mismo formato
2. **En estadísticas** — parsea esos comentarios para extraer datos estructurados (consumo en Kw, precio por kg, sesiones de terapia, etc.) y mostrar análisis valiosos

```
Usuario crea gasto en "Luz"
  ↓
CommentaryInput muestra chips: [Solo] [Con Margot] [Deshabitado] [Con visitas]
  ↓
Usuario toca "Solo" → textarea se rellena con:
  "Consumo(79 Kw) 18 Mar - 17 Abr 2026 [Solos]"
  ↓
Usuario guarda el gasto → comentario se persiste en BD
  ↓
UtilityAnalysisScreen llama al backend → parsea comentarios
  ↓
parseUtilityCommentary() extrae: consumption: 79, unit: 'Kw', isSolo: true
  ↓
Pantalla muestra: promedio solos vs con visitas, historial de consumo
```

---

## Arquitectura general

```
src/
├── components/CommentaryInput/          ← UI de entrada inteligente
│   ├── CommentaryInput.tsx              ← componente principal
│   ├── TemplateChips.tsx                ← chips de formato rápido
│   ├── HistorySuggestions.tsx           ← dropdown de historial
│   └── useCommentaryInput.hook.ts       ← lógica de estado
│
├── utils/commentary/                    ← lógica de templates y storage
│   ├── commentaryTemplates.utils.ts     ← detectores + builders de chips
│   ├── commentaryHistory.utils.ts       ← historial en AsyncStorage
│   └── templateStorage.utils.ts        ← config de plantillas en AsyncStorage
│
├── utils/commentaryParser/              ← parsers de texto → datos estructurados
│   ├── index.ts                         ← orquestador (parseCommentary + ParserType)
│   ├── utilityParser.ts                 ← Luz, Agua, Gas
│   ├── productParser.ts                 ← Proteínas, Mercado, Licores
│   ├── retentionParser.ts               ← Nómina / Retenciones
│   ├── transportParser.ts               ← Taxi, Bus, Uber
│   ├── familyAidParser.ts               ← Ayuda familiar
│   ├── nutritionParser.ts               ← Nutrición
│   ├── sportsParser.ts                  ← Deportes
│   ├── rentParser.ts                    ← Arriendo
│   ├── copagoParser.ts                  ← Copagos médicos
│   └── vacationParser.ts               ← Vacaciones
│
├── shared/types/utils/commentaryParser/ ← tipos de cada parser
│   ├── commentary-analysis.types.ts     ← UtilityConsumption, ProductPrice
│   ├── retention-analysis.types.ts      ← RetentionData
│   ├── transport-analysis.types.ts      ← TransportData
│   ├── family-aid-analysis.types.ts     ← FamilyAidData
│   ├── nutrition-analysis.types.ts      ← NutritionData
│   ├── sports-analysis.types.ts         ← SportsData
│   ├── rent-analysis.types.ts           ← RentData
│   ├── copago-analysis.types.ts         ← CopagoData
│   ├── vacation-analysis.types.ts       ← VacationData
│   └── commentary-registry.ts          ← FUENTE DE VERDAD CENTRAL
│
├── shared/types/screens/settings/
│   └── commentary-templates.types.ts   ← SubcategoryTemplateConfig, TemplateChip
│
└── Screens/Statistics/commentary-analysis/
    ├── CommentaryAnalysisScreen.tsx     ← menú de opciones de análisis
    ├── components/
    │   ├── FilterSelector.tsx           ← selector de subcategoría + fechas
    │   └── EditCommentaryModal.tsx      ← modal genérico para corregir comentarios
    ├── utility/UtilityAnalysisScreen.tsx
    ├── products/ProductPricesScreen.tsx
    ├── retention/RetentionAnalysisScreen.tsx
    ├── copago/CopagoAnalysisScreen.tsx
    └── vacation/VacationAnalysisScreen.tsx
```

---

## La fuente de verdad: `commentary-registry.ts`

**Este es el archivo más importante del sistema.** Cada parser tiene exactamente una entrada aquí que conecta todos los demás archivos.

```typescript
export const COMMENTARY_REGISTRY: CommentaryAnalysisEntry[] = [
  {
    parserType: 'utility', // ← debe existir en ParserType (index.ts)
    displayName: 'Servicios Públicos',
    subtitle: 'Analiza consumo de luz, agua y gas',
    icon: 'flash',
    iconColorKey: 'WARNING',
    route: 'utilityAnalysis', // ← debe existir en StatisticsStackParamList
    subcategoryDetectors: ['Luz', 'Agua', 'Gas'], // ← deben matchear isUtility*()
    exampleCommentary: 'Consumo(100 Kw) 18 Dic - 17 Ene 2026 [Solos]' // ← debe parsear sin null
  }
  // ...
];
```

---

## Parsers disponibles

| ParserType  | Subcategorías               | Formato clave                                                   | Pantalla de análisis      |
| ----------- | --------------------------- | --------------------------------------------------------------- | ------------------------- |
| `utility`   | Luz, Agua, Gas              | `Consumo(79 Kw) 18 Mar - 17 Abr 2026 [Solos]`                   | `UtilityAnalysisScreen`   |
| `product`   | Proteínas, Mercado, Licores | `Pechuga — 0,500 kg @ $14.000/kg [Carulla]`                     | `ProductPricesScreen`     |
| `retention` | Retenciones, Salario        | `Retefu: 517.000\nIncapacidad: Prim: 2 días`                    | `RetentionAnalysisScreen` |
| `transport` | Taxi, Bus, Uber, Transporte | `Villa Verde a Centro`                                          | —                         |
| `familyAid` | Ayuda familiar              | `Ayuda bimensual a Papá Jairo Mar-Abr 2026 #9`                  | —                         |
| `nutrition` | Nutrición                   | `Semana 6 Natural Body Center`                                  | —                         |
| `sports`    | Deportes                    | `Mensualidad Mar (futsal)`                                      | —                         |
| `rent`      | Arriendo                    | `22 días mes Febrero 2026`                                      | —                         |
| `copago`    | Cuota moderadora            | `Copago Colmedica terapia física #11/20`                        | `CopagoAnalysisScreen`    |
| `vacation`  | Vacaciones                  | `Alojamiento Hotel Nombre 4 noches [Todo incluido] [Cartagena]` | `VacationAnalysisScreen`  |

---

## Cómo funciona `CommentaryInput`

```
CreateExpenseScreen selecciona subcategoría "Cuota moderadora" (id: 1444)
  ↓
CommentaryInput recibe: subcategoryId=1444, subcategoryName="Cuota moderadora", categoryName="Salud"
  ↓
useCommentaryInput.hook llama en paralelo:
  → getTemplateConfig(1444, "Cuota moderadora", "Salud")
      → lee AsyncStorage "template_config_1444"
      → si no existe o configVersion es obsoleta → getDefaultTemplateConfig()
          → isCopago("cuota moderadora") = true → buildCopagoConfig()
          → retorna chips: [Terapia] [Consulta] [Control] [Fisiatría]
  → getCachedHistory(1444)
      → lee AsyncStorage "commentary_history_1444"
      → retorna últimos 20 comentarios guardados
  ↓
mergeHistorySuggestions(recentExpenses, cached)
  → backend (live) primero, luego cache, deduplicados, máx 6
  ↓
Usuario ve chips encima del textarea
Usuario hace focus → dropdown con historial aparece
Usuario toca chip "Terapia" → textarea se rellena con template
Usuario edita y guarda
  ↓
onSubmit llama:
  → saveCommentaryToHistory(1444, comentario, costo, fecha)
  → registerDefaultTemplateConfig(config)  ← NO marca isCustomized
```

---

## AsyncStorage — claves utilizadas

| Prefijo                   | Contenido                                             | Ejemplo                   |
| ------------------------- | ----------------------------------------------------- | ------------------------- |
| `template_config_{id}`    | `SubcategoryTemplateConfig` con chips y configVersion | `template_config_1444`    |
| `commentary_history_{id}` | `CachedCommentaryHistory` con últimos 20 comentarios  | `commentary_history_1444` |

### ⚠️ configVersion — anti-cache obsoleta

Cuando se cambian chips o parserType, incrementar `CONFIG_VERSION` en `templateStorage.utils.ts`:

```typescript
const CONFIG_VERSION = 2; // ← incrementar aquí
```

Cualquier config guardada con versión anterior se descarta automáticamente y se regenera la próxima vez que el usuario entra a esa subcategoría. Esto resuelve el problema de producción donde los chips no aparecían porque había configs viejas en AsyncStorage.

---

## Detección de tipo por nombre de subcategoría

Los chips se asignan según el nombre de subcategoría usando detectores en `commentaryTemplates.utils.ts`. La detección es **por nombre** (case-insensitive), no por ID — así funciona para cualquier usuario que nombre sus subcategorías de forma similar.

```typescript
// Orden de evaluación en getDefaultTemplateConfig():
isUtilityLight(name); // "luz", "electricidad", "energia"
isUtilityWater(name); // "agua"
isUtilityGas(name); // "gas"
isProteins(name, cat); // "proteína", "proteina", "carne", "pollo"
isGroceries(name, cat); // "mercado", "verdura", "fruta"
isLiquor(name); // "licor", "cerveza", "vino"
isRetention(name, cat); // "retenci", "nómina", "salario"
isCopago(name); // "copago", "moderadora" ← antes que isMortgage
isMortgage(name); // "apto", "préstamo", "cuota" (excluyendo "moderadora")
isPsychology(name); // "psicolog", "terapia", "consulta"
isCellPlan(name); // "celular", "plan ", "teléfono"
isTransport(name, cat); // "transporte", "taxi", "uber", "bus"
isFamilyAid(name, cat); // "ayuda", "regalo"
isNutrition(name, cat); // "nutrici"
isSports(name, cat); // "deporte", "futsal", "gym"
isRent(name, cat); // "arriendo", "arrendamiento"
isVacation(name, cat); // "vacacion", "viaje"
// fallback → buildFreeConfig (sin chips, solo historial)
```

> **⚠️ El orden importa.** `isCopago` debe evaluarse antes que `isMortgage` porque "cuota moderadora" contiene "cuota" y sería capturada por `isMortgage` si va primero.

---

## IDs especiales para ingresos

`CommentaryInput` también se usa en `CreateIncomeScreen`. Como los ingresos solo tienen `categoryId` (no `subcategoryId`), se aplica un offset para evitar colisión en AsyncStorage:

```typescript
const INCOME_CATEGORY_OFFSET = 100_000;
const incomeCommentaryId = categoryId + INCOME_CATEGORY_OFFSET;
// Ej: Salario Julio (id: 554) → guardado como template_config_100554
```

---

## Checklist para agregar un parser nuevo

Cuando se agrega una subcategoría nueva que merece análisis estructurado:

```
□ 1. Crear tipos en shared/types/utils/commentaryParser/{nombre}-analysis.types.ts
□ 2. Crear parser en utils/commentaryParser/{nombre}Parser.ts
      → exportar parse{Nombre}Commentary()
      → agregar funciones de análisis/calculadoras
□ 3. Actualizar utils/commentaryParser/index.ts
      → agregar al union type ParserType
      → agregar al union type ParsedCommentary
      → importar el parser
      → agregar case en el switch de parseCommentary()
      → re-exportar funciones
□ 4. Actualizar utils/commentary/commentaryTemplates.utils.ts
      → agregar detector is{Nombre}()
      → agregar builder build{Nombre}Config() con chips reales
      → agregar llamada en getDefaultTemplateConfig() en el orden correcto
□ 5. Agregar entry en commentary-registry.ts
      → parserType, displayName, subtitle, icon, iconColorKey
      → route (debe existir en StatisticsStackParamList)
      → subcategoryDetectors (nombres que activan el detector)
      → exampleCommentary (texto que el parser DEBE poder leer)
□ 6. Actualizar StatisticsStackParamList en stack.type.ts
      → agregar la ruta nueva con sus params
□ 7. Crear pantalla de análisis en Screens/Statistics/commentary-analysis/{nombre}/
      → {Nombre}AnalysisScreen.tsx
      → hooks/use{Nombre}Data.ts
      → components/ (cards, items, etc.)
□ 8. Actualizar tests
      → registry-integrity.test.ts: agregar '{nombre}' a VALID_PARSER_TYPES
      → registry-integrity.test.ts: agregar '{nombre}Analysis' a VALID_ROUTES
      → templateChipSync.test.ts: agregar case '{nombre}' en parseByType()
      → incrementar CONFIG_VERSION en templateStorage.utils.ts
```

---

## Tests del sistema

| Archivo                      | Qué verifica                                         |
| ---------------------------- | ---------------------------------------------------- |
| `templateChipSync.test.ts`   | Chips → parser (cada chip genera texto parseable)    |
| `registry-integrity.test.ts` | Registry → routes → parsers (integridad estructural) |

### Cómo correr los tests

```bash
jest templateChipSync
jest registry-integrity
```

### Cuándo fallan y qué significa

| Test que falla                                     | Causa probable                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `exampleCommentary es parseable`                   | El ejemplo en el registry no sigue el formato del parser              |
| `subcategoryDetectors activan parserType correcto` | El nombre del detector no matchea `is{Tipo}()` en templates.utils     |
| `chips structured parsean sin null`                | Un chip sugiere texto que el parser no entiende                       |
| `parserType es único`                              | Se agregó una entry duplicada al registry                             |
| `route existe en StatisticsStackParamList`         | Falta agregar la ruta en `stack.type.ts` o en `VALID_ROUTES` del test |

---

## Decisiones de diseño y por qué

### ¿Por qué detectar por nombre y no por ID?

Los IDs de subcategoría son específicos de cada usuario de la BD. Si se detectara por ID, el sistema solo funcionaría para un usuario específico. Detectando por nombre ("luz", "agua", "proteína") funciona para cualquier usuario que nombre sus subcategorías de forma similar.

### ¿Por qué `configVersion` en AsyncStorage?

Sin versionado, si se mejoran los chips de una subcategoría (ej: copago pasó de `chips: []` a 4 chips), los usuarios en producción nunca ven los chips nuevos porque tienen la config vieja cacheada. Al incrementar `CONFIG_VERSION`, la config obsoleta se descarta automáticamente.

### ¿Por qué `registerDefaultTemplateConfig` y no `saveTemplateConfig`?

`saveTemplateConfig` marca `isCustomized: true` y se usa solo cuando el usuario edita manualmente desde Settings. `registerDefaultTemplateConfig` registra la config sin marcar como personalizada — es solo un "sello de uso" para que la subcategoría aparezca en Settings > Plantillas.

### ¿Por qué el historial usa AsyncStorage y no solo el backend?

El backend ya devuelve los gastos recientes de la subcategoría seleccionada (`recentExpenses`). AsyncStorage complementa con comentarios de otros meses que no están en la respuesta actual del backend. El merge siempre prioriza el backend (source: 'live') sobre el cache.

### ¿Por qué `parseByType` en los tests en lugar de `parseCommentary`?

`parseCommentary` del orquestador necesita un `subcategoryId` que exista en `SUBCATEGORY_PARSER_MAP` (IDs reales de BD). En tests no queremos depender de IDs de producción, así que `parseByType` llama directamente al parser por tipo.

---

## Glosario

| Término                         | Definición                                                                 |
| ------------------------------- | -------------------------------------------------------------------------- |
| `ParserType`                    | Union type que identifica cada parser: `'utility' \| 'product' \| ...`     |
| `TemplateChip`                  | Botón de acceso rápido con label, icon y template de texto                 |
| `SubcategoryTemplateConfig`     | Config completa de una subcategoría: chips, parserType, assistanceLevel    |
| `assistanceLevel`               | `'structured'` (tiene parser), `'semi'` (patrón guiado), `'free'` (libre)  |
| `configVersion`                 | Número que invalida configs obsoletas en AsyncStorage                      |
| `subcategoryDetectors`          | Nombres de subcategorías que activan un parser en el registry              |
| `exampleCommentary`             | Texto de ejemplo que el parser debe poder leer — usado en tests            |
| `registerDefaultTemplateConfig` | Guarda config sin marcar `isCustomized` — para primer uso                  |
| `saveTemplateConfig`            | Guarda config marcando `isCustomized: true` — para edición manual          |
| `INCOME_CATEGORY_OFFSET`        | `100_000` — offset para separar IDs de ingresos de subcategorías de gastos |

---

## Para iniciar un nuevo chat con contexto

Comparte este archivo y menciona:

1. El parser en el que estás trabajando y su formato
2. Si es nuevo o una modificación de uno existente
3. Si el problema es en la capa de entrada (chips/historial) o en la capa de análisis (pantalla de estadísticas)

Con este archivo + el código fuente de los archivos relevantes el asistente tendrá contexto completo.
