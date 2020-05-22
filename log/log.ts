import { sprintf } from "./deps.ts";
import { LogFormatter, RecordMeta } from "./fmt.ts";
import { jsonFormatter } from "./fmt/json.ts";
import { Level, LevelNames, getLevelName } from "./levels.ts";
import { tagEnabled } from "./debug.ts";
import { textFormatter } from "./fmt/text.ts";

// The log function returns a promise which is guarranteed not to reject,
// errors are handled by the `onError` option. If you don't want to wait
// for it to resolve, that is fine (and usual)
export type LogFn = {
  (msgFormat: string, ...interpolations: any[]): void;
  (props: RecordMeta, msgFormat: string, ...interpolations: any[]): void;
  (props: RecordMeta): void;
};

export type LogMethods = { [lvl in LevelNames]: LogFn } & {
  // this is a logger that is only enabled IFF LOG_DEBUG=tag,...
  // if the environment variable is set this ALWAYS logs, else it NEVER
  // logs.
  debuglog(tag: string): LogFn;
};

export type Logger = LogMethods & {
  // bind props to _this_ logger
  bind(props: RecordMeta): void;
  // create a new logger with current props AND new ones. current logger not affected
  child(props: RecordMeta): Logger;
};

export type ParentLogger = Logger & {
  // wait for the logs to be flushed.
  flush(): Promise<void>;
};

export type LogOptions = {
  level: Level;
  formatter: LogFormatter;
  sink: Deno.Writer;
  onError: (err: Error) => void;
};

type LogInternals = LogOptions & {
  queue: Uint8Array[]; // this is the buffer for async writes
  flushed: Promise<void>;
};

function make(options: LogInternals, props: RecordMeta): Logger {
  return Object.create(prototype, {
    level: {
      enumerable: false,
      writable: false,
      value: options.level,
    },
    options: {
      enumerable: false,
      writable: false,
      value: options,
    },
    props: {
      enumerable: false,
      writable: false,
      value: props,
    },
  });
}

function setDefaultOptions(partial: Partial<LogOptions>): LogInternals {
  const opts = Object.assign(
    {
      level: Level.ALL,
      formatter: Deno.isatty(Deno.stdout.rid)
        ? textFormatter()
        : jsonFormatter(),
      sink: Deno.stdout,
      onError: console.error,
    },
    partial
  );
  return Object.assign(opts, {
    queue: [],
    flushed: Promise.resolve(),
  });
}

// Create a new Logger with the given props, which writes to a given sink
export function create(
  options: Partial<LogOptions> = {},
  props: RecordMeta = {}
): ParentLogger {
  const opts = setDefaultOptions(options);
  return Object.assign(make(opts, props), {
    async flush() {
      await opts.flushed;
    },
  });
}

type PrivateProps = {
  options: LogInternals;
  props: RecordMeta;
};

async function log(
  options: LogInternals,
  meta: RecordMeta,
  time: number,
  level: Level,
  fmt: string,
  args: any[]
): Promise<void> {
  options.queue.push(
    options.formatter({ level, time, meta, msg: sprintf(fmt, ...args) })
  );
  // enqueue a flush if the first one.
  if (options.queue.length === 1) {
    // wait for the previous
    options.flushed = options.flushed.then(async () => {
      while (options.queue.length > 0) {
        const msg = options.queue[0];
        try {
          await options.sink.write(msg);
        } catch (err) {
          options.onError ? options.onError(err) : console.error(err);
        } finally {
          // remove the message _afterwards_
          options.queue.shift();
        }
      }
    });
  }
}

function makeLogLevelFn(level: Level, extraMeta: RecordMeta = {}): LogFn {
  return async function f(
    this: Logger & PrivateProps,
    ...args: any[]
  ): Promise<void> {
    if (this.options.level <= level) {
      let meta: RecordMeta;
      let fmt: string;
      if (typeof args[0] === "string") {
        // no meta
        meta = {};
        fmt = args.shift();
      } else {
        // meta is first arg.
        meta = args.shift();
        fmt = args.shift() ?? "";
      }

      return log(
        this.options,
        Object.assign({}, this.props, meta, extraMeta),
        Date.now(),
        level,
        fmt,
        args
      );
    }
  };
}

// per-logger $debugCache
const $debugCache = Symbol();

const prototype = {
  [getLevelName(Level.VERBOSE)]: makeLogLevelFn(Level.VERBOSE),
  [getLevelName(Level.INFO)]: makeLogLevelFn(Level.INFO),
  [getLevelName(Level.DEBUG)]: makeLogLevelFn(Level.DEBUG),
  [getLevelName(Level.WARN)]: makeLogLevelFn(Level.WARN),
  [getLevelName(Level.ERROR)]: makeLogLevelFn(Level.ERROR),
  child(this: PrivateProps, props: RecordMeta = {}) {
    // copy props.
    return make(this.options, Object.assign({}, this.props, props));
  },
  bind(this: PrivateProps, props: RecordMeta) {
    // update internal props.
    Object.assign(this.props, props);
  },
  debuglog(
    this: Logger & { [$debugCache]?: Map<string, LogFn> },
    tag: string
  ): LogFn {
    const cache =
      this[$debugCache] ?? (this[$debugCache] = new Map<string, LogFn>());
    let fn = cache.get(tag);
    if (!fn) {
      if (tagEnabled(tag)) {
        // we should cache this on the logger.
        fn = makeLogLevelFn(Level.DEBUG, { $debug: tag }).bind(this);
      } else {
        fn = async () => {
          // no-op
        };
      }
    }
    return fn;
  },
} as Logger;

// here we store a reference to a user-defined logger function.
let globalLogger: Logger = create();
export function setGlobalDebug(log: Logger) {
  globalLogger = log;
}

// This is a "global" debug log that by default logs to
// stderr a bit like node's util.debuglog
// but you can call `setGlobalDebugLog` to make your
// own debug logger, (probably to attach a Logger instance)
// best to do this as early as possible, preferably _before_
// instantiating any modules that might use it.
export function globalDebug(tag: string): LogFn {
  // this needs to be lazy!
  return (...args: any[]) => {
    // @ts-ignore this function is returned as a LogFn,
    // so we know this is OK.
    return globalLogger.debuglog(tag)(...args);
  };
}
