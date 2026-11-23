# OCR de facturas: lectura, nombres canónicos y categorización

Última verificación: 18 Nov 2026 · Estado: parcial
Marcas: **[Sin verificar]** = no se contrastó con código · **[Inferido]** = deducido.

El usuario fotografía facturas de supermercado; el sistema extrae cada producto, normaliza su nombre y le asigna
categoría y subcategoría. Las fotos a veces salen borrosas y el nombre se registra mal; el usuario lo corrige en
chats dedicados.

**Visto en código:** `categorizeExpense.ts`, `canonicalizer/index.ts`, `canonicalizer/synonymDictionary.ts`,
`ExpenseItem.tsx` y los lugares donde los parsers llaman a `canonicalize`.
**[Sin verificar]:** el interior de los parsers de tienda, `normalizer.ts`, `prefixMatcher.ts`,
`ScanReceiptScreen`, `components/ocr/` y `MultiExpenseModal`.

---

## 1. Flujo

```
Foto/PDF de la factura
  → parser de tienda (utils/parsers/image/{carulla,d1,dollarCity,fruverLaGranja,superCarnesJH}.ts,
                      utils/parsers/pdf/parseD1Pdf.ts)  [Sin verificar su interior]
  → canonicalize(descripción, existingCanonicals)         (nombre canónico del producto)
  → lista de gastos en el modal de varios gastos (ExpenseItem)
  → al montar cada ítem sin categoría: categorizeExpense(descripción, categorías)
  → el usuario revisa y guarda
```

Formato de la descripción que sale de los parsers (que luego lee el parser de productos):

```
Nombre — 1,150 kg @ $20.900/kg [Carulla]
Nombre — 1 un @ $2.400 (antes $3.000, -20%) [D1]
```

## 2. `canonicalize` (`utils/canonicalizer/index.ts`)

Separa el texto en nombre, sufijo de peso y sufijo de tienda (`[Tienda]`), y resuelve solo el nombre:

1. Sinónimo exacto del nombre base → canónico del diccionario.
2. Sinónimo exacto tras quitar ruido del OCR (`stripOcrNoise`: sufijos como "CA", "AG", "Fracci").
3. Truncamiento contra los nombres canónicos que ya existen en la base (`isTruncationOf`).
4. Sin coincidencia → el nombre limpio en `toTitleCase`.

**Diccionario** (`synonymDictionary.ts`): `SYNONYM_GROUPS: [canónico, sinónimos[]][]` y `SYNONYM_INDEX`, un `Map`
sinónimo (en minúsculas) → canónico. El canónico "preferido" es el más común en supermercados colombianos
formales. Los títulos `— DESAYUNOS Y CENAS —` del archivo son solo comentarios: el diccionario **no conoce
subcategorías**. En un `Map` creado desde pares, si un sinónimo está repetido gana el último.

Para agregar un producto: una entrada nueva `['Canónico', ['variante 1', 'variante OCR truncada', ...]]`.

## 3. `categorizeExpense` (`utils/scanInvoice/categorizeExpense.ts`)

Firma: `categorizeExpense(description, categories) → { categoryId, subcategoryId }`.
Se exporta desde `utils/scanInvoice/index.ts` (es lo único que exporta ese índice). `ExpenseItem` lo importa
de `~/utils`.

**Cómo decide**

1. Toma solo el **nombre del producto**: lo anterior a `—` y sin la etiqueta final `[Tienda]`. Peso, precio
   y tienda no cuentan (una yuca de `[Pollo Ya]` no es proteína).
2. Normaliza (minúsculas, sin tildes).
3. Para cada regla busca, dentro de la categoría de la regla, la **primera subcategoría cuyo nombre
   normalizado contenga el fragmento** de la regla. Si no hay, la regla se salta sin avisar.
4. Una palabra clave coincide si **empieza donde empieza una palabra** (`pollo` coincide con "pollos", no con
   "repollo"). Las claves de **4 letras o menos** deben ser **palabra completa** (`ron` no coincide con
   "macarrón"; `res` no coincide con "crespa"). Las reglas con `exactMatch` también exigen palabra completa.
5. Gana la coincidencia de **palabra clave más larga**; las reglas `exactMatch` suman 100 puntos de bono. En
   empate, gana la regla que aparece primero en la lista.
6. Sin coincidencias: primera categoría principal (por orden alfabético) y su subcategoría **Mercado**,
   buscada por nombre; si no existe, la primera subcategoría.

Categorías principales (nombre exacto): `Alimentación`, `Vivienda`, `Aseo y cuidado personal`. Si ninguna
existe, usa la primera categoría que haya.

**Fragmentos de subcategoría que lee** (contrato con los nombres; ver `docs/domain/alimentacion.md`)

| Categoría               | Fragmentos                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Alimentación            | `desayunos y cenas`, `proteinas`, `mercado`, `gaseosas`, `chucherias`, `licores`, `comida lista`             |
| Vivienda                | `arriendo`, `agua`, `luz`, `gas`, `internet`, `articulos limpieza hogar`, `muebles y aparatos`, `utensilios` |
| Aseo y cuidado personal | `peluqueria`, `manicure`, `articulos aseo personal`                                                          |

`Onces` ya no recibe nada del OCR.

**Palabras clave por destino (resumen de decisiones de comida)**

- Ingredientes desayunos y cenas: desayuno, cena, pan, panela, pandebono, huevo, leche, queso, café, atún, harina,
  arepa, empanada, jamón, salchicha, chorizo, tocineta, chocolate en polvo/de mesa/Corona/Aroma, chocolisto, yogur,
  kumis, cuajada, mantequilla, esparcible, granola, avena, mermelada, infusión, aromática.
- Proteínas: proteína, carne, pollo, pernil, pierna, espaldilla, morillo, pescado, pechuga, res, tilapia, pecho,
  lomo, lagarto, trucha, contramuslo, muslo, muchacho, solomo, sobrebarriga, hígado, cadera, "pepino res".
- Chucherías: chuchería, galleta, chocolate, dulce, snack, papas, chocorramo/chocoramo, chocolatina, wafer,
  cocoset, gomitas, ponqué, bocadillo, maní, maíz pira, mantecada.
- Comida lista: pastel, hawaiano, hojaldre.
- Licores: licor, cerveza, vino, ron, whisky, cola, pola, refajo, embriagan, "piña colada", aguardiente.
- Gaseosas: gaseosa, refresco, pony, coca, pepsi, gas.
- Mercado: mercado, aguacate, fruta, verdura, arroz, papa, cebolla, tomate, zanahoria, pepino, coliflor, brócoli,
  fresa (y todo lo demás cae aquí por el respaldo).
- Vivienda/Aseo: ver `categorizeExpense.ts`; incluye `ambientador` y `amb ele` en Artículos limpieza hogar.

## 4. Auditoría

El 18 Nov 2026 se audió pasando cada nombre canónico de `SYNONYM_GROUPS` por `categorizeExpense`, agrupado por
subcategoría destino, antes y después del cambio. Resultado final: 183 nombres revisados, 30 cambiaron de
destino (todos intencionales), 0 difieren al agregarles el sufijo del OCR.

**Cómo repetirla:** un test temporal que recorra `SYNONYM_GROUPS`, llame a `categorizeExpense` con cada
canónico (y también con `— 1 un @ $1.000 [Carulla]` pegado) y escriba un archivo agrupado por subcategoría.
Se corre antes y después de tocar reglas y se compara. Se borra al terminar.

**Límites de la auditoría:** usa nombres canónicos, no los textos crudos del OCR; no cubre Gaseosas (ningún
nombre del diccionario cae allí); no ve los productos que `canonicalize` deja en `toTitleCase` por no estar en
el diccionario.

## 5. Tests

`src/utils/__tests__/scanInvoice/categorizeExpense.test.ts`: nombres nuevos y anteriores, falsos positivos de
la auditoría (macarrón, crespa, repollo, colada, solomo), formato del OCR con tienda, respaldo en Mercado,
categorías sin subcategorías. [Sin verificar] si existen tests de `canonicalize` o de los parsers de tienda.

## 6. Decisiones y descartes

| Fecha    | Decisión                                                              | Por qué                                                           |
| -------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Nov 2026 | Buscar la subcategoría por fragmento del nombre, no por nombre exacto | Los renombres no rompen el OCR                                    |
| Nov 2026 | Claves cortas = palabra completa; el resto, inicio de palabra         | Falsos positivos reales (ron/macarrón, res/crespa, pollo/repollo) |
| Nov 2026 | El respaldo es Mercado por nombre, no "la segunda subcategoría"       | El orden de la lista no es confiable                              |
| Nov 2026 | Decidir solo por el nombre del producto                               | El peso, el precio y la tienda producían coincidencias falsas     |
| Nov 2026 | Lo que iba a Onces se reparte (Chucherías, Comida lista)              | Onces se congeló                                                  |
| Nov 2026 | No hay catálogo de aliases por usuario                                | Sería data del usuario quemada                                    |

## 7. Pendientes (en otro chat dedicado al OCR)

- `higieni` y `papelhigienico` están en una regla de palabra completa de Aseo personal y nunca coinciden con
  "higiénico".
- `papas` (inicio de palabra) manda "Papas Criollas" a Chucherías.
- Confirmar qué producto es "Amb Ele Bri+Rep" (se asume ambientador eléctrico).
- Productos que se vean mal clasificados en un escaneo real: pasarlos para ajustar reglas.
- Panadería de supermercado distinta de pastel, hawaiano y hojaldre cae en Mercado por el respaldo.
