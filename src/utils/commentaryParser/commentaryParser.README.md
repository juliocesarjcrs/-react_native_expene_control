# utils/commentaryParser

Parsers que convierten texto libre de comentarios en datos estructurados.
Cada parser es independiente y tiene su propio archivo.

## Punto de entrada

Siempre importar desde el índice, nunca directamente del parser:

```typescript
// ✅ Correcto
import { parseCommentary, getParserType } from '~/utils/commentaryParser';

// ❌ Incorrecto
import { parseUtilityCommentary } from '~/utils/commentaryParser/utilityParser';
```

## API pública

### `parseCommentary(subcategoryId, commentary, cost, date, category?, baseSalary?)`

Parsea un comentario usando el parser correcto para la subcategoría.
Retorna un `ParsedCommentary` con `type` y `data`, o `{ type: 'none', data: null }` si no matchea.

```typescript
const result = parseCommentary(1444, 'Copago Colmedica terapia física #11/20', 43900, '2026-04-10');
// → { type: 'copago', data: { institution: 'Colmedica', service: 'terapia física', sessionNumber: 11, ... } }
```

### `getParserType(subcategoryId)`

Devuelve el `ParserType` asociado a una subcategoría según `SUBCATEGORY_PARSER_MAP`.
Útil para saber qué parser aplica antes de parsear.

### `registerSubcategoryParser(subcategoryId, parserType)`

Registra o actualiza la asociación subcategoría → parser en runtime.
Usar cuando los IDs reales de BD difieren del mapa inicial.

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

### `copagoParser.ts` — Cuota moderadora, Copagos médicos

**Formato:**

```
Copago Colmedica terapia física #11/20
Copago Colmedica consulta neurología
Copago Salud Total fisiatría #1/10
Copago terapia física #3/20   ← sin institución
```

**Reglas:**

- `Copago` es obligatorio al inicio
- La institución se detecta automáticamente si aparece después de `Copago`:
  `colmedica`, `salud total`, `sura`, `nueva eps`, `compensar`, `sanitas`, etc.
- `#{N}/{Total}` es opcional — para seguimiento de sesiones
- Comentarios con múltiples copagos en una línea están **desincentivados** —
  el parser toma solo la primera línea

**Clasifica el servicio automáticamente:**

- `terapia_fisica`, `terapia_ocupacional`, `consulta`, `control`, `psicologia`, `psiquiatra`, `fisiatria`, `neurocirugia`, `otro`

**Extrae:** `institution`, `service`, `serviceType`, `sessionNumber`, `totalSessions`, `hasSessions`

**Funciones de análisis:** `getSessionStats()`, `getTotalByInstitution()`

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

## SUBCATEGORY_PARSER_MAP

El mapa de `subcategoryId → ParserType` en `index.ts` usa los IDs reales de la BD.
**Estos IDs son específicos de un usuario** — actualizar con los IDs reales cuando cambien.

Para registrar un ID en runtime:

```typescript
registerSubcategoryParser(1444, 'copago');
```

---

## Tests

```bash
jest templateChipSync      # chips → parsers
jest registry-integrity    # registry → routes → parsers
```

Ver `src/utils/__tests__/commentaryParser/` para los archivos de test.
