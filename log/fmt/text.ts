import { LogFormatter } from "../fmt.ts";
import { Level } from "../levels.ts";

// we can do relative imports even in the mono-repo, because it will all be served
// from a common root anyway, so they will resolve
import {
  red,
  cyan,
  gray,
  yellow,
  green,
  bold,
  white,
} from "../../color/mod.ts";

const levelColors = {
  [Level.VERBOSE]: green.with(bold),
  [Level.INFO]: cyan.with(bold),
  [Level.WARN]: yellow.with(bold),
  [Level.ERROR]: red.with(bold),
  [Level.DEBUG]: white.with(bold),
};
// I want these all the same width!
const levelStrings = {
  [Level.VERBOSE]: levelColors[Level.VERBOSE]("VRBSE"),
  [Level.INFO]: levelColors[Level.INFO](" INFO"),
  [Level.WARN]: levelColors[Level.WARN](" WARN"),
  [Level.ERROR]: levelColors[Level.ERROR]("ERROR"),
  [Level.DEBUG]: levelColors[Level.DEBUG]("DEBUG"),
};

/**
 * Text Formatter: Output for humans
 *
 * @TODO better colors, formatting, some options for things like timestamp format (inc. relative)
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
    const metaStr = Object.entries(meta).reduce<string>(
      (s, [k, v]) => `${s}\n    - ${cyan(k)}: ${Deno.inspect(v)}`,
      ""
    );
    const lvl = levelStrings[level];
    const clr = levelColors[level];
    const ts = clr(formatTime(time, options.time, initialised));
    let txt = msg.trim().replace(/\n/gm, linePad);
    txt = txt ? clr(txt) : gray("<no message>");
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
  // this doesn't know anything about the sink.
  // so you should do "Deno.isatty("
  color: true | false;
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
  color: !Deno.noColor,
};
