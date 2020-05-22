import { Context } from "../context/mod.ts";

import { Request } from "./request.ts";

export type Handle<Ctx extends Context> = {
  req: Request;
  next: () => Promise<unknown>;
  ctx: Ctx;
};

export type Middleware<Ctx extends Context = Context> = (h: Handle<Ctx>) => any;

export const composer = () => memo(compose);

/**
 * Compose multiple middleware in a self-contained stack.
 * This means the `next` function passed in initially will
 * bypass the entire stack and return control to the caller.
 * The inner `next` functions will pass control up the stack
 * as expected.
 * This allows us to create small pockets of self contained functionality.
 */
export const compose = <Ctx extends Context>(
  ...middlewares: Middleware<Ctx>[]
): Middleware<Ctx> => {
  if (middlewares.length === 0) {
    throw new Error("must pass at least one middleware to `compose`");
  }
  if (middlewares.length === 1) {
    return middlewares[0];
  }
  const outerRun = (outerNext: Handle<Ctx>["next"]) => {
    return async function innerRun(
      index: number,
      req: Request,
      ctx: Ctx
    ): Promise<any> {
      const m = middlewares[index];
      if (!m) {
        return outerNext();
      }
      let nextCalled = false;
      let nextDone = false;
      let nextPromise: Promise<any> = Promise.resolve();
      const next = () => {
        if (nextCalled) {
          throw new Error(
            "`next` function called twice from the same middleware"
          );
        }
        nextCalled = true;
        // move on to the next middleware. before we return.
        nextPromise = innerRun(index + 1, req, ctx);
        return nextPromise.finally(() => {
          nextDone = true;
        });
      };
      await Promise.resolve(m({ req, ctx, next })).finally(() => {
        if (nextCalled && !nextDone) {
          throw new Error(
            "middleware did not wait for `next` to complete.\n" +
              "Either `await next()` it or `return next()`"
          );
        }
      });
    };
  };
  return ({ req, ctx, next }) => outerRun(next)(0, req, ctx);
};

function memo<T extends (...args: any) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  let lastArgs: Parameters<T>;
  let lastResult: ReturnType<T>;
  return (...args) => {
    if (
      !lastArgs ||
      (args as Array<any>).some((arg, i) => arg !== lastArgs[i])
    ) {
      lastArgs = args;
      lastResult = fn(...(args as Array<any>));
    }
    return lastResult;
  };
}
