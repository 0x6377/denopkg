import { Middleware } from "../mod.ts";

// @see https://github.com/helmetjs/dont-sniff-mimetype

export function noSniff(): Middleware {
  return ({ req, next }) => {
    req.set("x-content-type-options", "nosniff");
    return next();
  };
}
