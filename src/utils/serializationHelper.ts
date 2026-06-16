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

    return true;
  } catch (error) {
    // Intentar encontrar el campo problemático
    if (typeof obj === 'object' && obj !== null) {
      findProblematicField(obj, name);
    } else {
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
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      try {
        JSON.stringify(item);
      } catch {
        if (typeof item === 'object' && item !== null) {
          findProblematicField(item, `${path}[${index}]`, depth + 1);
        }
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach((key) => {
      try {
        JSON.stringify(obj[key]);
      } catch {
        const value = obj[key];
        const type = typeof value;

        if (type === 'function') {
        } else if (type === 'undefined') {
        } else if (value === null) {
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
          } catch {}

          findProblematicField(value, `${path}.${key}`, depth + 1);
        } else {
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
        return undefined;
      }

      // Detectar referencias circulares
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
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
  } catch {
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
  // Paso 1: Validar si es serializable
  if (validateSerializable(obj, name)) {
    return obj;
  }

  // Paso 2: Intentar limpiar
  try {
    const cleaned = cleanForSerialization(obj);

    if (validateSerializable(cleaned, `${name} (limpio)`)) {
      return cleaned;
    }
  } catch {}

  return null;
}

/**
 * Wrapper seguro para AsyncStorage.setItem
 * @param key Clave
 * @param value Valor (será serializado automáticamente)
 */
export async function safeSetItem(storage: any, key: string, value: any): Promise<boolean> {
  try {
    // Validar y limpiar
    const prepared = prepareForStorage(value, key);
    if (!prepared) {
      throw new Error(`No se pudo preparar "${key}" para guardar`);
    }

    // Serializar
    const serialized = JSON.stringify(prepared);
    const sizeKB = (new Blob([serialized]).size / 1024).toFixed(2);

    // Guardar
    await storage.setItem(key, serialized);

    return true;
  } catch {
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
    const value = await storage.getItem(key);

    if (value === null) {
      return null;
    }

    const parsed = JSON.parse(value);

    return parsed as T;
  } catch {
    return null;
  }
}
