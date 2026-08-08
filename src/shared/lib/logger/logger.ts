import { env } from '@/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Structured context attached to a log line. Keep it JSON-serialisable. */
export type LogContext = Record<string, unknown>;

export interface LogRecord {
  level: LogLevel;
  message: string;
  context: LogContext;
  error: Error | undefined;
}

/**
 * Where log records go. Swapping the vendor — Sentry, Datadog, a log drain — is
 * adding a sink here, not editing every call site.
 */
export type LogSink = (record: LogRecord) => void;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * `debug` is noise in a deployed environment and `info` is noise in the browser
 * console during development; this is the floor each environment ships with.
 */
const MINIMUM_LEVEL: LogLevel = env.NEXT_PUBLIC_ENV === 'local' ? 'debug' : 'info';

/**
 * The console sink is the only one wired by default.
 *
 * `no-console` is an ESLint error everywhere else in the codebase precisely so
 * that this is the one place raw console access lives — which is what makes
 * adding a second sink a single-file change.
 */
const consoleSink: LogSink = ({ level, message, context, error }) => {
  const payload = { ...context, ...(error ? { error } : {}) };
  const hasPayload = Object.keys(payload).length > 0;

  /* eslint-disable no-console -- this sink is the one sanctioned console access */
  // Bound explicitly: detaching a console method from its object loses `this` in
  // some runtimes, and the implicit-`this` lint rule is right to flag it.
  const write =
    level === 'debug'
      ? console.debug.bind(console)
      : level === 'info'
        ? console.info.bind(console)
        : level === 'warn'
          ? console.warn.bind(console)
          : console.error.bind(console);
  /* eslint-enable no-console */

  if (hasPayload) {
    write(message, payload);
  } else {
    write(message);
  }
};

const sinks: LogSink[] = [consoleSink];

/**
 * Registers an additional destination and returns a function that removes it.
 *
 * Call this from `instrumentation.ts` (server) or a client provider once the
 * vendor SDK has initialised — not at module load, or the SDK may not exist yet.
 */
export function addLogSink(sink: LogSink): () => void {
  sinks.push(sink);

  return () => {
    const index = sinks.indexOf(sink);
    if (index !== -1) sinks.splice(index, 1);
  };
}

function emit(level: LogLevel, message: string, context: LogContext = {}): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MINIMUM_LEVEL]) return;

  // The error is lifted out of the context bag so sinks get it as a real Error
  // with a stack, rather than as a value that JSON.stringify flattens to `{}`.
  const { error, ...rest } = context;

  const record: LogRecord = {
    level,
    message,
    context: rest,
    error: error instanceof Error ? error : undefined,
  };

  for (const sink of sinks) {
    try {
      sink(record);
    } catch {
      // A broken sink must never take down the code that was only logging.
    }
  }
}

/**
 * Application logger.
 *
 * Runs on both the server and the client — keep the call sites free of anything
 * runtime-specific, and never log a token, password, or full request body.
 */
export const logger = {
  debug: (message: string, context?: LogContext): void => {
    emit('debug', message, context);
  },
  info: (message: string, context?: LogContext): void => {
    emit('info', message, context);
  },
  warn: (message: string, context?: LogContext): void => {
    emit('warn', message, context);
  },
  error: (message: string, context?: LogContext): void => {
    emit('error', message, context);
  },
};
