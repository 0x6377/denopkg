export type ColorFn = {
  (s: string): string;
  // chain them
  with(fn: ColorFn): ColorFn;
};

function withFunction(this: ColorFn, that: ColorFn): ColorFn {
  const combined = (s: string) => this(that(s));
  Object.defineProperty(combined, "with", { value: withFunction });
  return combined as ColorFn;
}

// NO_COLOR always wins
const noColor = Deno.noColor;

// FORCE_COLOR makes the default to output color even with a non-tty stdout
const forceColor = (function () {
  try {
    const v = Deno.env.get("FORCE_COLOR");
    return !!(v && ["1", "yes", "true"].includes(v.toLowerCase()));
  } catch (e) {
    console.error(
      "Could not access ENV to check for FORCE_COLOR. Run with `--allow-env` to permit",
    );
  }
  return false;
})();

// We check for stdout to be a TTY
const stdoutIsTTY = Deno.isatty(Deno.stdout.rid);

const initialColorEnabled = !noColor && (forceColor || stdoutIsTTY);

// we assume you are using stdout for the initial detection.
let colorEnabled = initialColorEnabled;

export function setColorEnabled(on: boolean | "reset") {
  // the NO_COLOR env take precedence to anything you do here.
  if (noColor) return;
  colorEnabled = on === "reset" ? initialColorEnabled : on;
}

export function createStyle(open: number, close: number): ColorFn {
  const fn = (s: string) =>
    colorEnabled ? `\u001B[${open}m${s}\u001B[${close}m` : s;
  Object.defineProperty(fn, "with", { value: withFunction });
  return fn as ColorFn;
}
