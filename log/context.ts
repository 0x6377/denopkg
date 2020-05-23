// the context aware logger.

import { Context, createProperty } from "../context/mod.ts";
import { LogOptions, create } from "./mod.ts";
import { RecordMeta } from "./fmt.ts";
import { Logger } from "./log.ts";

type Decorator<Ctx extends Context> = (ctx: Ctx) => RecordMeta;

export function createLogger<Ctx extends Context>(
  decorator: RecordMeta | Decorator<Ctx> = {},
  options?: Partial<LogOptions>,
) {
  let props = {};
  let propFn: Decorator<Ctx> = () => ({});
  if (typeof decorator === "function") {
    propFn = decorator as Decorator<Ctx>;
  } else {
    props = decorator;
  }
  const parent = create(options, props);
  return createProperty<Logger, Ctx>((ctx) => ({
    prop: parent.child({
      ctx: ctx.id,
      ...propFn(ctx),
    }),
  }));
}
