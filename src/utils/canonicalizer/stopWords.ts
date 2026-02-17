// Sufijos de tienda, unidades, calificadores genéricos que el OCR incluye
// pero que no diferencian un producto de otro para efectos de análisis.
export const STOP_WORDS = new Set([
  // Tiendas
  'carulla',
  'exito',
  'éxito',
  'd1',
  'supercarnesjh',
  // Unidades / presentación
  'und',
  'unidad',
  'unidades',
  'kg',
  'kgs',
  'gr',
  'gramos',
  'xkg',
  'x',
  'lts',
  'lt',
  'ml',
  'cc',
  // Calificadores OCR genéricos
  'a',
  'granel',
  'malla',
  'bolsa',
  'bandeja',
  'paquete',
  'el',
  'la',
  'los',
  'las',
  // Letras sueltas producto de truncamiento
  'aa',
  'ab',
  'ac'
]);
