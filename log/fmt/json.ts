import { LogFormatter, LogRecord, RecordMeta } from "../fmt.ts";
import { Level } from "../levels.ts";

/**
 * JSON Lines Formatter: Output for machines
 *
 * @TODO safe serialisation (i.e. no cycles)
 * @TODO pino/graylog format adapters
 */
export const jsonFormatter: (opts?: Partial<JsonOptions>) => LogFormatter = (
  opts = {},
) => {
  const { style } = Object.assign({}, defaultOptions, opts);
  const encoder = new TextEncoder();
  const transform: Transformer = getStringer(style);
  return (record) => encoder.encode(JSON.stringify(transform(record)) + "\n");
};

type Transformer = (record: LogRecord) => any;

export type JsonOptions = {
  style: "default" | "pino" | "gelf";
};

const defaultOptions: JsonOptions = { style: "default" };

const getStringer = (style: JsonOptions["style"]): Transformer => {
  switch (style) {
    case "default":
      return defaultStyle;
    case "pino":
      return pinoStyle;
    case "gelf":
      return gelfStyle;
  }
  // unreachable
};

const defaultStyle: Transformer = (x) => x;

const mapObject = (
  obj: RecordMeta,
  fn: (a: [string, any]) => [string, any],
): RecordMeta => {
  return Object.fromEntries(Object.entries(obj).map(fn));
};

const pinoStyle: Transformer = ({ level, time, meta, msg }) => {
  // make sure we don't clobber any keys.
  // pino lets you make that mistake
  return {
    level,
    time,
    ...mapObject(meta, ([k, v]) => [
      ["time", "level", "msg", "v"].includes(k) ? "_" + k : k,
      v,
    ]),
    msg,
    v: 1,
  };
};

const gelfStyle: Transformer = ({ level, time, meta, msg }) => {
  let { host, ...rest } = meta;
  if (!host) {
    host = "deno";
  }
  const short_message = msg.split("\n")[0];
  const full_message = msg;
  const timestamp = time / 1000;
  return {
    version: "1.1",
    host,
    timestamp,
    short_message,
    full_message,
    level: toSyslog(level),
    ...mapObject(rest, ([k, v]) => ["_" + k, stringOrNumber(v)]),
  };
};

/**
 * Syslog levels:
 *  0 = emergency
 *  1 = alert
 *  2 = critical
 *  3 = err
 *  4 = warning
 *  5 = notice
 *  6 = informational
 *  7 = debug
 */
function toSyslog(level: Level): number {
  switch (level) {
    case Level.VERBOSE:
      // this is the 'debug' syslog, but represents
      // our verbose case
      return 7;
    case Level.INFO:
      return 6;
    case Level.WARN:
      return 4;
    case Level.ERROR:
      return 3;
    case Level.DEBUG:
      // we have hijacked critical here because I think
      // debug should be the highest import
      return 2;
    default:
      return 1;
  }
}

function stringOrNumber(x: any): string | number {
  if (typeof x === "string") {
    return x;
  }
  if (typeof x === "number") {
    return x;
  }
  return JSON.stringify(x);
}
