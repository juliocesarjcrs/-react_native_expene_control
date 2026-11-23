# Cómo trabajar un cambio en un chat

Última verificación: 18 Nov 2026

Un chat = un cambio. Si el chat se alarga o se confunde, se cierra con el spec actualizado y se abre otro
con ese spec. El historial de un chat NO es una fuente de verdad: los documentos del repo sí.

## 1. Abrir

Pega, en este orden:

1. `docs/constitution.md`
2. El spec del módulo que vas a tocar (`SPEC.md`) y, si aplica, `docs/domain/<area>.md`
3. Los archivos de código que se van a tocar (completos, no fragmentos)
4. El pedido

Plantilla:

```
Voy a trabajar un cambio en <módulo>.

Objetivo (una frase): <qué debe quedar distinto para el usuario>
Alcance: <qué entra y qué NO entra>

Sigue la sección "Reglas de trabajo con el asistente" de la constitución.
Antes de proponer, revisa los archivos que te pego. Pídeme lo que te falte en UN solo bloque.
```

## 2. Especificar (sin código)

El asistente responde con:

- lo que VIO en el código y lo que ESTIMA (separados),
- opciones con recomendación, costo y qué se rompe,
- "no lo haría" si algo no vale la pena.

Tú apruebas el cambio concreto. Hasta entonces no se escribe código.

## 3. Implementar

- El código se entrega como archivos o como bloques "Buscar / Reemplazar por".
- Verificación: `npx tsc --noEmit && npx jest`, y probar en Expo Go lo que sea visual.
- El asistente dice qué verificó él y qué no pudo verificar.

## 4. Cerrar

Plantilla:

```
Cierra este cambio.

1. Lista los archivos que se tocaron y qué cambió en cada uno.
2. Entrégame COMPLETOS los documentos que cambian: SPEC.md del módulo, domain/<area>.md si cambió
   una decisión, y constitution.md si cambió una regla transversal.
3. En cada documento: actualiza la línea "Última verificación" y mueve lo resuelto de "Pendientes"
   a "Decisiones y descartes" con la fecha.
4. Marca "Sin verificar" lo que no contrastaste con código.
```

Commitea el código y los documentos en el MISMO commit.

## Cuándo un cambio NO toca documentos

Un bug o un ajuste visual que no cambia ninguna regla observable no necesita spec nuevo. Si el cambio
altera una regla (un formato de comentario, un nombre de subcategoría, un orden de detectores, una
versión de configuración), sí.
