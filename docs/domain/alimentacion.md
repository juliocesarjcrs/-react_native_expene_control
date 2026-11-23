# Dominio: Alimentación (comida)

Última verificación: 18 Nov 2026 · Estado: vigente
Marcas: **[Sin verificar]** = no se contrastó con código · **[Inferido]** = deducido del nombre o del código.

Qué decidió el usuario sobre su gasto en comida y por qué. El cómo lo hacen el código y los parsers está en
`docs/specs/ocr.md`, `docs/specs/comentarios.md` y `src/utils/commentaryParser/SPEC.md`.

---

## 1. Para qué sirve

El usuario (Colombia, pesos) registra gastos todos los días y quiere responder, sin rigor perfecto y con
reglas fáciles de digitar:

1. ¿Cuántos días almorzamos por fuera al mes y cómo cambia ese gasto? (casa vs. comprado)
2. ¿Cuánto se va en gastos hormiga (Chucherías, Gaseosas, Postres, Licores)?
3. ¿Cuánto cuestan las proteínas?
4. ¿Qué restaurantes visitamos, cuánto gastamos en cada uno y cómo cambia el precio de un plato en el mismo
   restaurante, para decidir adónde volver?

Hogar: el usuario, su esposa (Silvia) y, por periodos, su mamá. El usuario trabaja virtual para un proyecto
en otro país; Silvia trabaja a veces híbrido y, rara vez, fines de semana o festivos en municipios cercanos, y le
pagan viáticos (se registran en Ingresos).

## 2. Subcategorías vigentes (nombres a 18 Nov 2026)

| Nombre actual                                              | Antes                  | Qué entra                                                                                                                                                                    |
| ---------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Almuerzo comprado - día de trabajo                         | Almuerzos entre semana | Almuerzo comprado (corrientazo, restaurante, domicilio aunque se coma en casa) porque era día de trabajo, del usuario o de Silvia. Cuenta el **propósito**, no el calendario |
| Comida lista (sin plan: restaurante, domicilio, panadería) | Comida fuera del hogar | Comida ya hecha por otros, sin plan de disfrute. Incluye panadería, buñuelo y café                                                                                           |
| Salidas a comer (en Cultura, diversión y esparcimiento)    | sin cambio             | Plan o disfrute, con su postre o bebida. Ni el precio ni el día sirven de criterio                                                                                           |
| Ingredientes desayunos y cenas                             | Desayunos y cenas      | Pan, huevos, arepas, leche, jamón, etc., para preparar en casa                                                                                                               |
| Mercado (almuerzo y básicos)                               | Mercado                | Lo que se cocina o arma en casa para el almuerzo, y básicos (sal, azúcar, aceite). El agua sola y los ingredientes de un postre casero también                               |
| Proteínas                                                  | sin cambio             | Carne, pollo y pescado. Los embutidos NO (van a Ingredientes)                                                                                                                |
| Licores                                                    | sin cambio             | Licor o cerveza para llevar a casa, y el mezclador comprado solo para el licor (cola, limones)                                                                               |
| Chucherías                                                 | Chucherias             | Dulce o snack empacado: galleta, wafer, ponqué, papas, chocolate                                                                                                             |
| Gaseosas                                                   | sin cambio             | Bebida embotellada. El agua sola va a Mercado                                                                                                                                |
| Postres                                                    | sin cambio             | Helado, torta, cholado comprados. Los ingredientes de un postre casero van a Mercado                                                                                         |
| Onces                                                      | sin cambio             | **Congelada, no usar.** Mezclaba cuatro cosas (dulces empacados, panadería, cafeterías, despensa). No se mueven registros                                                    |
| Regalos (3 subcategorías)                                  | sin cambio             | La comida de un evento va aquí, en un solo monto (mi comida + mi aporte)                                                                                                     |

Lo que antes iba a Onces: lo empacado va a Chucherías; la panadería y el café, a Comida lista. No hay
subcategoría nueva para panadería.

Tamaño histórico al 29/10/2026 (conteos del usuario; se atrasan unos días): Mercado 3.091 · Desayunos y
cenas 1.921 · Proteínas 558 · Chucherías 437 · Onces 435 · Salidas a comer 358 · Postres 284 · Comida fuera
del hogar 138 · Gaseosas 107 · Almuerzos entre semana 102 · Licores 101.

## 3. Contrato de nombres (qué lee cada parte del código)

Renombrar una subcategoría es seguro **mientras conserve el fragmento** de esta tabla. Si no lo conserva, la
regla se salta sin avisar. Los fragmentos se comparan sin tildes ni mayúsculas y con "contiene".

| Subcategoría                       | Fragmento                                          | Lo lee                                         | Efecto si se pierde                                                          |
| ---------------------------------- | -------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Ingredientes desayunos y cenas     | `desayunos y cenas`                                | OCR                                            | El OCR no asigna esa subcategoría y los productos caen en Mercado            |
|                                    | `ingredientes` o `desayunos y cenas`               | Chips (`isIngredients`)                        | Sin chips de producto ni validación                                          |
| Mercado (almuerzo y básicos)       | `mercado`                                          | OCR (regla y respaldo) y chips (`isGroceries`) | Sin OCR ni chips; el respaldo cae en la primera subcategoría de Alimentación |
| Proteínas                          | `proteinas`                                        | OCR                                            | Sin OCR de proteínas                                                         |
|                                    | `proteina`/`proteína`, `carne`, `pollo`, `pescado` | Chips (`isProteins`)                           | Sin chips de producto                                                        |
| Licores                            | `licores`                                          | OCR                                            | Sin OCR de licores                                                           |
|                                    | `licor`, `cerveza`, `vino`                         | Chips (`isLiquor`)                             | Sin chips de producto                                                        |
| Gaseosas                           | `gaseosas`                                         | OCR                                            | Sin OCR de gaseosas                                                          |
| Chucherías                         | `chucherias`                                       | OCR                                            | Sin OCR de chucherías                                                        |
| Comida lista (...)                 | `comida lista`                                     | OCR (regla) y chips de restaurante             | El OCR no manda panadería allí (cae en Mercado) y se pierden los chips       |
| Almuerzo comprado - día de trabajo | `almuerzo comprado`                                | Chips de restaurante                           | Sin chips de restaurante                                                     |
| Salidas a comer                    | `salidas a comer`                                  | Chips de restaurante                           | Sin chips de restaurante                                                     |
| Postres, Onces                     | (nada)                                             | —                                              | —                                                                            |

Además: la pantalla de restaurantes y el resto de análisis eligen la subcategoría **por id**
(`FilterSelector`), así que no dependen del nombre. Orden de evaluación de los detectores en
`docs/specs/comentarios.md`.

**Observación [Inferido]:** la tercera subcategoría de Regalos ("Ayuda/regalos familiares") sí se detecta como
ayuda familiar por su nombre (contiene "ayuda" y "regalo"): tiene chips y parser `familyAid`, sin pantalla.
Las otras dos de Regalos no tienen nada. No se verificó en la app.

## 4. Regla para digitar (v7)

Responder en orden y parar en la primera que aplique. **El texto lo duplica `FoodRuleHelp.tsx`: si esta regla
cambia, se actualizan los dos.**

1. ¿Fue por una ocasión (cumpleaños, despedida, invitación, aporte, regalo)? → **Regalos**.
2. ¿Almuerzo comprado porque era día de trabajo, mío o de Silvia? → **Almuerzo comprado - día de trabajo**.
3. ¿Plan para disfrutar, con su postre, café o trago? → **Salidas a comer**.
4. ¿Hay que cocinarlo o armarlo en casa? → **Mercado** o **Proteínas** (almuerzo), o **Ingredientes desayunos y
   cenas**. El agua sola y los ingredientes de un postre casero van a Mercado. Huevos y jamón siempre van a
   Ingredientes.
5. ¿Ya viene hecho?
   - Bebida embotellada → **Gaseosas**.
   - Galleta, wafer, ponqué, papas o chocolate → **Chucherías**.
   - Helado, torta o cholado → **Postres**.
   - Comida servida, panadería o café → **Comida lista**.
   - Licor o cerveza para llevar a casa → **Licores**.
6. Si una compra mezcla dos tipos, va a la que más pesa.

Reglas asociadas (decididas por defecto):

- Embutidos (jamón, salchicha, chorizo, tocineta) → Ingredientes desayunos y cenas, **no** Proteínas.
- Bebida alcohólica servida en un plan → Salidas a comer.
- Productos de aseo de un recibo → su categoría de aseo, no Mercado (lo hace el OCR).

## 5. Convenciones de comentario

Aplican a Salidas a comer, Comida lista y Almuerzo comprado. Detalle de lectura en
`src/utils/commentaryParser/SPEC.md` (parser de restaurantes).

| Situación                                                                              | Cómo se escribe                                                                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Restaurante                                                                            | Primera línea: el nombre, **siempre escrito igual**                                   |
| Platos grandes que se quieren comparar                                                 | Líneas siguientes: `plato — $precio` (también `$32.000`, `52 mil`)                    |
| Propina, domicilio, servicio, descuento, total                                         | Opcional; en una línea aparte no cuenta como plato. El costo del gasto ya los incluye |
| Almuerzo de una jornada de Silvia                                                      | Agregar `@Silvia viáticos`; un solo registro con el monto de la cuenta                |
| Evento gastronómico (Burger Master, Pizza Master, Burgerland, Eje Cafetero Gourmet...) | Restaurante en la primera línea y `#NombreEvento`                                     |
| Feria con puestos sin nombre (Expofuturo)                                              | Solo `#NombreEvento` en la primera línea y los platos debajo                          |
| No se recuerda el nombre                                                               | Escribir solo los platos con precio; no crea un restaurante falso                     |

El comentario NO tiene que sumar el costo: no se anotan propinas ni todos los platos.

Por qué los eventos van aparte: sus precios son más bajos que los normales y distorsionarían el promedio
del restaurante y la comparación de platos.

## 6. Fecha de corte y lo que no se reescribe

- **Desde el 05/11/2026** rigen los nombres, la regla v7 y las convenciones nuevas.
- Antes de esa fecha **no se reescribe nada**. Los registros viejos se corrigen a mano, a medida que
  interesen. Los comentarios viejos de facturas (fotos borrosas) pueden traer nombres mal registrados; se
  corrigen en chats dedicados.
- El corte NO está dentro del parser. La pantalla de restaurantes arranca el rango el 05/11/2026 y el usuario
  puede moverlo hacia atrás; así un comentario viejo que se corrija sí cuenta.

## 7. Qué se mide y con qué

| Pregunta                   | Con qué se responde hoy                                                                                                                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Casa vs. comprado, por mes | Resumen por mes de la pantalla de restaurantes (días distintos, registros, gasto, variación). El almuerzo en casa se **aproxima** con Mercado + Proteínas y **no** se cruza con el comprado: Mercado trae compras grandes y básicos compartidos, y esa comparación en pesos engaña |
| Gastos hormiga             | Totales por trimestre, semestre y año, y búsqueda avanzada por fechas y texto (ej. `@Julio`). Sin parser                                                                                                                                                                           |
| Costo de proteínas         | Pantalla de precios de productos (formato desde 01/08/2025 aprox.)                                                                                                                                                                                                                 |
| Restaurantes               | Pantalla de restaurantes: visitas, gasto, promedio, precio de platos repetidos, eventos, viáticos, posibles duplicados                                                                                                                                                             |

Un registro no es un día ni una persona: en una muestra, 22 de 40 almuerzos no decían cuántas personas.
Por eso los **días** se cuentan como fechas distintas.

## 8. Efecto contable

- Renombrar o congelar no mueve registros; los totales históricos no cambian.
- Desde el corte, la línea mensual de Onces (~$76.000 al mes en 2026, estimación del cálculo previo) cae a
  $0 y ese gasto reaparece en Chucherías y Comida lista. El total de Alimentación no cambia por eso.
- Postres de plan que van a Salidas: Alimentación baja y Cultura sube por el mismo monto, solo hacia adelante.
  Lo mismo para licores de plan; ese monto no está cifrado.
- Comparar antes y después del corte no es peras con peras: parte de un cambio es inflación y parte
  reclasificación, y con los datos no se separan.

## 9. Decisiones y descartes

| Fecha    | Decisión                                                | Por qué                                                                             |
| -------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Nov 2026 | Renombrar y fijar la regla; no se mueve ningún registro | Evita reescribir años de historial                                                  |
| Nov 2026 | Onces se congela                                        | Mezclaba cuatro cosas; no sirve para medir hormiga                                  |
| Nov 2026 | No renombrar Postres, Gaseosas ni Proteínas             | El nombre actual alcanza; la ayuda "¿Dónde va una compra de comida?" cubre la regla |
| Nov 2026 | Convención en el comentario antes que más subcategorías | Digitar cada gasto ya es tedioso                                                    |
| Nov 2026 | Sin fecha de corte dentro del parser                    | Un comentario viejo corregido a mano debe poder contar                              |
| Nov 2026 | Eventos con `#NombreEvento`                             | Precios no comparables con los normales                                             |
| Nov 2026 | Primera línea con precio = plato, no restaurante        | Evita restaurantes falsos cuando no se recordó el nombre                            |
| Nov 2026 | Resumen por mes colapsado por defecto                   | Es secundario frente a "Por restaurante"                                            |
| Nov 2026 | Una subcategoría por vez en la pantalla de restaurantes | Igual que las demás pantallas; se reevalúa con datos reales                         |

**Descartado:** reorganizar las tres de Regalos · unir Comida fuera del hogar con Salidas a comer (se pierde la
diferencia entre un buñuelo de $3.000 y una cena de $200.000) · parser para Chucherías, Gaseosas o Postres
(los totales y la búsqueda ya responden "¿cuánto al mes?") · validar que el comentario sume el costo ·
subcategoría para panadería · reescribir los registros viejos · seguir el precio de todos los platos (solo los
que se repiten) · gasto por persona en restaurantes · lista de eventos o alias de restaurantes en el código
(serían datos del usuario quemados) · comparación exacta en pesos entre casa y comprado.

## 10. Pendientes y preguntas abiertas

- Pantalla de restaurantes con las tres subcategorías juntas: se decide tras usarla con datos reales.
- Sugerencias de nombres de restaurante al escribir (distintas del historial actual): se decide si siguen
  apareciendo variantes tipo BurgerLand / BurguerLand.
- Ajustes del OCR (en otro chat): ver `docs/specs/ocr.md`.
- Corregir registros antiguos a medida que importen.
