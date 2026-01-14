// ~/utils/serializationHelper.ts

/**
 * UTILIDAD PARA DEBUGGING DE SERIALIZACIÓN
 * Ayuda a encontrar objetos que no se pueden serializar a JSON
 */

/**
 * Valida si un objeto es serializable a JSON
 * @param obj Objeto a validar
 * @param name Nombre para logging (opcional)
 * @returns true si es serializable, false si no
 */
export function validateSerializable(obj: any, name: string = 'object'): boolean {
  try {
    const serialized = JSON.stringify(obj);
    const size = new Blob([serialized]).size;
    const sizeKB = (size / 1024).toFixed(2);

    console.log(`✅ [Serialization] "${name}" es serializable (${sizeKB} KB)`);
    return true;
  } catch (error) {
    console.error(`🔴 [Serialization] "${name}" NO es serializable`);
    console.error('Error:', error instanceof Error ? error.message : String(error));

    // Intentar encontrar el campo problemático
    if (typeof obj === 'object' && obj !== null) {
      console.log('🔍 Buscando campo problemático...');
      findProblematicField(obj, name);
    } else {
      console.log('Tipo:', typeof obj);
      console.log('Valor:', obj);
    }

    return false;
  }
}

/**
 * Encuentra recursivamente qué campo no es serializable
 * @param obj Objeto a inspeccionar
 * @param path Ruta actual (para tracking)
 */
function findProblematicField(obj: any, path: string = 'root', depth: number = 0): void {
  if (depth > 5) {
    console.log(`  ${'  '.repeat(depth)}⚠️ Profundidad máxima alcanzada en: ${path}`);
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      try {
        JSON.stringify(item);
      } catch (err) {
        console.error(`  ${'  '.repeat(depth)}❌ ${path}[${index}]`);
        if (typeof item === 'object' && item !== null) {
          findProblematicField(item, `${path}[${index}]`, depth + 1);
        } else {
          console.log(`  ${'  '.repeat(depth + 1)}Tipo: ${typeof item}`);
          console.log(`  ${'  '.repeat(depth + 1)}Valor:`, item);
        }
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach((key) => {
      try {
        JSON.stringify(obj[key]);
      } catch (err) {
        console.error(`  ${'  '.repeat(depth)}❌ ${path}.${key}`);

        const value = obj[key];
        const type = typeof value;

        console.log(`  ${'  '.repeat(depth + 1)}Tipo: ${type}`);

        if (type === 'function') {
          console.log(`  ${'  '.repeat(depth + 1)}Función: ${value.name || 'anónima'}`);
        } else if (type === 'undefined') {
          console.log(`  ${'  '.repeat(depth + 1)}Valor: undefined`);
        } else if (value === null) {
          console.log(`  ${'  '.repeat(depth + 1)}Valor: null`);
        } else if (type === 'object') {
          // Detectar referencias circulares
          try {
            const seen = new WeakSet();
            JSON.stringify(value, (key, val) => {
              if (typeof val === 'object' && val !== null) {
                if (seen.has(val)) {
                  return '[Circular]';
                }
                seen.add(val);
              }
              return val;
            });
          } catch (circularErr) {
            console.log(`  ${'  '.repeat(depth + 1)}⚠️ Referencia circular detectada`);
          }

          findProblematicField(value, `${path}.${key}`, depth + 1);
        } else {
          console.log(`  ${'  '.repeat(depth + 1)}Valor:`, String(value).substring(0, 100));
        }
      }
    });
  }
}

/**
 * Limpia un objeto para hacerlo serializable
 * Remueve funciones, undefined, y referencias circulares
 * @param obj Objeto a limpiar
 * @returns Objeto limpio y serializable
 */
export function cleanForSerialization<T>(obj: T): T {
  const seen = new WeakSet();

  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      // Remover funciones
      if (typeof value === 'function') {
        console.warn(`⚠️ Removiendo función: ${key}`);
        return undefined;
      }

      // Detectar referencias circulares
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          console.warn(`⚠️ Removiendo referencia circular en: ${key}`);
          return '[Circular]';
        }
        seen.add(value);
      }

      return value;
    })
  );
}

/**
 * Obtiene el tamaño en KB de un objeto serializado
 * @param obj Objeto a medir
 * @returns Tamaño en KB o null si no es serializable
 */
export function getSerializedSize(obj: any): number | null {
  try {
    const serialized = JSON.stringify(obj);
    const size = new Blob([serialized]).size;
    return size / 1024;
  } catch (error) {
    console.error(
      'No se pudo calcular el tamaño:',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Valida y limpia un objeto antes de guardarlo
 * @param obj Objeto a procesar
 * @param name Nombre para logging
 * @returns Objeto limpio o null si hay error crítico
 */
export function prepareForStorage<T>(obj: T, name: string = 'object'): T | null {
  console.log(`🔵 [Storage] Preparando "${name}" para guardar...`);

  // Paso 1: Validar si es serializable
  if (validateSerializable(obj, name)) {
    console.log(`✅ [Storage] "${name}" está listo para guardar`);
    return obj;
  }

  // Paso 2: Intentar limpiar
  console.log(`⚠️ [Storage] "${name}" tiene problemas, intentando limpiar...`);
  try {
    const cleaned = cleanForSerialization(obj);

    if (validateSerializable(cleaned, `${name} (limpio)`)) {
      console.log(`✅ [Storage] "${name}" limpiado exitosamente`);
      return cleaned;
    }
  } catch (error) {
    console.error(`🔴 [Storage] No se pudo limpiar "${name}":`, error);
  }

  console.error(`🔴 [Storage] "${name}" no se puede guardar`);
  return null;
}

/**
 * Wrapper seguro para AsyncStorage.setItem
 * @param key Clave
 * @param value Valor (será serializado automáticamente)
 */
export async function safeSetItem(storage: any, key: string, value: any): Promise<boolean> {
  try {
    console.log(`🔵 [Storage] Guardando "${key}"...`);

    // Validar y limpiar
    const prepared = prepareForStorage(value, key);
    if (!prepared) {
      throw new Error(`No se pudo preparar "${key}" para guardar`);
    }

    // Serializar
    const serialized = JSON.stringify(prepared);
    const sizeKB = (new Blob([serialized]).size / 1024).toFixed(2);
    console.log(`🔵 [Storage] Tamaño: ${sizeKB} KB`);

    // Guardar
    await storage.setItem(key, serialized);
    console.log(`✅ [Storage] "${key}" guardado exitosamente`);

    return true;
  } catch (error) {
    console.error(`🔴 [Storage] ERROR guardando "${key}":`, error);
    console.error('Stack:', error instanceof Error ? error.stack : String(error));
    return false;
  }
}

/**
 * Wrapper seguro para AsyncStorage.getItem
 * @param key Clave
 * @returns Valor parseado o null
 */
export async function safeGetItem<T>(storage: any, key: string): Promise<T | null> {
  try {
    console.log(`🔵 [Storage] Leyendo "${key}"...`);

    const value = await storage.getItem(key);

    if (value === null) {
      console.log(`ℹ️ [Storage] "${key}" no existe`);
      return null;
    }

    const parsed = JSON.parse(value);
    console.log(`✅ [Storage] "${key}" leído exitosamente`);

    return parsed as T;
  } catch (error) {
    console.error(`🔴 [Storage] ERROR leyendo "${key}":`, error);
    return null;
  }
}
