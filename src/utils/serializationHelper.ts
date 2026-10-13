// ~/utils/serializationHelper.ts

/**
 * UTILIDADES PARA DEBUGGING DE SERIALIZACIÓN
 * Ayudan a encontrar objetos que no se pueden serializar a JSON
 */

export interface StorageLike {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

const MAX_DEPTH = 5;

/** Bytes que ocupa un string en UTF-8 (no depende de Blob ni TextEncoder) */
const utf8ByteLength = (text: string): number => {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
};

/**
 * Encuentra recursivamente las rutas cuyo valor no es serializable
 * @param value Valor a inspeccionar
 * @param path Ruta actual (para tracking)
 */
function findProblematicPaths(value: unknown, path = 'root', depth = 0): string[] {
  if (depth > MAX_DEPTH || typeof value !== 'object' || value === null) {
    return [];
  }

  const isArray = Array.isArray(value);
  const paths: string[] = [];

  Object.entries(value).forEach(([key, child]) => {
    try {
      JSON.stringify(child);
    } catch {
      const childPath = isArray ? `${path}[${key}]` : `${path}.${key}`;
      paths.push(childPath, ...findProblematicPaths(child, childPath, depth + 1));
    }
  });

  return paths;
}

/**
 * Valida si un valor es serializable a JSON
 * En desarrollo, muestra las rutas que causan el problema
 * @param obj Valor a validar
 * @param name Nombre para logging (opcional)
 * @returns true si es serializable, false si no
 */
export function validateSerializable(obj: unknown, name = 'object'): boolean {
  try {
    JSON.stringify(obj);
    return true;
  } catch {
    if (__DEV__) {
      const paths = findProblematicPaths(obj, name);
      console.warn(`"${name}" no es serializable.`, paths.length > 0 ? paths : '');
    }
    return false;
  }
}

/**
 * Limpia un valor para hacerlo serializable
 * Remueve funciones y reemplaza referencias circulares
 * @param obj Valor a limpiar
 * @returns Valor limpio y serializable
 */
export function cleanForSerialization<T>(obj: T): T {
  const seen = new WeakSet<object>();

  return JSON.parse(
    JSON.stringify(obj, (_key, value: unknown) => {
      if (typeof value === 'function') {
        return undefined;
      }

      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      return value;
    })
  ) as T;
}

/**
 * Obtiene el tamaño en KB de un valor serializado
 * @param obj Valor a medir
 * @returns Tamaño en KB o null si no es serializable
 */
export function getSerializedSize(obj: unknown): number | null {
  try {
    return utf8ByteLength(JSON.stringify(obj)) / 1024;
  } catch {
    return null;
  }
}

/**
 * Valida y limpia un valor antes de guardarlo
 * @param obj Valor a procesar
 * @param name Nombre para logging
 * @returns Valor limpio o null si hay error crítico
 */
export function prepareForStorage<T>(obj: T, name = 'object'): T | null {
  if (validateSerializable(obj, name)) {
    return obj;
  }

  try {
    const cleaned = cleanForSerialization(obj);
    return validateSerializable(cleaned, `${name} (limpio)`) ? cleaned : null;
  } catch {
    return null;
  }
}

/**
 * Wrapper seguro para AsyncStorage.setItem
 * @param storage Storage (por ejemplo AsyncStorage)
 * @param key Clave
 * @param value Valor (se serializa automáticamente)
 * @returns true si se guardó, false si falló
 */
export async function safeSetItem(
  storage: StorageLike,
  key: string,
  value: unknown
): Promise<boolean> {
  const prepared = prepareForStorage(value, key);
  if (prepared === null) {
    return false;
  }

  try {
    await storage.setItem(key, JSON.stringify(prepared));
    return true;
  } catch {
    return false;
  }
}

/**
 * Wrapper seguro para AsyncStorage.getItem
 * @param storage Storage (por ejemplo AsyncStorage)
 * @param key Clave
 * @returns Valor parseado o null
 */
export async function safeGetItem<T>(storage: StorageLike, key: string): Promise<T | null> {
  try {
    const value = await storage.getItem(key);
    return value === null ? null : (JSON.parse(value) as T);
  } catch {
    return null;
  }
}
