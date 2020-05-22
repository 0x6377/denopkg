import { LogFormatter } from "../fmt.ts";
import { Level } from "../levels.ts";

// we can do relative imports even in the mono-repo, because it will all be served
// from a common root anyway, so they will resolve
import {
  cyan,
  gray,
  bold,
  cyanBright,
  greenBright,
  whiteBright,
  yellowBright,
  redBright,
  inverse,
} from "../../color/mod.ts";

const levelColors = {
  [Level.VERBOSE]: greenBright.with(bold),
  [Level.INFO]: cyanBright.with(bold),
  [Level.WARN]: yellowBright.with(bold),
  [Level.ERROR]: redBright.with(bold),
  [Level.DEBUG]: whiteBright.with(bold),
};
// I want these all the same width!
const levelStrings = {
  [Level.VERBOSE]: levelColors[Level.VERBOSE]("VRBSE"),
  [Level.INFO]: levelColors[Level.INFO](" INFO"),
  [Level.WARN]: levelColors[Level.WARN](" WARN"),
  [Level.ERROR]: levelColors[Level.ERROR]("ERROR"),
  [Level.DEBUG]: levelColors[Level.DEBUG]("DEBUG"),
};

const debugTagColor = yellowBright.with(bold);

/**
 * Text Formatter: Output for humans
 */
export const textFormatter: (opts?: Partial<TextOptions>) => LogFormatter = (
  opts = {}
) => {
  const options = Object.assign({}, defaultOptions, opts) as TextOptions;
  const encoder = new TextEncoder();
  const initialised = Date.now();
  // the level is 5, then a space, the the time with 2 brackets.
  // then a final space.
  const width = 9 + formatTime(initialised, options.time, initialised).length;
  const linePad = "\n" + " ".repeat(width);
  return ({ level, time, meta, msg }) => {
    const { $debug = false, ...rest } = meta;
    const metaStr = Object.entries(rest).reduce<string>(
      (s, [k, v]) => `${s}\n    - ${cyan(k)}: ${Deno.inspect(v)}`,
      ""
    );
    const lvl = levelStrings[level];
    const clr = levelColors[level];
    const ts = clr(formatTime(time, options.time, initialised));
    let txt = msg.trim().replace(/\n/gm, linePad);
    txt = txt ? clr(txt) : gray("<no message>");
    if ($debug !== false) {
      txt = `${debugTagColor($debug)} ${txt}`;
    }
    const str = `${lvl} [${ts}] ${txt}${metaStr}\n`;
    return encoder.encode(str);
  };
};

export enum TimeStyle {
  Relative, // seconds since initialise
  Epoch, // epoch seconds
  ISO, // ISO string
  Kitchen, // HH:mm:ss.sss
  Locale, // toLocaleString
}

export type TextOptions = {
  time: TimeStyle;
};

function formatTime(ts: number, style: TimeStyle, initialTs: number): string {
  switch (style) {
    case TimeStyle.Epoch:
      return (ts / 1000).toFixed(3);
    case TimeStyle.ISO:
      return new Date(ts).toISOString();
    case TimeStyle.Locale:
      return new Date(ts).toLocaleString();
    case TimeStyle.Kitchen:
      const d = new Date(ts);
      const t = d.toTimeString().slice(0, 8);
      const ms = (d.getMilliseconds() / 1000).toFixed(3).slice(1);
      return t + ms;
    case TimeStyle.Relative:
      // a running time of 1 day would be 86400 seconds
      // which is 5 digits. So we pad to that
      return ((ts - initialTs) / 1000).toFixed(3).padStart(9, "0");
  }
}

const defaultOptions: TextOptions = {
  time: TimeStyle.Kitchen,
};
