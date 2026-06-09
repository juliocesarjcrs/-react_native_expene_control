import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_KEY = 'debug_render_log';
const MAX_ENTRIES = 300;

export const debugLog = async (tag: string, data: Record<string, unknown>) => {
  if (__DEV__) {
    console.log(`[${tag}]`, data);
    return;
  }
  try {
    const existing = await AsyncStorage.getItem(LOG_KEY);
    const logs: unknown[] = existing ? JSON.parse(existing) : [];
    logs.push({ t: Date.now(), tag, ...data });
    if (logs.length > MAX_ENTRIES) logs.splice(0, logs.length - MAX_ENTRIES);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch {}
};

export const getDebugLogs = async (): Promise<unknown[]> => {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearDebugLogs = () => AsyncStorage.removeItem(LOG_KEY);
