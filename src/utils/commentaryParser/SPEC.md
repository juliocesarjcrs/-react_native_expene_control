# utils/commentaryParser

Última verificación: 18 Nov 2026 · Estado: cerrado con lo verificado (reemplaza a `commentaryParser.README.md`); lo que falta está en la sección 8
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
Re-exporta de `utilityParser` solo `parseUtilityCommentary` y `calculateConsumptionPerPerson` (lo que usa la pantalla), y
de `vacationParser`, `parseVacationCommentary`, `getDestinationSummaries` y `getLodgingComparisons` (lo que usa
`useVacationData`). Las otras calculadoras de utility no se re-exportan porque ninguna pantalla las usa. No re-exporta
`assetParser` ni `assetConcepts`: los bienes los importa `assetAnalytics.ts` desde `./assetParser`, dentro de la misma
carpeta. Hasta el 18 Nov 2026, `UtilityAnalysisScreen.tsx` y `useVacationData.ts` importaban directo del archivo del
parser; ahora importan del índice.

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

### 4.4 `transportParser.ts`: Taxi, Bus, Uber, Transporte **[Verificado]**

```
{Origen} a {Destino}                         Villa Verde a Centro
{Origen} - {Destino}                         Victoria - Villa Verde
Ida y vuelta {Origen} a {Destino}            (también con "-")
{N} pasajes {Origen} a {Destino}             (también con "-")
Recarga {N} pasajes {descripción}            Recarga 4 pasajes Megabus
```

Prueba en este orden: recarga, ida y vuelta, varios pasajes, simple con `a`, simple con `-`. Cualquier otro texto
(`Taxi`) → `null`. Extrae `origin`, `destination`, `isRoundTrip` y `passengerCount` (1 si no se indica). En una
recarga, `origin` es `'Recarga'` y `destination` la descripción.

**Observaciones (verificadas ejecutando el parser):**

- **"Ida y vuelta" y "N pasajes" parten el texto en la primera letra "a" del nombre**, no en la palabra `a`:
  `Ida y vuelta Pereira a El Cedral` → origen `Pereir`, destino `a El Cedral`;
  `2 pasajes Pereira - El Cedral` → origen `Pereir`, destino `- El Cedral`;
  `Ida y vuelta Aeropuerto Matecaña a Villa Verde` → origen `Aeropuerto M`, destino `tecaña a Villa Verde`.
  Solo sale bien si el origen no tiene ninguna `a` (como el marcador `Origen`). Afecta a los chips "Ida y vuelta" y
  "2 pasajes" en cuanto se reemplaza el marcador por un nombre real. Ningún test lo detecta (los chips de transporte
  son `semi`, no se parsean en `templateChipSync`).
- **No reconoce "al":** `Villa Verde al Centro` → `null`, aunque el comentario del propio parser lo cita como
  ejemplo real. Solo funciona `a` con espacios.
- Calculadora `getMostFrequentRoutes` (re-exportada): agrupa por `origen → destino` escritos exactamente igual (sin
  normalizar) y ordena por número de viajes. Sin pantalla.

### 4.5 `familyAidParser.ts`: Ayuda familiar **[Verificado]**

```
Ayuda {periodicidad} a {Persona} {Mes}-{Mes} [{Año}] #{N}
Ayuda {periodicidad} a {Persona} {Mes} [{Año}] #{N}
Saldo [de] Ayuda ...        Abono Ayuda ...
```

- Prefijo `Saldo [de]` → `paymentType: 'saldo'`; `Abono` → `'abono'`; sin prefijo → `'completo'`.
- Base: `Ayuda {palabra} a {resto}`. La periodicidad es `mensual`, `bimensual` o `trimestral`; cualquier otra palabra
  → `'otro'`. Sin ese patrón (`Activar cuenta Banco Agrario`) → `null`.
- `#N` es el número de secuencia. El período es un rango `Mmm-Mmm [año]` (en cualquier parte) o un mes suelto; la
  persona es lo que queda antes del período y del `#N`. Sin persona → `null`.
- Extrae `person`, `periodicity`, `paymentType`, `sequenceNumber`, `months` y `year`.
- Calculadora `getTotalByPerson` (re-exportada): suma por persona escrita exactamente igual. Sin pantalla.

**Funciona bien** con los formatos de los chips: rangos (`Mar-Abr 2026`, `Ene-Feb 2026`) y mes abreviado + año + `#N`
(`Papá Jairo Mar 2026 #2`).

**Observaciones (verificadas ejecutando el parser):**

- Solo reconoce **meses de tres letras** (y corrige `Enr` → `Ene`). Con el mes completo falla:
  `Ayuda mensual a Mamá Marzo 2026 #1` → persona `Mamá Marzo 2026`, sin meses.
- La persona se corta en la **primera aparición de la abreviatura del mes** dentro del texto, aunque esté dentro de
  un nombre: `Ayuda mensual a Marta Mar 2026 #1` → persona `Marta Mar 2026`. Con `Omar Mar 2026` quedaría `O`
  **[Inferido del código; no ejecutado]**.
- `Enr` se corrige a `Ene` en los meses, pero la persona queda sucia: `Papá Jairo Enr 2026 #3` → persona
  `Papá Jairo Enr 2026`.
- Un año **antes** del mes (`Papá Jairo 2026 Mar #4`) no se lee: año vacío y persona `Papá Jairo 2026`.

### 4.6 `nutritionParser.ts`: Nutrición **[Verificado]**

```
Semana {N} {NombreCentro}
Semana {N} {NombreCentro} - {notas}
Semana 6 Natural Body Center
```

- Un solo patrón: `Semana N Centro`, con notas opcionales después de un guion. Cualquier otro texto (`Flora liv`) → `null`.
- Los saltos de línea se aplanan a espacios. Extrae `weekNumber`, `center` y `notes`.
- **Observación:** el guion que separa las notas puede ir **sin espacios**, así que un centro con guion
  (`Semana 6 Natural-Body Center`) se parte: el centro queda "Natural" y las notas "Body Center".
- Calculadora: `getAvgCostPerWeek(data, center?)` (re-exportada). Promedia **por registro**, no por semana distinta:
  dos registros de la misma semana cuentan dos veces. El filtro por centro es "contiene", sin distinguir mayúsculas.
- Sin pantalla.

### 4.7 `sportsParser.ts`: Deportes **[Verificado]**

```
Mensualidad {Mes} ({deporte})      Mensualidad Mar (futsal)
Arbitraje {descripción}            Arbitraje Futsal Amistoso
Cancha {lugar} {deporte}           Cancha Canaan futbol 8
{ítem} {deporte}                   Uniforme ProSport Futsal
```

Prueba en este orden (los saltos de línea se aplanan a espacios):

1. **Mensualidad:** `^mensualidad {palabra}` y, opcional, el deporte entre paréntesis o el resto del texto. `month` es la
   primera palabra; `sport` es lo que escribiste (no se valida contra la lista).
2. **Arbitraje:** `^arbitraje {descripción}`. El deporte sale de la lista de palabras conocidas.
3. **Cancha:** `^cancha {lugar} [resto]`. `location` es **solo la primera palabra** (`Canaan`); el deporte es la palabra
   conocida que aparezca en el resto, o el resto completo si no hay ninguna (`futbol 8` → `futbol`).
4. **Equipamiento:** empieza por `uniforme`, `zapatilla(s)`, `guayo(s)`, `camiseta`, `pantaloneta`, `rodillera`,
   `guante(s)` o `raqueta`, **seguido de un espacio y más texto**. La palabra sola (`Uniforme`) no cuenta.
5. **Otro:** cualquier texto que contenga una palabra de deporte. Si no hay ninguna → `null`.

Palabras de deporte conocidas: futsal, futbol, fútbol, tenis, ciclismo, natación (con y sin tilde), baloncesto,
voleibol, atletismo, yoga, crossfit. Calculadora: `getTotalByExpenseType` (suma por tipo; re-exportada). Sin pantalla.

### 4.8 `rentParser.ts`: Arriendo **[Verificado]**

```
{N} días mes {Mes} [{Año}]         22 días mes Febrero 2026
{N} días [arriendo] {propiedad}    9 días arriendo Torre 2. Apt 505
Nuevo valor {propiedad}            Nuevo valor apt 1004 Mirador Villa Verde
Arriendo {Mes} [{Año}] [{propiedad}]   Arriendo Mar 2026
```

Prueba en este orden:

1. `N días mes Mes [Año]` → pago **parcial** con mes y año opcional. El mes se normaliza a su nombre completo
   (`Feb` → `Febrero`, `May` → `Mayo`); uno desconocido se deja como se escribió. El patrón exige que el texto termine ahí.
2. `N días [arriendo] resto` → pago **parcial** sin mes; el resto es `property` (queda vacío si no hay).
3. `Nuevo valor resto` → `paymentType: 'nuevo_valor'`, `isNewValue: true`, resto como `property`.
4. `Arriendo palabra [resto]` → pago **completo**. Si la palabra es un mes, queda en `month`; si lo que sigue empieza por
   un año de 4 dígitos pegado al mes, queda en `year`; el resto es `property`. Si la palabra no es un mes, `month` queda
   vacío y `property` es el texto completo.

Cualquier otro texto → `null`. Sin calculadoras; sin pantalla.

Cambios del 18 Nov 2026: antes, `Arriendo Mar 2026` dejaba `property: '2026'` sin año, y `May` no se reconocía como mes.
Sigue pendiente de entender (no es un error): una línea como `22 días mes Febrero 2026 extra` no cae en el patrón 1
(exige terminar) sino en el 2, y todo `mes Febrero 2026 extra` queda como `property`.

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

| Fecha       | Decisión                                                                                           | Por qué                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Nov 2026    | Se elimina el orquestador y su mapa de ids                                                         | Nadie lo usaba y eran datos del usuario quemados                           |
| Nov 2026    | El parser de restaurantes no tiene fecha de corte                                                  | Los comentarios viejos corregidos a mano deben poder contar                |
| Nov 2026    | Eventos aparte con `#NombreEvento`                                                                 | Sus precios no son comparables                                             |
| Nov 2026    | No se unen automáticamente los nombres parecidos                                                   | Solo se avisan; se corrigen editando el comentario                         |
| Nov 2026    | Las pantallas importan los parsers por el índice (opción A)                                        | Cumplir la regla 1 sin relajarla; solo se agregó lo que las pantallas usan |
| Nov 2026    | Arriendo: se extrae el año del pago completo y se acepta `May`                                     | Los chips "Mes completo" generaban un formato cuyo año se perdía           |
| 18 Nov 2026 | Transporte: NO se arregla la partición de "Ida y vuelta" / "N pasajes" ni se acepta "al" por ahora | Ninguna pantalla lo usa; se ajusta cuando se vincule a una pantalla        |
| 18 Nov 2026 | Ayuda familiar: solo documentada, sin arreglo                                                      | Los formatos de los chips funcionan; sin pantalla                          |
| 18 Nov 2026 | Utilidades: `unit` se queda como lo produce el parser (`'KW'`)                                     | La pantalla solo lo muestra; no se compara en ninguna parte vista          |

## 8. Pendientes y notas para quien retome

**Sin verificar** (no se vio el código):

- `copagoCatalog.ts` (instituciones, especialidades, pacientes) y `copagoTemplates.utils.ts`.
- `assetAnalytics.ts` (vive en esta carpeta e importa `parseAssetCommentary`).
- Los tests citados en la sección 6 como "según el README anterior" (`integrationFlow`, `copagoTemplates`).

**Defectos conocidos que se dejan a propósito** (decisión del 18 Nov 2026: se ajustan cuando el parser se vincule a una
pantalla; los detalles y ejemplos están en la sección indicada):

- **Transporte (4.4):** "Ida y vuelta" y "N pasajes" parten el texto en la primera letra "a" del nombre, y "al" no se
  reconoce. Los chips "Ida y vuelta" y "2 pasajes" producen datos incorrectos con nombres reales. Arreglo previsto:
  separar solo en la palabra `a`/`al` con espacios o en un guion, con tests para esos casos y para los chips.
- **Ayuda familiar (4.5):** solo meses de tres letras; la persona se corta mal si su nombre contiene la abreviatura del
  mes; un año antes del mes no se lee. Arreglo previsto: buscar el mes por palabra completa, aceptar nombres completos
  y leer el año en cualquier orden.
- **Utilidades (4.1):** `unit` sale como `'KW'` aunque el tipo diga `'Kw'`; la pantalla solo lo muestra, así que se ve
  "KW". Se deja así.
- **Nutrición (4.6):** el guion de las notas puede ir sin espacios y parte un centro con guion; el promedio es por
  registro, no por semana distinta.
- **Deportes (4.7):** una palabra de equipamiento sola (`Uniforme`) no cuenta; en `Cancha`, el lugar es solo la primera
  palabra.
- Si aparecen duplicados de eventos escritos de formas distintas, evaluar un aviso (hoy solo hay para restaurantes).

**Antes de construir una pantalla nueva sobre un parser:** revisar su sección 4.x, corregir lo que la afecte y agregar
tests; los chips `semi` no se prueban contra el parser en `templateChipSync`.
