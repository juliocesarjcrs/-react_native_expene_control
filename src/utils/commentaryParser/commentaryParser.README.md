# utils/commentaryParser

Parsers que convierten texto libre de comentarios en datos estructurados.
Cada parser es independiente y tiene su propio archivo.

## Punto de entrada

El código de la app (pantallas, hooks, servicios) siempre importa desde el índice:

```typescript
// ✅ Correcto
import { parseCommentary, getParserType, parseCopagoCommentary } from '~/utils/commentaryParser';

// ❌ Incorrecto en pantallas y hooks
import { parseCopagoCommentary } from '~/utils/commentaryParser/copagoParser';
```

Excepciones permitidas (todas por evitar dependencias circulares):

- **Tests de un parser** importan el archivo del parser directamente (no necesitan el mapa de IDs).
- **`utils/commentary/*Templates.utils.ts`** importan el parser directamente, porque el índice
  arrastra el registry y las plantillas lo importan a él.
- Un parser **solo puede importar tipos y su propio catálogo**. Nunca `./index`, el registry ni plantillas.

Todo lo que una pantalla necesite de un parser (calculadoras, catálogos de etiquetas/iconos)
debe estar re-exportado en `index.ts`. Si falta, se agrega ahí; no se importa del archivo.

## API pública

### `parseCommentary(subcategoryId, commentary, cost, date, category?, baseSalary?)`

Parsea un comentario usando el parser correcto para la subcategoría.
Retorna un `ParsedCommentary` con `type` y `data`, o `{ type: 'none', data: null }` si no matchea.

```typescript
const result = parseCommentary(1444, 'Colmedica Control Reumatología #2', 43900, '2026-04-10');
// → { type: 'copago', data: { act: 'control', specialtyKey: 'reumatologia', sequenceNumber: 2, ... } }
```

### `getParserType(subcategoryId)`

Devuelve el `ParserType` asociado a una subcategoría según `SUBCATEGORY_PARSER_MAP`.
Útil para saber qué parser aplica antes de parsear.

### `registerSubcategoryParser(subcategoryId, parserType)`

Registra o actualiza la asociación subcategoría → parser en runtime.
Usar cuando los IDs reales de BD difieren del mapa inicial.

---

## Agregar o cambiar un parser: dónde tocar

Un parser vive en **seis** sitios. Si falta uno, algo falla en silencio (chips que no parsean,
pantalla sin ruta, subcategoría sin parser):

| #   | Archivo                                                      | Qué                                                                                         |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1   | `shared/types/utils/commentaryParser/{x}-analysis.types.ts`  | tipos del dato                                                                              |
| 2   | `commentaryParser/{x}Parser.ts`                              | el parser y sus calculadoras                                                                |
| 3   | `commentaryParser/index.ts`                                  | `ParserType`, `ParsedCommentary`, `case` del `switch`, re-exports, `SUBCATEGORY_PARSER_MAP` |
| 4   | `shared/types/utils/commentaryParser/commentary-registry.ts` | entrada del registry (`exampleCommentary` DEBE parsear)                                     |
| 5   | `utils/commentary/commentaryTemplates.utils.ts`              | detector de subcategoría, chips, validación                                                 |
| 6   | `__tests__/commentaryParser/`                                | tests del parser y de los chips                                                             |

**Regla de chips:** un chip es texto real que el parser entiende, sin placeholders. Si un chip
necesita placeholders (`Producto`, `Persona`), `templateChipSync.test.ts` los reemplaza con `hydrate()`.
Los parsers con validación en vivo (`enableValidation: true`) deben tener su `case` en
`validateCommentary`; si no, el borde del input nunca cambia aunque la config diga lo contrario.

---

## Parsers disponibles

### `utilityParser.ts` — Luz, Agua, Gas

**Formato:**

```
Consumo(79 Kw) 18 Mar - 17 Abr 2026 [Solos]
Consumo(14 M3) 16 Dic - 15 Ene 2026 [Con Margot]
Consumo(66 Kw) 17 Ago - 16 Sep 2024 [Solos] [Deshabitado 6 días]
Consumo(71 Kw) 18 Jul - 16 Ago 2024 [Visitas: 2] Familia viaje 17-19 Jul
```

**Reglas:**

- `Consumo(N Kw/M3)` es obligatorio
- El periodo de fechas es obligatorio
- El contexto entre corchetes `[Solos]`, `[Con Margot]`, etc. es opcional
- Todo lo que queda después del último `]` se captura como `notesForDisplay`

**Extrae:** `consumption`, `unit`, `periodStart`, `periodEnd`, `isSolo`, `hasExtraPerson`, `hasVisits`, `uninhabitedDays`, `totalExtraPeople`, `notesForDisplay`

**Funciones de análisis:** `calculateConsumptionPerPerson()`, `calculateAdjustedConsumption()`, `groupByUtilityType()`

---

### `productParser.ts` — Proteínas, Mercado, Licores

**Formato:**

```
Pechuga — 0,500 kg @ $14.000/kg [Carulla]
Pechuga — 0,500 kg @ $14.000/kg (antes $20.000/kg, -30%) [Carulla]
Leche Entera — 1 un @ $2.400 [D1]
Harina [D1]   ← formato simplificado (parser retorna null intencionalmente)
```

**Reglas:**

- Separador `—` entre nombre y detalles
- `@ $precio/kg` o `@ $precio` para precio por kg o por unidad
- Tag de tienda `[Carulla]`, `[D1]`, `[DollarCity]`, etc. es opcional
- Descuento `(antes $X/kg, -Y%)` es opcional

**Extrae:** `product`, `quantity`, `pricePerKg`, `store`, `unit`, `originalPricePerKg`, `discountPercent`, `isWeighed`, `isIncomplete`

---

### `retentionParser.ts` — Nómina, Retenciones, Salario

**Formato:**

```
Retefu: 517.000
Retefu: 517.000
Incapacidad: Prim: 2 días
Retefu: 517.000
Incapacidad: Prim: 2 días, Eps: 13 días
Retefu: 517.000
Prima nav: 609.000
```

**Reglas:**

- `Retefu:` es **obligatorio** — sin él el parser retorna null
- `Incapacidad:` es opcional. Dentro: `Prim:` (días 1-2) y `Eps:` (días 3+)
- `Prima {tipo}:` es opcional y repetible (`nav`, `gest`, `jun`, etc.)
- Montos: `"467.000"`, `"467000"`, `"635 mil"` — todos válidos
- Sumas de días: `"4+18"`, `"2+2+13"` → se suman automáticamente

**Extrae:** `retention`, `primas[]`, `incapacidad.primDays`, `incapacidad.epsDays`, `incapacidad.totalDiscount`

**Funciones de análisis:** `calculateTotalRetention()`, `calculateTotalRetentionWithPrimas()`, `calculateIncapacidadStats()`

---

### `transportParser.ts` — Taxi, Bus, Uber, Transporte

**Formato:**

```
Villa Verde a Centro
Ida y vuelta Aeropuerto Matecaña a Villa Verde
2 pasajes Pereira a El Cedral
Recarga 4 pasajes Megabus
```

**Reglas:**

- `{Origen} a {Destino}` es el patrón base
- `Ida y vuelta` al inicio marca `isRoundTrip: true`
- `N pasajes` al inicio marca `passengerCount: N`
- `Recarga N pasajes {descripcion}` para tarjetas tipo Megabus

**Extrae:** `origin`, `destination`, `isRoundTrip`, `passengerCount`

**Funciones de análisis:** `getMostFrequentRoutes()`

---

### `familyAidParser.ts` — Ayuda familiar, Regalos

**Formato:**

```
Ayuda bimensual a Papá Jairo Mar-Abr 2026 #9
Ayuda mensual a Mamá Ene 2026 #1
Saldo de Ayuda bimensual a Papá Jairo Ene-Feb 2026 #8
Abono Ayuda mensual a Papá Jairo Mar 2026 #2
```

**Reglas:**

- `Ayuda` es obligatorio al inicio (puede ir precedido de `Saldo [de]` o `Abono`)
- Periodicidad: `mensual`, `bimensual`, `trimestral`
- Meses abreviados: `Ene`, `Feb`, `Mar`... (corrige errores como `Enr` → `Ene`)
- `#N` es el número de secuencia

**Extrae:** `person`, `periodicity`, `paymentType` (completo/abono/saldo), `months[]`, `year`, `sequenceNumber`

**Funciones de análisis:** `getTotalByPerson()`

---

### `nutritionParser.ts` — Nutrición

**Formato:**

```
Semana 6 Natural Body Center
Semana 5 Natural Body Center - nota adicional
```

**Reglas:**

- `Semana N {NombreCentro}` es el patrón completo
- Todo lo que viene después de `-` se captura como `notes`

**Extrae:** `weekNumber`, `center`, `notes`

**Funciones de análisis:** `getAvgCostPerWeek()`

---

### `sportsParser.ts` — Deportes

**Formato:**

```
Mensualidad Mar (futsal)
Cancha Canaan futbol 8
Arbitraje Futsal Amistoso
Uniforme ProSport Futsal
```

**Detecta automáticamente el tipo:**

- `Mensualidad` → `expenseType: 'mensualidad'`
- `Cancha` → `expenseType: 'cancha'`
- `Arbitraje` → `expenseType: 'arbitraje'`
- Palabras clave de ropa/equipamiento → `expenseType: 'equipamiento'`
- Contiene nombre de deporte → `expenseType: 'otro'`

**Extrae:** `expenseType`, `sport`, `month`, `location`, `description`

**Funciones de análisis:** `getTotalByExpenseType()`

---

### `rentParser.ts` — Arriendo

**Formato:**

```
22 días mes Febrero 2026
9 días arriendo Torre 2. Apt 505
Arriendo Mar 2026
Nuevo valor apt 1004 Mirador Villa Verde
```

**Detecta el tipo de pago:**

- `N días mes {Mes} {Año}` → `paymentType: 'parcial'`
- `N días arriendo {propiedad}` → `paymentType: 'parcial'`
- `Nuevo valor {descripcion}` → `paymentType: 'nuevo_valor'`
- `Arriendo {Mes}` → `paymentType: 'completo'`

**Extrae:** `paymentType`, `days`, `month`, `year`, `property`, `isNewValue`

---

### `copagoParser.ts` + `copagoCatalog.ts` — Subcategoría "Cuota moderadora"

El parser maneja la **subcategoría** "Cuota moderadora", pero el comentario **no** debe empezar
con esas palabras: "Cuota moderadora cita general" no se reconoce. El ancla del parser es el **acto**.

**Formato** (todo lo que va entre `[]` es opcional):

```
[Copago] [Institución] {Acto} {Área} [#N[/Total]] [@Paciente] [- nota libre]
```

**Ejemplos:**

```
Colmedica Consulta Reumatología #1              ← primera vez = cita #1
Colmedica Control Reumatología #2               ← primer control = cita #2
Colmedica Control Reumatología #3 - resultado resonancia
Colmedica Terapia Física #11/20                 ← terapia con ciclo cerrado
Terapia Psicología #4 @Julio                    ← serie abierta, paciente Julio
Colmedica Examen Gammagrafía ósea
Salud Total Laboratorio Sangre                  ← laboratorio en sede física
Domicilio Laboratorio - Lopez Correa            ← toma de muestra en casa
Salud Total Medicamentos @Julio
Colmedica Urgencia Psiquiatría - Clínica Comfamiliar
```

**Reglas:**

- **Acto** (obligatorio, primera palabra tras la institución): `Consulta`, `Control`, `Terapia`,
  `Urgencia`, `Examen`, `Laboratorio`, `Medicamentos`, `Procedimiento`, `Domicilio`
  (admite plural y sin tildes: `Exámenes`, `Laboratorios`).
- **Área:** obligatoria en `Consulta`, `Control` y `Terapia`. En los demás actos es opcional.
  Una especialidad que no esté en el catálogo igual se reconoce y se agrupa por su propio nombre.
- **Atajos de acto implícito:** `Hidroterapia`, `Psicología` solas valen como `Terapia ...`.
  En una especialidad médica el acto sí es obligatorio (no se sabe si fue consulta o control).
- **Institución:** `Colmedica`, `Salud Total`, `Sura`, `Nueva EPS`, `Compensar`, `Sanitas`,
  `Famisanar`, `Coomeva`, `Medimas`, `EPS` (sin tildes ni mayúsculas importa). Opcional.
- **`#N`** es el número de cita **de esa especialidad** (la primera vez es `#1`). En terapias es el
  número de sesión y admite `/Total`. El total exige la `/` (`#4 2026` no es total 2026).
- **Paciente:** sin `@` se asume `DEFAULT_PATIENT` (Silvia). Julio se escribe `@Julio`. Los nombres
  sueltos (`Julio`, `(Julio)`) se reconocen en datos históricos.
- **Nota:** todo lo que sigue a `-` (guion con espacios) es nota y no ensucia el área.
  `#18-19` no activa la nota.
- **Un copago por gasto.** Varias líneas: se parsea solo la primera no vacía. Dos exámenes = dos gastos.
- **Rechazos deliberados** (devuelven `null`, para que aparezcan en "Sin formato reconocido"):
  sin acto; `Consulta`/`Control`/`Terapia` sin área; texto con la palabra `domicilio` y un acto
  distinto de `Domicilio` (`Laboratorio sangre a domicilio` es ambiguo: ¿sede o casa?).
- **Compatibilidad:** se acepta el acto al final (`Reumatología Control #1`) solo si el área es una
  especialidad del catálogo.

**Series y ciclos:** `getSeriesStats()` agrupa por paciente + especialidad. Un ciclo nuevo empieza
cuando aparece `#1`, cambia el total (`#20/20` y luego `#1/10`) o el número retrocede. Un total
ausente nunca parte un ciclo. Avisa los números que faltan entre el menor y el mayor registrado.

**Extrae:** `institution`, `patient`, `patientIsExplicit`, `act`, `area`, `specialtyKey`,
`specialtyLabel`, `isKnownSpecialty`, `groupKey`, `groupLabel`, `sequenceNumber`, `totalSessions`,
`hasSequence`, `sequenceKind` (`session` en terapias, `visit` en el resto), `note`

**Funciones de análisis:** `getSeriesStats()`, `getTotalByInstitution()`

**Para enseñarle algo nuevo** (otra especialidad, otra EPS, otro paciente): editar solo
`copagoCatalog.ts`. `DEFAULT_PATIENT` y `KNOWN_PATIENTS` son específicos del usuario, igual que
`SUBCATEGORY_PARSER_MAP`.

---

### `vacationParser.ts` — Vacaciones, Viajes

Soporta tres subformatos detectados automáticamente en este orden:

**1. Alojamiento:**

```
Alojamiento Hotel Cartagena Plaza 4 noches [Todo incluido] [Cartagena]
Alojamiento Airbnb Sector El Cable 3 noches [Solo habitación] [Manizales]
Alojamiento Hotel Termales del Otoño 1 noche [Solo alojamiento] [Santa Rosa]
Tarifa: 428.618
Impuestos: 87.037
```

Modalidades: `todo_incluido`, `con_desayuno`, `media_pension`, `solo_alojamiento`, `solo_habitacion`
Calcula automáticamente `pricePerNight` y `baseFarePerNight` (sin impuestos).

**2. Tiquete:**

```
Tiquete Avianca Pereira-Valledupar 2 pasajeros [11 Oct-14 Oct]
Tiquete Latam Pereira-Santa Marta 2 pasajeros [15 Nov-18 Nov]
```

Calcula automáticamente `pricePerPerson`.

**3. Gasto suelto:**

```
Cartagena: almuerzo en La Mulata
Santa Marta: 2 sándwich Juan Valdez
```

También compatible con datos históricos sin dos puntos:
`Santa Marta botella de agua` → detecta `Santa Marta` como destino conocido.

**Extrae según subtipo:** `type` (`lodging`/`flight`/`expense`), `destination`, campos específicos de cada subtipo.

**Funciones de análisis:** `getDestinationSummaries()`, `getLodgingComparisons()`

---

### `assetParser.ts` — Bienes e inversiones

Pendiente de documentar aquí (existe en el código y en el registry, pero este README no lo describía).

---

## SUBCATEGORY_PARSER_MAP

El mapa de `subcategoryId → ParserType` en `index.ts` usa los IDs reales de la BD.
**Estos IDs son específicos de un usuario** — actualizar con los IDs reales cuando cambien.
Hoy el mapa no incluye `vacation` ni `asset`: esos dos parsers existen pero ninguna
subcategoría los activa vía `parseCommentary()`.

Para registrar un ID en runtime:

```typescript
registerSubcategoryParser(1444, 'copago');
```

---

## Tests

```bash
jest copagoParser          # parser de copagos (formato, paciente, series, ciclos)
jest copagoTemplates       # chips de copago → parser, validación en vivo
jest templateChipSync      # chips → parsers (todas las subcategorías del registry)
jest registry-integrity    # registry → routes → parsers
```

Ver `src/utils/__tests__/commentaryParser/` para los archivos de test.
