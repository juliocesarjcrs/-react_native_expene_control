# Constitución del front (finanzas personales)

Última verificación: 18 Nov 2026 · Estado: vigente

Reglas que valen para TODO el front. Lo específico de un módulo vive en su `SPEC.md`; las decisiones de
negocio, en `docs/domain/`. Marca de confianza: lo que no se contrastó con código se escribe
**[Sin verificar]**; lo deducido de un nombre o de un error, **[Inferido]**.

---

## 1. Fuentes de verdad

| Documento                       | Responde a                                                                                              | Se actualiza cuando                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `APP_DESIGN_STANDARD.md` (v2.3) | Cómo se ve y se construye la UI (componentes base, colores, espaciado, botones, chips, fechas, números) | Cambia un componente base o una regla visual |
| `docs/constitution.md` (este)   | Reglas transversales y cómo trabajar                                                                    | Cambia una regla que afecta a varios módulos |
| `docs/domain/*.md`              | Qué decidió el usuario y por qué (negocio)                                                              | Cambia una decisión de negocio               |
| `docs/specs/*.md`               | Sistemas que cruzan varias carpetas                                                                     | Cambia el comportamiento del sistema         |
| `SPEC.md` en una carpeta        | Contrato de un módulo de esa carpeta                                                                    | Cambia una regla observable del módulo       |
| `docs/chat-workflow.md`         | Cómo abrir y cerrar un chat de trabajo                                                                  | Cambia el método                             |

- Cada hecho vive en UN solo documento; los demás lo referencian.
- Si un documento contradice al código, gana el código y el documento se corrige en el mismo cambio.
- `APP_DESIGN_STANDARD.md` manda en todo lo visual. Esta constitución no lo repite.

## 2. Stack

- **Visto en código:** React Native con Expo (se prueba en Expo Go), TypeScript, React Navigation (stack),
  react-hook-form, react-native-elements (solo `Icon`), react-native-dropdown-picker, Redux
  (`~/store`, `~/features`), AsyncStorage, dayjs, axios (en `~/services`), expo-crypto, Jest.
- **Inferido:** compilador de React activo (el error "Expected the first argument to be an inline
  function expression" solo lo produce ese compilador); Sentry (aparece en la pila de errores); backend con
  DTOs de `class-validator` (NestJS).
- Alias de rutas: `~/` apunta a `src/`.
- Idioma: textos de la interfaz en español; identificadores en inglés; comentarios en español.

## 3. Reglas de arquitectura

### 3.1 Imports y capas

1. Pantallas, hooks y servicios importan parsers solo desde `~/utils/commentaryParser` (el índice).
2. Un parser puede importar: sus tipos, su propio catálogo (`copagoCatalog`, `assetConcepts`) y
   `~/utils/commentary/commentaryDate.utils`. Nunca `./index`, el registry ni las plantillas.
3. `utils/commentary/*Templates.utils.ts` importan el parser directo (no el índice) para evitar ciclos.
4. Las constantes compartidas entre capas van en `~/constants/` (ver deuda D5).
5. Los componentes que solo usa una pantalla viven junto a ella (`./components/`); los reutilizables,
   en `~/components/`.

### 3.2 Detección por nombre, nunca por ID

- Las subcategorías se reconocen por un **fragmento de su nombre** (sin tildes ni mayúsculas), no por id.
  Así funciona para cualquier usuario y sobrevive a renombres que conserven el fragmento.
- Todo código que dependa de un fragmento de nombre queda listado en el **contrato de nombres** del
  dominio correspondiente (ver `docs/domain/alimentacion.md`). Renombrar sin revisar ese contrato rompe
  chips y OCR **en silencio**.
- Excepciones documentadas: los ids de ingresos llevan un offset (`INCOME_CATEGORY_OFFSET`, 100.000), y
  los bienes se detectan además por categoría (ver `docs/domain/bienes.md`).
- Las claves de AsyncStorage (`template_config_{id}`, `commentary_history_{id}`) sí usan el id; el id
  sobrevive a los renombres.

### 3.3 Comentarios de gasto

- Límite de **200 caracteres**, en la interfaz y en el backend (`MaxLength(200)`). Subirlo exige tocar
  ambos.
- Se prefiere una **convención en el comentario** (`@Persona`, `#Evento`, primera línea = nombre) antes
  que multiplicar subcategorías: digitar cada gasto ya es tedioso.
- Un parser que no entiende un comentario devuelve `null`; no inventa datos. Lo que devuelve `null` se
  cuenta aparte en la pantalla, no se descarta en silencio.
- El historial no se reescribe para adaptarlo a un formato nuevo. Cuando importa, se corrige a mano o
  se limita el rango en la pantalla; no hay fecha de corte dentro de los parsers.
- Un parser nuevo o un formato nuevo se acompaña de tests y del `exampleCommentary` del registry.

### 3.4 Plantillas de comentario (chips)

- Cambiar chips o `parserType` de cualquier subcategoría exige **subir `CONFIG_VERSION`**
  (`utils/commentary/templateStorage.utils.ts`); si no, el caché de AsyncStorage esconde el cambio.
- Un chip es texto real que el parser entiende; los marcadores de posición (`Producto`, `Persona`) los
  reemplaza `hydrate()` en `templateChipSync.test.ts`.
- Un parser con `enableValidation: true` necesita su `case` en `validateCommentary`.

## 4. Reglas de código que ya costaron un error

1. **`useMemo` y `useCallback`:** el primer argumento debe ser una función escrita en línea
   (`useMemo(() => f(), [])`, no `useMemo(f, [])`).
2. **JSX en navegadores:** dentro de un `Navigator` solo `Screen`, `Group` o `Fragment`. Un espacio o
   texto suelto entre dos `Screen` rompe la navegación.
3. **Claves de listas:** nunca un nombre que pueda repetirse (dos subcategorías llamadas "Otros"
   provocaron "two children with the same key"). Usar `id`, o una clave normalizada y única.
4. **Fechas `YYYY-MM-DD`:** convertir con `dayjs(str).toDate()`; nunca `new Date(str)` (en Colombia
   muestra el día anterior). Para enviar: `dayjs(date).format('YYYY-MM-DD')`.
5. **Números:** el backend entrega números crudos. `NumberFormat(40000)` devuelve `"$ 40.000"` (incluye
   el signo). Porcentajes con 1 decimal y coma (`formatPercent`).
6. **Variables sin usar y `any`:** prohibidos (ver estándar).

## 5. Pruebas y definición de terminado

- Comando: `npx tsc --noEmit && npx jest`. Un cambio no está terminado con alguno de los dos en rojo.
- Lógica pura (parsers, análisis, categorización) se prueba con Jest. Lo visual se prueba en Expo Go.
- Tests de integridad que fallan al olvidar un paso: `registry-integrity.test.ts` y
  `templateChipSync.test.ts` (ver `src/utils/commentaryParser/SPEC.md`).
- Un cambio de comportamiento termina con el spec actualizado y en el mismo commit que el código.

## 6. Reglas de trabajo con el asistente

1. Primero revisa el código que le pasas; después propone. **No genera código hasta que apruebes el
   cambio concreto.**
2. Pide todo lo que necesita **en un solo bloque**, no una o dos preguntas por turno.
3. Distingue siempre **lo que vio** (código, datos) de **lo que estima**. Las muestras por extremos no
   se extrapolan; para cifras reales pide la consulta.
4. Ofrece opciones con **recomendación y costo** (qué se rompe, cuánto trabajo). Si algo no vale la
   pena, dice "no lo haría" y por qué.
5. Orden de prioridad: primero lo que frena errores nuevos, después la limpieza del historial.
6. Dice qué verificó y qué no pudo verificar (por ejemplo, no puede ejecutar la app).
7. Los datos de ejemplo del usuario no son para extrapolar; los conteos reales salen de consultas.

## 7. Deuda técnica conocida

| #   | Deuda                                                                                                                                                                                                                                                                                               | Dónde                                                                     | Estado                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | UI fuera del estándar: `TouchableOpacity` en vez de `MyButton`/`MyChip`, overlay con color fijo, items de lista definidos dentro del componente, porcentajes con punto, espaciados que no son múltiplos de 4, fechas con `new Date(y, m, d)` en vez de dayjs, estado de fila expandible en el padre | `RestaurantAnalysisScreen.tsx`, `FoodRuleHelp.tsx` (código del asistente) | Resuelta el 18 Nov 2026: refactor aplicado (`cambios-refactor-ui.md`); el usuario confirmó en Expo Go que se ve bien, se lee mejor y no se corta |
| D2  | `TemplateChips` usa chips propios con `TouchableOpacity` en vez de `MyChip`                                                                                                                                                                                                                         | `components/CommentaryInput/TemplateChips.tsx`                            | Abierta (heredada)                                                                                                                               |
| D3  | Las ayudas (`hint`) de los chips no se mostraban                                                                                                                                                                                                                                                    | `CommentaryInput`                                                         | Resuelta con `cambios-previos-a-specs.md`                                                                                                        |
| D4  | Ingresos marcaban la plantilla como personalizada                                                                                                                                                                                                                                                   | `CreateIncomeScreen`                                                      | Resuelta con `cambios-previos-a-specs.md`                                                                                                        |
| D5  | Offset de ingresos duplicado con dos nombres                                                                                                                                                                                                                                                        | `CreateIncomeScreen`, `assetTemplates.utils.ts`                           | Resuelta con `cambios-previos-a-specs.md`                                                                                                        |
| D6  | `registerDefaultTemplateConfig` sobrescribe en cada guardado de gasto una plantilla personalizada                                                                                                                                                                                                   | `CreateExpenseScreen`                                                     | Latente: hoy no hay plantillas personalizadas                                                                                                    |
| D7  | El botón "Editar" de `ProductPricesScreen` no guarda (`handleSavePurchase` es un TODO)                                                                                                                                                                                                              | `Screens/.../products`                                                    | Abierta                                                                                                                                          |
| D8  | `APP_DESIGN_STANDARD.md` dice `~/components/inputs/CommentaryInput`; el import real es `~/components/CommentaryInput`                                                                                                                                                                               | Estándar                                                                  | Corregir el estándar                                                                                                                             |
| D9  | Ajustes del OCR pendientes (palabras de Aseo personal, 'papas', "Amb Ele Bri+Rep")                                                                                                                                                                                                                  | `categorizeExpense.ts`                                                    | Se trabajan en otro chat (ver `docs/specs/ocr.md`)                                                                                               |
| D10 | El parser de transporte parte mal "Ida y vuelta" / "N pasajes" y no reconoce "al"; los chips respectivos generan datos incorrectos con nombres reales                                                                                                                                               | `transportParser.ts`                                                      | Diferida (18 Nov 2026): se arregla cuando se vincule a una pantalla                                                                              |
| D11 | El parser de ayuda familiar solo lee meses de tres letras y corta mal la persona en algunos casos                                                                                                                                                                                                   | `familyAidParser.ts`                                                      | Documentada (18 Nov 2026): se arregla cuando se vincule a una pantalla                                                                           |
| D12 | `unit` de utilidades sale como `'KW'` aunque el tipo diga `'Kw'`                                                                                                                                                                                                                                    | `utilityParser.ts`                                                        | Decidido dejarlo (18 Nov 2026): la pantalla solo lo muestra                                                                                      |

## 8. Cómo se actualiza este documento

- Una regla nueva entra aquí solo si afecta a más de un módulo. Si afecta a uno, va a su `SPEC.md`.
- Al resolver una deuda, se mueve su fila a la sección de decisiones del módulo con la fecha.
- Cada cambio actualiza la línea "Última verificación".
