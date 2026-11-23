# utils/commentaryParser

Última verificación: 18 Nov 2026 · Estado: vigente (reemplaza a `commentaryParser.README.md`)
Marcas: **[Verificado]** = contrastado con el código del parser · **[Sin verificar]** = tomado del README anterior,
no se vio el código · **[Inferido]**.

Parsers que convierten el texto libre de un comentario en datos estructurados. Cada parser es independiente y
tiene su archivo. Mapa del sistema: `docs/specs/comentarios.md`.

---

## 1. Contrato

- Firma: `parseXCommentary(commentary, cost, date) → XData | null`. Variaciones: `parseRetentionCommentary`
  recibe además `category` y `baseSalary?`.
- Devuelve `null` si el comentario está vacío o no sigue el formato (rechazo deliberado: la pantalla lo cuenta
  aparte). Excepción: el parser de productos casi nunca devuelve `null` (ver 4.2).
- No lanza excepciones; un `try/catch` interno devuelve `null`.
- `date` llega como texto del backend (`YYYY-MM-DD` o ISO). Los parsers no deben mostrar fechas con
  `new Date(texto)`.

## 2. Reglas de import

1. Pantallas, hooks y servicios importan **solo desde `~/utils/commentaryParser`** (el índice).
2. Un parser importa: sus tipos, su propio catálogo (`copagoCatalog`, `assetConcepts`) y
   `~/utils/commentary/commentaryDate.utils`. Nunca `./index`, el registry ni las plantillas.
3. Excepciones de import directo (evitan ciclos): los **tests** de un parser y
   `utils/commentary/*Templates.utils.ts`.
4. Todo lo que una pantalla necesite de un parser (calculadoras, catálogos) debe estar re-exportado en
   `index.ts`. Si falta, se agrega ahí.

## 3. `index.ts`

Re-exporta los parsers y sus calculadoras, y define `ParserType`:
`'utility' | 'product' | 'retention' | 'transport' | 'familyAid' | 'nutrition' | 'sports' | 'rent' | 'copago' |
'vacation' | 'asset' | 'restaurant' | 'none'`.

**Ya no existe** un orquestador (`parseCommentary`, `getParserType`, `SUBCATEGORY_PARSER_MAP`,
`registerSubcategoryParser`, `ParsedCommentary`): nadie los usaba (eliminados en Nov 2026). Qué parser aplica
lo decide la pantalla que lo llama, y los chips se eligen por nombre de subcategoría.
No re-exporta `parseAssetCommentary`, `parseVacationCommentary` ni `assetConcepts`: las pantallas respectivas
los importan según se necesite **[Sin verificar]**.

---

## 4. Formatos por parser

### 4.1 `utilityParser.ts`: Luz, Agua, Gas **[Verificado]**

```
Consumo({cantidad} {Kw|M3}) {d Mes} - {d Mes} [{año}] [{situación}] {notas}
Consumo(79 Kw) 18 Mar - 17 Abr 2026 [Solos]
Consumo(14 M3) 16 Dic - 15 Ene 2026 [Con Margot (24 Dic - 15 Ene)]
Consumo(66 Kw) 17 Ago - 16 Sep 2024 [Visitas: 3] Familia Silvia 17-19 Ago
Consumo(71 Kw) 18 Jul - 16 Ago 2024 [Visita: Monica] 5-10 Ago
```

- `Consumo(N Kw|M3)` es obligatorio; `N` lleva punto decimal (`79.5`), no coma.
- El periodo `d Mes - d Mes` es obligatorio; el año es opcional para el parser (los chips lo ponen en la fecha final).
  Sin consumo o sin periodo → `null`.
- La situación va entre corchetes y es opcional: `[Solos]` · `[Con Margot]` · `[Con Margot (10 Abr - 17 May)]`
  (llegó a mitad del periodo) · `[Margot]` (nombre suelto, sin "Con") · `[Visitas: 2]` / `[Visitas: 3 personas]` ·
  `[Visita: Monica]` · `[Deshabitado 6 días]`.
- Todo lo que sigue al último `]` es nota: se vuelve descripción de las visitas, razón del deshabitado o nota general.
  `notesForDisplay` las une con `•`. Un texto "Margot llegó el 16 Mar" se descarta si ya hay fechas de llegada.
- `totalExtraPeople` = (persona adicional ? 1 : 0) + número de visitas.
- Extrae: `consumption`, `unit`, `periodStart`, `periodEnd`, `isSolo`, `hasExtraPerson` (+ nombre y fechas),
  `hasVisits`, `visitsCount`, `visitsSingleName`, `visitsDescription`, `uninhabitedDays`, `uninhabitedReason`,
  `totalExtraPeople`, `notesForDisplay`.
- Observación: `unit` se convierte con `toUpperCase()`, así que en ejecución vale `'KW'` o `'M3'` aunque el tipo diga
  `'Kw' | 'M3'`; una comparación con `'Kw'` nunca sería verdadera. No se revisó qué pantalla lo usa.
- Observación: cualquier palabra suelta entre corchetes que no sea "Solos" cuenta como persona adicional, y solo se
  evalúa el primer corchete de ese tipo.
- Calculadoras: `calculateConsumptionPerPerson` (promedio de "solos" = `isSolo` o sin extra ni visitas, contra el de
  "con persona adicional"; `null` sin datos), `calculateAdjustedConsumption(consumo, díasDeshabitados, díasPeriodo = 30)`
  (proyecta al periodo completo), `groupByUtilityType`, `getDateRange`. **Solo `parseUtilityCommentary` y
  `calculateConsumptionPerPerson` están re-exportados en el índice.**

### 4.2 `productParser.ts`: Proteínas, Mercado, Licores, Ingredientes desayunos y cenas **[Verificado]**

```
Pechuga — 0,500 kg @ $14.000/kg [Carulla]
Pechuga — 0,500 kg @ $14.000/kg (antes $20.000/kg, -30%) [Carulla]
Leche Entera — 1 un @ $2.400 [D1]
```

- Prueba los patrones en este orden: completo con descuento · completo sin descuento · sin tienda ·
  (OCR roto sin nombre: con y sin descuento, y solo `@ $precio`) · cantidad sin precio con tienda · formato
  antiguo con `a` · solo nombre con tienda · formato antiguo sin `@` · `X kg Producto` · solo nombre.
- **Solo devuelve `null` con texto vacío.** Un comentario sin formato (`Harina [D1]`, `Cebolla junca`) se lee
  como registro **incompleto** (`isIncomplete: true`, sin precio por kg). La pantalla los separa en
  "Sin datos de peso/precio".
- Precio colombiano: `$22.000` y `$4,100` (miles), `$1.234,56` (punto miles, coma decimal), 3+ dígitos tras el
  separador = miles.
- `isWeighed`: un `un` explícito gana; luego un `kg` explícito; luego el catálogo `WEIGHED_PRODUCTS_SPECIFIC` y
  `WEIGHED_CATEGORIES`; por defecto, unidad.
- El nombre puede traer saltos de línea del OCR (se aplanan).
- Extrae: `product`, `quantity`, `pricePerKg` (también para unidades: precio por unidad), `store`, `unit`,
  `originalPricePerKg`, `discountPercent`, `isWeighed`, `isIncomplete`.
- Calculadoras: `findBestPrice(products, nombre)` (ignora incompletos) y `findCheapestStore(products)`.
- Los chips "Solo tienda" generan texto que el parser lee como **incompleto** (no `null`).

### 4.3 `retentionParser.ts`: Nómina, Retenciones, Salario **[Verificado]**

```
Retefu: 517.000
Incapacidad: Prim: 2 días, Eps: 4+18 días
Prima nav: 609.000
Prima gest: 1.555.000
```

- `Retefu:` (o `Retefuente`) es **obligatorio** y se busca en cualquier parte del texto; sin él → `null`.
- Montos: `467.000`, `467000`, `635 mil`. Sumas de días: `4+18`, `2+2+13`.
- `Incapacidad:` (una línea, opcional): `Prim:` (días 1 y 2, sin descuento económico) y `Eps:` (días 3 en adelante).
  Con `baseSalary` y días EPS, calcula el descuento: salario / 30 × 1/3 por día EPS (la EPS paga 2/3 y el empleado
  pierde 1/3).
- `Prima {tipo}: monto` es opcional y repetible (`nav`, `gest`, `jun`...). Suma `totalPrimasRetention` y
  `totalRetentionWithPrimas`.
- Las líneas que no son ninguno de los campos anteriores se guardan como `notes`, unidas con `|`.
- Firma: `parseRetentionCommentary(commentary, cost, date, category, baseSalary?)`.
- Calculadoras (todas re-exportadas): `calculateTotalRetention`, `calculateTotalRetentionWithPrimas`,
  `calculateIncapacidadStats` (días Prim y EPS, descuento total, meses con incapacidad, promedio de días EPS al mes).

### 4.4 `transportParser.ts` **[Sin verificar]**

`Villa Verde a Centro` · `Ida y vuelta Aeropuerto a Villa Verde` · `2 pasajes Pereira a El Cedral` ·
`Recarga 4 pasajes Megabus`. Extrae `origin`, `destination`, `isRoundTrip`, `passengerCount`.
Calculadora: `getMostFrequentRoutes`. Sin pantalla.

### 4.5 `familyAidParser.ts` **[Sin verificar]**

`Ayuda bimensual a Papá Jairo Mar-Abr 2026 #9` · `Saldo de Ayuda bimensual a Papá Jairo Ene-Feb 2026 #8` ·
`Abono Ayuda mensual a Papá Jairo Mar 2026 #2`. Periodicidad: mensual, bimensual, trimestral; corrige meses mal
escritos (`Enr` → `Ene`). Calculadora: `getTotalByPerson`. Sin pantalla.

### 4.6 `nutritionParser.ts` **[Sin verificar]**

`Semana 6 Natural Body Center` (lo que sigue a `-` es nota). Calculadora: `getAvgCostPerWeek`. Sin pantalla.

### 4.7 `sportsParser.ts` **[Sin verificar]**

`Mensualidad Mar (futsal)` · `Cancha Canaan futbol 8` · `Arbitraje Futsal Amistoso`. Detecta el tipo
(`mensualidad`, `cancha`, `arbitraje`, `equipamiento`, `otro`). Calculadora: `getTotalByExpenseType`. Sin pantalla.

### 4.8 `rentParser.ts` **[Sin verificar]**

`22 días mes Febrero 2026` · `Arriendo Mar 2026` · `Nuevo valor apt 1004 Mirador Villa Verde`. Tipo de pago:
`completo`, `parcial`, `nuevo_valor`. Sin pantalla.

### 4.9 `copagoParser.ts` y `copagoCatalog.ts`: "Cuota moderadora" **[Verificado el parser]**

```
[Copago] [Institución] {Acto} {Área} [#N[/Total]] [@Paciente] [- nota libre]
```

- El comentario **no** debe empezar con "Cuota moderadora": el ancla es el **acto**.
- **Acto** (obligatorio): Consulta, Control, Terapia, Urgencia, Examen, Laboratorio, Medicamentos, Procedimiento,
  Domicilio (admite plural y sin tildes). **Área:** obligatoria en Consulta, Control y Terapia.
  Atajos de acto implícito (Hidroterapia, Psicología solas valen como Terapia).
- `#N` = número de cita **de esa especialidad**; en terapias es la sesión y admite `/Total` (la `/` es
  obligatoria: `#4 2026` no es total 2026).
- Sin `@Paciente` se asume `DEFAULT_PATIENT`; los nombres sueltos (Julio, Silvia) se reconocen en datos viejos.
- Lo que sigue a `-` (guion con espacios) es nota. `#18-19` no la activa.
- Solo se parsea la **primera línea** no vacía. Un copago por gasto.
- **Rechazos (`null`):** sin acto; Consulta/Control/Terapia sin área; la palabra "domicilio" con un acto distinto
  de Domicilio (ambiguo); acto al final solo si el área es una especialidad del catálogo.
- Series y ciclos: `getSeriesStats` agrupa por paciente + especialidad; un ciclo nuevo empieza con `#1`, con un
  total distinto o si el número retrocede. Otras calculadoras: `getTotalByInstitution`, `getMonthlySpending`
  (rellena con ceros los meses sin gasto), `getPendingCycles`, `getPatientOptions`.
- Para enseñarle algo nuevo (especialidad, EPS, paciente): editar solo `copagoCatalog.ts`. `DEFAULT_PATIENT` y
  `KNOWN_PATIENTS` son específicos del usuario. Lista de instituciones y especialidades: **[Sin verificar]**
  (catálogo no visto).

### 4.10 `vacationParser.ts`: Vacaciones, Viajes **[Verificado]**

Prueba tres subformatos en este orden y devuelve el primero que coincide (o `null`). Solo se lee la **primera línea**,
salvo `Tarifa:` e `Impuestos:` del alojamiento, que se buscan en cualquier línea.

1. **Alojamiento:** `Alojamiento {Tipo} {Nombre} {N} noche(s) [{Modalidad}] [{Destino}]`, con `Tarifa: 428.618` e
   `Impuestos: 87.037` opcionales. De los corchetes, el que es una modalidad (`Todo incluido`, `Con desayuno`,
   `Media pensión`, `Solo alojamiento`, `Solo habitación`) fija la modalidad y el otro se toma como destino.
   Calcula `pricePerNight` y `baseFarePerNight` (sin impuestos).
2. **Tiquete:** `Tiquete {Aerolínea} {Origen}-{Destino} {N} pasajeros [{d Mes}-{d Mes}]`. Calcula `pricePerPerson`.
3. **Gasto suelto:** `{Destino}: {descripción}`, o con categoría `{Destino}[comida|transporte|alojamiento|atraccion|otro]: {descripción}`
   (una categoría desconocida cuenta como `otro`; sin categoría, también). Por compatibilidad con datos viejos acepta
   un destino conocido al inicio sin dos puntos (`Santa Marta botella de agua`): usa una lista fija de destinos
   (Cartagena, Santa Marta, Valledupar, Manizales, Pereira, Salento, Santa Rosa, Curazao, Panamá...).

- Calculadoras: `getDestinationSummaries` (por destino, total y desglose por tipo y categoría; de mayor a menor gasto)
  y `getLodgingComparisons` (alojamientos de menor a mayor precio por noche).
- **Ninguna de sus funciones está re-exportada en el índice.**

### 4.11 `assetParser.ts` + `assetConcepts.ts`: bienes **[Verificado]**

Gramática `Concepto: detalle [Período] [Etiqueta]`. El catálogo de conceptos, las etiquetas, los períodos y las
reglas contables están en `docs/domain/bienes.md`. El parser importa `commentaryDate.utils` (excepción
documentada en la regla 2).

### 4.12 `restaurantParser.ts`: Salidas a comer, Comida lista, Almuerzo comprado **[Verificado]**

```
Primera línea:   Nombre del restaurante [#Evento] [@Persona] [viáticos] [- nota]
Siguientes:      plato — $precio      (también: $32.000 · 52 mil · plato $32.000 · plato: 32.000)
```

Ejemplos: `Crepes & Waffles` · `Crepes & Waffles\nPollo al Curry — $32.000\nPropina $6.000` ·
`Gustosos @Silvia viáticos` · `Crepes & Waffles #BurgerMaster` · `#Expofuturo\nCarne a la llanera $60.000`.

Reglas:

- **Nombre = primera línea**, sin `#tags`, `@menciones`, "viáticos" ni la nota. Clave de agrupación: sin tildes,
  minúsculas, solo letras y números (`Burger Land` = `BurgerLand` = `burgerland`; `&` no cuenta; `Crepes y Waffles`
  es otro).
- **Plato** = línea con precio. Se ignoran las líneas sin precio y las que empiezan por propina, domicilio,
  servicio, iva, impoconsumo, descuento, envío, total, subtotal o cubierto. Se aceptan viñetas. Un plato con
  cantidad en el nombre (`2 Limonadas $6.000`) es otro plato distinto de `Limonada`.
- **Primera línea con precio** (`$7.000` o `7 mil`) = es un plato, no un nombre: el registro **no es un
  restaurante** (`null`); si trae `#Evento`, cuenta solo como evento y conserva los platos.
- **Evento** = primer `#tag` con al menos una letra (`#4` no es evento). `#BurgerMaster`, `#burger-master` y
  `#Burger_Master` son el mismo evento. Si solo se escribe el evento, el registro cuenta en Eventos pero no en
  un restaurante (`restaurant` y `restaurantKey` vacíos). Un solo evento por registro (el primero).
- **Viáticos** = la palabra "viáticos" en cualquier línea. Las menciones se capitalizan y no afectan el nombre.
- **Rechaza el formato de producto** (`[Tienda]` en cualquier parte, `@ $`, o `N kg`/`N un` en la primera línea),
  porque Comida lista también recibe líneas del OCR.
- **No valida** que los platos sumen el costo. No hay fecha de corte dentro del parser.
- Un plato sin precio en la primera línea con `#Evento` (`Arepa de choclo #Expofuturo`) se lee como un puesto
  llamado "Arepa de choclo".

Calculadoras (`restaurantParser.ts`):

- `getRestaurantStats`: por restaurante, visitas, gasto total, **promedio solo de visitas sin evento** (0 si
  solo hubo eventos), visitas y gasto de eventos, viáticos, primera y última fecha, grafías distintas.
- `getDishHistory(data, minCount = 2, includeEvents = false)`: variación de precio de un plato en un mismo
  restaurante; **excluye los eventos** por defecto.
- `getEventStats`: por evento, visitas, gasto, restaurantes distintos, fechas.
- `getSimilarRestaurants`: pares con nombre casi igual (distancia 1; 2 si ambos tienen 8+ letras; ignora
  nombres de menos de 4 letras). Solo informativo; no fusiona nada.

Análisis completo (`restaurantAnalysis.ts`): `buildRestaurantAnalysis(expenses, range?)` une todo lo anterior,
cuenta los gastos omitidos y arma el **resumen mensual** con `getMonthlySummary` (usa **todos** los gastos, no
solo los legibles; un día cuenta una vez; los meses parciales del rango no se comparan; los meses sin gastos
salen en cero). `toDateKey(Date)` convierte a `YYYY-MM-DD` con la fecha local.

---

## 5. Agregar un parser

Un parser vive en **nueve** sitios. Si falta uno, algo falla en silencio:

| #   | Archivo                                                      | Qué                                                                                                                                                                       |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `shared/types/utils/commentaryParser/{x}-analysis.types.ts`  | Tipos del dato                                                                                                                                                            |
| 2   | `utils/commentaryParser/{x}Parser.ts`                        | Parser y calculadoras                                                                                                                                                     |
| 3   | `utils/commentaryParser/index.ts`                            | Agregar a `ParserType` y re-exportar                                                                                                                                      |
| 4   | `shared/types/utils/commentaryParser/commentary-registry.ts` | Entrada nueva (`exampleCommentary` DEBE parsear); `hasScreen: true` solo cuando exista la pantalla                                                                        |
| 5   | `shared/types/navigator/stack.type.ts`                       | Ruta en `StatisticsStackParamList`                                                                                                                                        |
| 6   | `utils/commentary/commentaryTemplates.utils.ts`              | Detector (en el orden correcto), builder con chips reales, y `case` en `validateCommentary` si es `structured`                                                            |
| 7   | `utils/commentary/templateStorage.utils.ts`                  | Subir `CONFIG_VERSION`                                                                                                                                                    |
| 8   | `__tests__/commentaryParser/`                                | `registry-integrity.test.ts` (rutas válidas, `VALID_PARSER_TYPES`, `case` en `invokeParser`), `templateChipSync.test.ts` (`case` en `parseByType`) y los tests del parser |
| 9   | Pantalla de análisis                                         | Ver `src/Screens/Statistics/commentary-analysis/SPEC.md` (config, navegador, `stackRoutes.ts`)                                                                            |

**Regla de chips:** un chip es texto real que el parser entiende. Los marcadores de posición los reemplaza
`hydrate()` en `templateChipSync.test.ts`.

**Cuando fallan los tests**

| Test que falla                                     | Causa probable                                                |
| -------------------------------------------------- | ------------------------------------------------------------- |
| `exampleCommentary es parseable`                   | El ejemplo del registry no sigue el formato del parser        |
| `subcategoryDetectors activan parserType correcto` | El nombre del detector no coincide con ningún `is{Tipo}()`    |
| `chips structured parsean sin null`                | Un chip sugiere texto que el parser no entiende               |
| `parserType es único`                              | Entrada duplicada en el registry                              |
| `route existe en StatisticsStackParamList`         | Falta la ruta en `stack.type.ts` o en `VALID_ROUTES` del test |
| `tsc`: un `switch` no exhaustivo                   | Falta el `case` del parser nuevo en un test                   |

## 6. Tests

```
jest copagoParser          jest productParser          jest restaurantParser
jest restaurantAnalysis    jest templateChipSync       jest registry-integrity
```

Archivos en `src/utils/__tests__/commentaryParser/`. Existen además `integrationFlow.test.ts` y
`copagoTemplates` (según el README anterior) **[Sin verificar]**.

## 7. Decisiones y descartes

| Fecha    | Decisión                                          | Por qué                                                     |
| -------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Nov 2026 | Se elimina el orquestador y su mapa de ids        | Nadie lo usaba y eran datos del usuario quemados            |
| Nov 2026 | El parser de restaurantes no tiene fecha de corte | Los comentarios viejos corregidos a mano deben poder contar |
| Nov 2026 | Eventos aparte con `#NombreEvento`                | Sus precios no son comparables                              |
| Nov 2026 | No se unen automáticamente los nombres parecidos  | Solo se avisan; se corrigen editando el comentario          |

## 8. Pendientes

- Verificar los parsers marcados **[Sin verificar]** (transport, familyAid, nutrition, sports, rent) y el catálogo
  de copagos, cuando se pasen sus archivos.
- Re-exportar en `index.ts` lo que falta según la regla de imports (calculadoras de utility y todo `vacationParser`),
  después de confirmar quién lo importa directo: `grep -rn "utilityParser\|vacationParser\|assetParser" src --include=*.ts --include=*.tsx | grep -v __tests__`.
- Decidir si `unit` de utility debe quedar `'Kw'` (como dice el tipo) o `'KW'` (como lo produce el parser).
- Si aparecen duplicados de eventos escritos de formas distintas, evaluar un aviso (hoy solo hay para restaurantes).
