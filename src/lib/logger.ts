// =====================================================
// STRUCTURED LOGGER — replaces raw console.log in prod
// =====================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const IS_PRODUCTION = import.meta.env.PROD;
const MIN_LEVEL: LogLevel = IS_PRODUCTION ? 'warn' : 'debug';

interface LogEntry {
  ts: string;
  level: LogLevel;
  module: string;
  msg: string;
  data?: Record<string, unknown>;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function emit(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const prefix = `[${entry.module}]`;

  switch (entry.level) {
    case 'error':
      console.error(prefix, entry.msg, entry.data ?? '');
      break;
    case 'warn':
      console.warn(prefix, entry.msg, entry.data ?? '');
      break;
    case 'info':
      console.info(prefix, entry.msg, entry.data ?? '');
      break;
    default:
      console.debug(prefix, entry.msg, entry.data ?? '');
  }

  // In production, persist errors to localStorage for debugging
  if (IS_PRODUCTION && entry.level === 'error') {
    try {
      const errors = JSON.parse(localStorage.getItem('error_log') || '[]');
      errors.push(entry);
      if (errors.length > 50) errors.splice(0, errors.length - 50);
      localStorage.setItem('error_log', JSON.stringify(errors));
    } catch {
      // Silent fail
    }
  }
}

/**
 * Create a scoped logger for a module.
 * In production, only warn/error are emitted.
 * In development, all levels are emitted.
 */
export function createLogger(module: string) {
  return {
    debug: (msg: string, data?: unknown) =>
      emit({ ts: new Date().toISOString(), level: 'debug', module, msg, data: data as Record<string, unknown> }),
    info: (msg: string, data?: unknown) =>
      emit({ ts: new Date().toISOString(), level: 'info', module, msg, data: data as Record<string, unknown> }),
    warn: (msg: string, data?: unknown) =>
      emit({ ts: new Date().toISOString(), level: 'warn', module, msg, data: data as Record<string, unknown> }),
    error: (msg: string, data?: unknown) =>
      emit({ ts: new Date().toISOString(), level: 'error', module, msg, data: data as Record<string, unknown> }),
  };
}

/** Default logger for quick use */
export const logger = createLogger('App');
