import { Context } from "./context.ts";

// sometimes you want to bind properties to your context on the fly
// e.g. a one off thing that you don't use all around your application.

// sometimes you want to bind them ahead of time
// e.g. common things like access to configuration

// sometimes you want to bind them to the the "top" level context lifecycle.
// e.g. database connections, so full application shutdown can close resources
// gracefully

// sometimes you want to bind them at the top, but create sub-instances
// at each child, so that you have a single main entity and per-request
// children.

// createProperty() is the core add to ctx, can be done on the fly
// or ahead of time.

// createTopProperty() is the bind at the top version

type Initialiser<Prop, Ctx extends Context> = (ctx: Ctx) => Loaded<Prop, Ctx>;
type Loaded<Prop, Ctx extends Context> = {
  prop: Prop;
  unload?: () => {};
};
type Property<Prop extends any, Ctx extends Context> = (ctx: Ctx) => Prop;

export function createProperty<Prop, Ctx extends Context>(
  init: Initialiser<Prop, Ctx>
): Property<Prop, Ctx> {
  const map = new WeakMap<Ctx, Loaded<Prop, Ctx>>();
  return (ctx: Ctx) => {
    let loaded = map.get(ctx);
    if (loaded === undefined) {
      loaded = init(ctx);
      map.set(ctx, loaded);
      if (loaded.unload) {
        // none of the optional chaining is actually needed...
        ctx.wait().then(() => loaded?.unload?.());
      }
    }
    return loaded.prop;
  };
}

type SubInit<Top, Sub, Ctx extends Context> = (
  ctx: Ctx,
  top: Top
) => Loaded<Sub, Ctx>;

export function createTopProperty<Top, Sub, Ctx extends Context>(
  init: Initialiser<Top, Ctx>,
  sub: SubInit<Top, Sub, Ctx>
): Property<Sub, Ctx> {
  const mainProp = createProperty(init);
  const map = new WeakMap<Ctx, Loaded<Sub, Ctx>>();
  return (ctx: Ctx) => {
    let loaded = map.get(ctx);
    if (loaded === undefined) {
      const main = mainProp(ctx.top());
      loaded = sub(ctx, main);
      map.set(ctx, loaded);
      if (loaded.unload) {
        ctx.wait().then(() => loaded?.unload?.());
      }
    }
    return loaded.prop;
  };
}
