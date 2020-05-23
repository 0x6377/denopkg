import { Context } from "../../context/mod.ts";
import { Middleware } from "../handling.ts";

export function mount<Ctx extends Context>(
  prefix: string,
  m: Middleware<Ctx>,
): Middleware<Ctx> {
  // ensure prefix starts with a slash and ends without one.
  const pre = `/${prefix.replace(/(^\/|^$)/g, "")}`;
  const cut = pre.length;
  return ({ req, ctx, next: outerNext }) => {
    const originalPath = req.URL.pathname;
    // if we didn't match, skip.
    if (!originalPath.startsWith(pre)) return outerNext();
    // we did match:
    // mutate the url and pass it back afterwards.
    req.URL.pathname = originalPath.slice(cut);
    const next = () => {
      // before we go on, we need to reset the path.
      req.URL.pathname = originalPath;
      return outerNext();
    };
    return m({ req, ctx, next });
  };
}
