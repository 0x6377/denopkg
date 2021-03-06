import {
  serve,
  ServerRequest,
  Status,
  Response as StdResponse,
} from "https://deno.land/std/http/mod.ts";

import { WebOptions, defaultWebOptions } from "./options.ts";
import { Context, create } from "../context/mod.ts";
import { Middleware, composer, compose } from "./handling.ts";
import { Request, Response } from "./request.ts";
import { createTokenBucket } from "./tokens.ts";
import { globalDebug } from "../log/mod.ts";
import { WebHeaders } from "./headers.ts";

const debugRequest = globalDebug("webapp:req");

function webapp(options?: Partial<WebOptions>): WebApp<Context>;
function webapp<Ctx extends Context>(
  ctx: Ctx,
  options?: Partial<WebOptions>,
): WebApp<Ctx>;
function webapp<Ctx extends Context = Context>(
  ...args: any[]
): WebApp<Ctx> | WebApp<Context> {
  if (args.length <= 1) {
    return new WebApp<Context>(create(), args[0] ?? {});
  }
  return new WebApp<Ctx>(args[0], args[1] ?? {});
}
export { webapp };

class WebApp<Ctx extends Context> {
  #middlewares: Array<Middleware<Ctx>> = [];
  #ctx: Ctx;
  #options: Readonly<WebOptions>;
  #compose = composer();

  constructor(ctx: Ctx, options: Partial<WebOptions> = {}) {
    this.#ctx = ctx;
    this.#options = { ...defaultWebOptions, ...options };
  }

  use(middleware: Middleware<Ctx>, ...extra: Middleware<Ctx>[]) {
    this.#middlewares.push(compose(middleware, ...extra));
  }

  middleware(): Middleware<Ctx> {
    // use this whole app as a middleware for another app.
    return this.#compose(...(this.#middlewares as Middleware[]));
  }

  public get context() {
    return this.#ctx;
  }

  async listen(...args: Parameters<typeof serve>) {
    const s = serve(...args);
    this.#ctx.wait().then(() => {
      s.close();
    });

    // @todo: graceful server shutdown

    let tokens = this.#options.maxInflightRequests > 0
      ? createTokenBucket(this.#options.maxInflightRequests)
      : false;
    let inflight = 0;
    for await (const req of s) {
      const ctx = this.#ctx.child();
      debugRequest({ request: ctx.id }, "recieved: %s %s", req.method, req.url);
      // this is the right position to apply backpressure
      // if we want to limit the number of in-flight requests.
      const tok = tokens && (await tokens.get());
      inflight++;
      debugRequest({ request: ctx.id, inflight }, "starting handle cycle");
      this.handle(ctx, req).finally(async () => {
        // make sure to return the token!
        inflight--;
        debugRequest({ request: ctx.id, inflight }, "handle cycle complete");
        tok && tok.return();
        await ctx.done();
      });
    }
  }

  private async handle(ctx: Ctx, r: ServerRequest) {
    // configuratble deadline?
    // lets take the cancel in the case the client
    // disconnects.
    const res: Response = {
      status: Status.NotFound,
      headers: new WebHeaders({
        // something nice and old-school, straight out of RFC2616
        server: "CERN/3.0 libwww/2.17",
      }),
      body: "Not Found",
    };
    // In memorium (https://xclacksoverhead.org/home/about)
    maybeSet(
      res.headers,
      !this.#options.noClacksOverhead,
      "x-clacks-overhead",
      "GNU Terry Pratchett",
    );
    // DMX FTW!
    maybeSet(
      res.headers,
      !this.#options.xNotGonGiveItToYa,
      "x-gon-give-it-to",
      "ya",
    );
    maybeSet(
      res.headers,
      this.#options.xPoweredBy,
      "x-powered-by",
      this.#options.xPoweredBy || "",
    );

    const req = new Request(r, res, this.#options);
    const composed = this.middleware();
    try {
      debugRequest({ request: ctx.id }, "before middleware");
      await composed({ req, ctx, next: async () => {} });
      debugRequest({ request: ctx.id }, "after middleware");
    } catch (error) {
      // error!
      debugRequest(
        { request: ctx.id, error },
        "middleware error: %s",
        error.message,
      );
      req.internalServerError(error);
    }
    try {
      debugRequest({ request: ctx.id }, "sending response %d", res.status);
      await r.respond(toStdResponse(res));
      debugRequest({ request: ctx.id }, "sent response");
    } catch (error) {
      debugRequest(
        { request: ctx.id, error },
        "error sending response: %s",
        error.message,
      );
      this.#options.errorHandler(error);
    }
  }
}

function maybeSet(
  headers: Headers,
  condition: any,
  header: string,
  value: string,
) {
  if (condition) {
    headers.set(header, value);
  }
}

function toStdResponse(r: Response): StdResponse {
  // only the body is "wrong"
  // stdreponse has undefined | Uint8Array | Reader | string
  const ok = r.body === undefined ||
    r.body instanceof Uint8Array ||
    typeof (r.body as any)?.read === "function" || // Deno.Reader
    typeof r.body === "string";

  if (!ok) {
    // otherwise we need to JSON.stringify the body (and set the content-type)
    if (!r.headers.has("content-type")) {
      r.headers.set("content-type", "application/json");
    }
    r.body = JSON.stringify(r.body);
  }
  return r as StdResponse;
}
