# Dominio: Bienes e inversiones (apartamentos, lotes)

Última verificación: 18 Nov 2026 · Estado: vigente
Marcas: **[Sin verificar]** = no se contrastó con código · **[Inferido]** = deducido.

Reglas contables de los comentarios de bienes. Fuentes leídas: `assetConcepts.ts`, `assetParser.ts`,
`assetTemplates.utils.ts`. **[Sin verificar]:** los tipos (`asset-analysis.types.ts`) y la pantalla
`AssetAnalysisScreen`; no se vieron, así que aquí no se documenta cómo se agrupan los resultados.

---

## 1. Idea central

Cada pago de un bien se clasifica con un **concepto** que dice tres cosas:

- **A qué cubeta (`bucket`) suma** (compra, costos de adquisición, administración, intereses...).
- **Qué papel juega en el capital (`capitalRole`)**: si engorda el costo del bien o solo paga deuda.
- **Si es gasto o ingreso (`direction`) y qué naturaleza se espera (`expectedNature`)**.

Lo importante: **pagar a la deuda no es costo del bien** (la compra ya lo incluye), el **depósito en garantía
no es ingreso**, y el **reembolso del inquilino se resta de su cubeta de gasto**.

## 2. Catálogo de conceptos (fuente: `assetConcepts.ts`)

Un concepto se reconoce por su etiqueta o por un alias (sin tildes, mayúsculas ni espacios).

| Concepto         | Etiqueta       | Alias                                 | Cubeta           | Dirección | Naturaleza esperada                                        | Exige período | Papel en el capital              |
| ---------------- | -------------- | ------------------------------------- | ---------------- | --------- | ---------------------------------------------------------- | ------------- | -------------------------------- |
| promise          | Promesa        | promesa                               | purchase         | gasto     | inversión                                                  | no            | suma al costo                    |
| downPayment      | Abono          | abono                                 | purchase         | gasto     | inversión                                                  | no            | suma al costo                    |
| balance          | Saldo          | saldo, restante                       | purchase         | gasto     | inversión                                                  | no            | suma al costo                    |
| closingCosts     | Escrituración  | escrituracion, escritura              | acquisitionCosts | gasto     | inversión                                                  | no            | suma al costo                    |
| bankTax          | 4x1000         | 4x1000, 4xmil, 4pormil, gmf           | acquisitionCosts | gasto     | **hereda** del pago que lo originó                         | no            | —                                |
| improvement      | Mejora         | mejora, remodelacion                  | improvement      | gasto     | inversión                                                  | no            | suma al costo                    |
| adminFee         | Administración | administracion                        | admin            | gasto     | operación                                                  | sí            | —                                |
| propertyTax      | Predial        | predial, impuesto(s), impuestopredial | taxes            | gasto     | operación                                                  | sí            | —                                |
| insurance        | Seguro         | seguro                                | insurance        | gasto     | operación                                                  | sí            | —                                |
| maintenance      | Mantenimiento  | mantenimiento, reparacion             | repairs          | gasto     | operación                                                  | no            | —                                |
| commission       | Comisión       | comision                              | commissions      | gasto     | operación                                                  | sí            | —                                |
| utilities        | Servicios      | servicios, servicio                   | utilities        | gasto     | operación                                                  | sí            | —                                |
| other            | Otros          | otros, otro                           | other            | gasto     | operación                                                  | no            | —                                |
| procedure        | Trámite        | tramite(s), autenticar, autenticacion | other            | gasto     | **hereda** (inversión → costo del bien; operación → gasto) | no            | —                                |
| interest         | Intereses      | intereses, interes                    | interest         | gasto     | operación                                                  | sí            | —                                |
| principalPayment | Abono capital  | abonocapital, abonoacapital           | principal        | gasto     | inversión                                                  | sí            | **paga deuda, NO suma al costo** |
| rentIncome       | Arriendo       | arriendo                              | rent             | ingreso   | —                                                          | sí            | —                                |
| reimbursement    | Reembolso      | reembolso                             | reimbursement    | ingreso   | —                                                          | sí            | —                                |
| securityDeposit  | Depósito       | deposito                              | deposit          | ingreso   | —                                                          | no            | **no cuenta como ingreso**       |
| sale             | Venta          | venta                                 | sale             | ingreso   | —                                                          | no            | —                                |

"Hereda" (`expectedNature: null`) = toma la naturaleza del gasto con el que se registra.

## 3. Gramática del comentario (fuente: `assetParser.ts`)

```
Concepto: detalle [Período] [Etiqueta] [Etiqueta]
```

- El concepto es lo que hay antes del primer `:` de la primera línea (máximo 30 caracteres). Si no se
  reconoce, el parser devuelve `null`.
- Las etiquetas entre corchetes se sacan del cuerpo.

| Etiqueta           | Ejemplo                          | Qué extrae                                                                                       |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| Valor de escritura | `[Valor escritura $130.000.000]` | `deedValue`                                                                                      |
| Saldo de deuda     | `[Saldo $85.000.000]`            | `debtBalance` (deuda pendiente; no confundir con el concepto "Saldo:" de la compra)              |
| Tasa               | `[Tasa 14,5% EA]`                | `rate` y `rateType`                                                                              |
| Bien               | `[Bien: Apt 1102]`               | `property` (obliga a escribir los dos puntos)                                                    |
| Préstamo directo   | `[Préstamo directo $85.000.000]` | `directLoan`: un tercero pagó esa parte directo al vendedor. Suma al costo y es la deuda inicial |
| Parcial            | `[Parcial]`                      | solo en Arriendo: marca pago proporcional                                                        |
| Otras              | `[lo que sea]`                   | `tags[]` (no se pierden en silencio)                                                             |

Del cuerpo se extrae además: el primer `$monto` (`referenceAmount`), el primer `N%` (`percentage`) y, en
Arriendo, `N días` (`partialDays`).

**Período** (se prueba en este orden): `06 Oct 2026 - 06 Oct 2027` · `15 Oct - 14 Nov 2026` ·
`Dic 2025 - Ene 2026` · `Mar-Abr 2026` · `Mar 2026` · `2026` (año completo). Con fechas se reparte por
días entre los meses que toca. Si el año va una sola vez al final, es el de la fecha final.

Ejemplos válidos:

```
Abono: antes de escrituras
Escrituración: notariales 2,3% [Valor escritura $130.000.000]
Saldo: firma de escritura [Préstamo directo $85.000.000]
4x1000: Nubank a Bancolombia $73.000.000
Administración: Mar 2026
Predial: 2026
Arriendo: 15 días Mar 2026 [Parcial] [Bien: Apt 1102]
Intereses: Mar 2026 [Tasa 14,5% EA] [Saldo $85.000.000]
Abono capital: Mar 2026 [Saldo $70.000.000]
```

## 4. Cuándo una subcategoría es "de un bien" (fuente: `assetTemplates.utils.ts`)

**Gasto:** se cumplen las cuatro:

1. el id es menor que el offset de ingresos (100.000),
2. el nombre de la **categoría** contiene "bancario" e "inversi" (hoy "Bancarios y de inversión"),
3. el nombre de la subcategoría trae, como **palabra completa**, una de: `apt`, `apto`, `apartamento`,
   `torre`, `lote`, `casa`, `finca`, `bodega`, `parqueadero`, `oficina`, `local`,
4. el nombre NO contiene: `cuota`, `prestamo`/`préstamo`, `credito`/`crédito`, `hipotec`, `compra apto`
   (esas conservan su plantilla propia, "Cuota # n/N").

**Ingreso:** el id es mayor o igual que el offset y el nombre contiene `arriendo` o `arrendamiento`.

Es una **excepción** a la regla "se detecta solo por el nombre de la subcategoría" (ver la constitución):
renombrar la categoría rompe la detección. Para un bien nuevo con otro tipo de nombre, se agrega la palabra a
`ASSET_NAME_KEYWORDS`.

## 5. Validación en vivo (borde verde o amarillo)

Avisa cuando:

- No hay `Concepto: detalle`, o el concepto no se reconoce.
- Un concepto de ingreso no trae `[Bien: ...]`, o dejaste el texto "Nombre".
- Un concepto que exige período no trae año.
- `[Préstamo directo]` se usa fuera de Promesa, Abono o Saldo, o sin monto.
- Un "Abono" menciona "capital" (para pagos a la deuda se usa "Abono capital:").

## 6. Decisiones y descartes

| Fecha                       | Decisión                                                              | Por qué                                                                     |
| --------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| (anterior a este documento) | Detección de bienes por lista de palabras (opt-in) y no por exclusión | Con exclusión se colaban subcategorías como "Emigrar" o "Declaración renta" |
| (anterior)                  | `assetTemplates.utils.ts` no importa `commentaryTemplates.utils.ts`   | Evita un ciclo de imports                                                   |

## 7. Pendientes

- Documentar `asset-analysis.types.ts` y `AssetAnalysisScreen` cuando se vean.
- El offset de ingresos ahora se importa de `~/constants/commentary` (ver `cambios-previos-a-specs.md`).
