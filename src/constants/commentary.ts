/**
 * Offset que separa los ids de categorías de INGRESOS de los ids de subcategorías de GASTOS
 * en las claves de AsyncStorage (template_config_{id}, commentary_history_{id}).
 * categoryId 554 → id de comentario 100554.
 * Supone que ningún id real de la base llega a 100.000.
 */
export const INCOME_CATEGORY_OFFSET = 100_000;
