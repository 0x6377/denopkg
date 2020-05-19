export type JSONany =
  | JSONmap
  | JSONarray
  | string
  | number
  | boolean
  | JSONmethod;
export type JSONvalue = JSONmap | JSONarray;

type JSONmethod = { toJSON(): JSONany };
type JSONmap = { [k: string]: JSONany };
type JSONarray = Array<JSONany>;
