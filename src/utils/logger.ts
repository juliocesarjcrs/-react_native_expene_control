import * as Sentry from '@sentry/react-native';
import type { SeverityLevel } from '@sentry/react-native';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Dominios de tu app — extiende según necesites
type LogDomain = 'screen' | 'service' | 'context' | 'hook' | 'navigation' | 'component';

interface LogExtra {
  [key: string]: unknown;
}

const isDev = __DEV__;

const toSeverity = (level: LogLevel): SeverityLevel => {
  if (level === 'warn') return 'warning';
  return level;
};

const log = (level: LogLevel, category: string, message: string, extra?: LogExtra) => {
  if (isDev) {
    const prefix = { info: '🔵', warn: '🟡', error: '🔴', debug: '⚪' }[level];
    console[level === 'debug' ? 'log' : level](`${prefix} [${category}] ${message}`, extra ?? '');
  }

  Sentry.addBreadcrumb({
    category, // aparece en Sentry como "screen.Login" etc.
    message,
    data: extra,
    level: toSeverity(level)
  });
};

// Crea un logger con categoría fija: createLogger('screen', 'Login')
export const createLogger = (domain: LogDomain, name: string) => {
  const category = `${domain}.${name}`;

  return {
    info: (message: string, extra?: LogExtra) => log('info', category, message, extra),
    warn: (message: string, extra?: LogExtra) => log('warn', category, message, extra),
    debug: (message: string, extra?: LogExtra) => log('debug', category, message, extra),
    error: (message: string, error?: unknown, extra?: LogExtra) => {
      log('error', category, message, extra);
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: { domain, screen: name },
          extra: { message, ...extra }
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          tags: { domain, screen: name },
          extra: { error, ...extra }
        });
      }
    }
  };
};

// Logger genérico para casos sin contexto fijo (ej: App.tsx, interceptors)
export const logger = {
  info: (message: string, extra?: LogExtra) => log('info', 'app', message, extra),
  warn: (message: string, extra?: LogExtra) => log('warn', 'app', message, extra),
  debug: (message: string, extra?: LogExtra) => log('debug', 'app', message, extra),
  error: (message: string, error?: unknown, extra?: LogExtra) => {
    log('error', 'app', message, extra);
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: { message, ...extra } });
    } else {
      Sentry.captureMessage(message, { level: 'error', extra: { error, ...extra } });
    }
  }
};
