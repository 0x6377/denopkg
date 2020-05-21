import {
  ParseOptions,
  TokensToRegexpOptions,
  RegexpToFunctionOptions,
  match,
} from "https://deno.land/x/path_to_regexp/mod.ts";

import { Middleware, composer, compose } from "../handling.ts";
import { Context, getterSetter } from "../../context/mod.ts";

const methods = [
  "get",
  "post",
  "head",
  "options",
  "put",
  "patch",
  "delete",
] as const;
type MethodNames = typeof methods[number];

type Router<Ctx extends Context> = Middleware<Ctx> & RouterMethods<Ctx>;

type RouterMethods<Ctx extends Context> = {
  [method in MethodNames]: (
    urlPath: string,
    handler: Middleware<Ctx>,
    ...extra: Middleware<Ctx>[]
  ) => Router<Ctx>;
};

// The basic idea of the router is that each "route" is just a middleware
// that "matches" or calls "next".
// The params are attached to a getterSetter.
type Params = { [k: string]: string };

const [getRouteParams, setParams] = getterSetter<Params>(() => ({}));

export { getRouteParams };

export function createRouter<Ctx extends Context>(
  options?: ParseOptions & TokensToRegexpOptions & RegexpToFunctionOptions
): Router<Ctx> {
  const routes: Middleware<Ctx>[] = [];
  const memoizedCompose = composer();
  const methodFns: RouterMethods<Ctx> = methods.reduce((r, m) => {
    r[m] = makeRouteFn(m);
    return r;
  }, {} as RouterMethods<Ctx>);
  const middleware: Middleware<Ctx> = (h) =>
    memoizedCompose(...(routes as Middleware[]))(h);
  const router = Object.assign(middleware, methodFns);
  return router;

  function makeRouteFn(
    method: MethodNames
  ): (
    path: string,
    handler: Middleware<Ctx>,
    ...more: Middleware<Ctx>[]
  ) => Router<Ctx> {
    return (path, handler, ...more) => {
      const matcher = match<Params>(path, options);
      const inner = compose(handler, ...more);
      const route: Middleware<Ctx> = (h) => {
        // next in here is the outer next function
        if (h.req.method !== method) return h.next();
        const m = matcher(h.req.URL.pathname);
        if (!m) return h.next();
        setParams(h.ctx, m.params);
        // now call the stack
        return inner(h);
      };
      routes.push(route);
      return router;
    };
  }
}
