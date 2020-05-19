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

const noColor = Deno.noColor;
const forceColor = (function () {
  try {
    const v = Deno.env.get("FORCE_COLOR");
    return !!(v && ["1", "yes", "true"].includes(v.toLowerCase()));
  } catch (e) {
    console.error(
      "Could not access ENV to check for FORCE_COLOR. Run with `--allow-env` to permit"
    );
  }
  return false;
})();

const stdoutIsTTY = Deno.isatty(Deno.stdout.rid);

const initialColorEnabled = forceColor || (!noColor && stdoutIsTTY);
// we assume you are using stdout for the initial detection.
let colorEnabled = initialColorEnabled;
export function setColorEnabled(on: boolean | "reset") {
  colorEnabled = on === "reset" ? initialColorEnabled : on;
}

export function createStyle(open: number, close: number): ColorFn {
  const fn = (s: string) =>
    colorEnabled ? `\u001B[${open}m${s}\u001B[${close}m` : s;
  Object.defineProperty(fn, "with", { value: withFunction });
  return fn as ColorFn;
}
