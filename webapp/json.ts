export type TopLevelJSONable = JSONArray | JSONMap | JSONTopMethod;
export type JSONable = JSONPrimitive | JSONArray | JSONMap | JSONMethod;

type JSONTopMethod = { toJSON(): JSONArray | JSONMap };
type JSONPrimitive = string | number | boolean | undefined;
type JSONArray = Array<JSONable>;
type JSONMap = { [k: string]: JSONable };
type JSONMethod = { toJSON(): JSONArray | JSONMap | JSONPrimitive };
