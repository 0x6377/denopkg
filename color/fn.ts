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

export function createStyle(open: number, close: number): ColorFn {
  const fn = (s: string) => `\u001B[${open}m${s}\u001B[${close}m`;
  Object.defineProperty(fn, "with", { value: withFunction });
  return fn as ColorFn;
}
