import { Middleware, Request } from "../mod.ts";
import { Context } from "../../context/mod.ts";

type Promisable<T> = Promise<T> | T;

type CorsOptions<Ctx extends Context = Context> = {
  // this function takes the "given" origin in a CORS preflight
  // request and returns the "allowed" origin string or `true`
  // which means use the "origin" header.
  allowOrigin(req: Request, ctx: Ctx): Promisable<string | true>;

  // the methods to set in the Access-Control-Allow-Methods header
  allowMethods: string[];

  // the access-control-expose-headers content
  exposeHeaders: string[];

  // the access-control-allow-headers content
  // if the value is the string "reflect", then
  // we use the "access-control-request-headers" header
  // for a list to reflect.
  allowHeaders: string[] | "reflect";

  // access-control-max-age content
  maxAge: number;

  // access-control-allow-credentials
  allowCredentials(req: Request, ctx: Ctx): Promisable<boolean>;
};

const defaultOptions: CorsOptions = {
  allowOrigin: () => true,
  allowMethods: ["GET,HEAD,PUT,POST,DELETE,PATCH"],
  exposeHeaders: [],
  allowHeaders: "reflect",
  maxAge: 0,
  allowCredentials: () => false,
};

// handle cors, this is pretty much the koa implementation
export function cors<Ctx extends Context = Context>(
  opts: Partial<CorsOptions<Ctx>> = {},
): Middleware<Ctx> {
  const options = { ...defaultOptions, ...opts };
  const maxAge = options.maxAge && `${options.maxAge}`;
  const allowMethods = options.allowMethods.join(",");
  const exposeHeaders = options.exposeHeaders.join(",");
  const allowHeaders = Array.isArray(options.allowHeaders)
    ? options.allowHeaders.join(",")
    : true;

  return async ({ req, ctx, next }) => {
    const origin = req.get("origin");

    req.append("vary", "origin");

    if (!origin) return next();

    const [checkOrigin, allowCredentials] = await Promise.all([
      options.allowOrigin(req, ctx),
      options.allowCredentials(req, ctx),
    ]);
    const allowOrigin = checkOrigin === true ? origin : checkOrigin;

    if (req.method === "OPTIONS") {
      // preflight check.

      // If there is no Access-Control-Request-Method header or if parsing failed,
      // do not set any additional headers and terminate this set of steps.
      // The request is outside the scope of this specification.
      if (!req.get("access-control-request-method")) {
        // this not preflight request, ignore it
        return next();
      }

      req.set("access-control-allow-origin", allowOrigin);
      if (allowCredentials) {
        req.set("access-control-allow-credentials", "true");
      }
      if (maxAge) {
        req.set("access-control-max-age", maxAge);
      }
      if (allowMethods) {
        req.set("access-control-allow-methods", allowMethods);
      }
      if (allowHeaders) {
        const returnHeaders = allowHeaders === true
          ? req.get("access-control-request-headers")
          : allowHeaders;
        if (returnHeaders) {
          req.set("access-control-allow-headers", returnHeaders);
        }
      }
      return req.noContent();
    }
    // not a preflight.
    req.set("access-control-allow-origin", allowOrigin);
    if (allowCredentials) {
      req.set("access-control-allow-credentials", "true");
    }
    req.set("access-control-expose-headers", exposeHeaders);
    return next();
  };
}
