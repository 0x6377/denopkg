import {
  serve,
  ServerRequest,
  Status,
  Response as StdResponse,
} from "https://deno.land/std/http/mod.ts";
import { Context } from "../context/mod.ts";

import { Request, Response } from "./request.ts";
import { WebOptions, defaultWebOptions } from "./options.ts";

export type Handle<Ctx extends Context> = {
  req: Request;
  next: () => Promise<unknown>;
  ctx: Ctx;
};

export type Middleware<Ctx extends Context = Context> = (h: Handle<Ctx>) => any;

export function web<Ctx extends Context>(
  ctx: Ctx,
  options?: Partial<WebOptions>
): Web<Ctx> {
  return new Web(ctx, options);
}

class Web<Ctx extends Context> {
  #middleware: Array<Middleware<Ctx>> = [];
  #ctx: Ctx;
  #options: Readonly<WebOptions>;

  constructor(ctx: Ctx, options: Partial<WebOptions> = {}) {
    this.#ctx = ctx;
    this.#options = Object.assign({}, defaultWebOptions, options);
  }

  use(middleware: Middleware<Ctx>) {
    this.#middleware.push(middleware);
  }

  async listen(...args: Parameters<typeof serve>) {
    const s = serve(...args);
    this.#ctx.wait().then(() => {
      s.close();
    });
    for await (const req of s) {
      // this must be non-blocking,
      // although this is the right position to apply backpressure
      // if we want to limit the number of in-flight requests.
      this.handle(req);
    }
  }

  private async handle(r: ServerRequest) {
    const ctx = this.#ctx.child();
    // configuratble deadline?
    // lets take the cancel in the case the client
    // disconnects.
    const res: Response = {
      status: Status.NotFound,
      headers: new Headers(),
      body: "Not Found",
    };
    const req = new Request(r, res, this.#options);

    const runMiddleware = async (index: number) => {
      const m = this.#middleware[index];
      if (!m) {
        return;
      }
      let nextCalled = false;
      let nextPromise: Promise<any> = Promise.resolve();
      const next = () => {
        if (nextCalled) {
          throw new Error(
            "`next` function called twice from the same middleware"
          );
        }
        nextCalled = true;
        // move on to the next middleware. before we return.
        nextPromise = runMiddleware(index + 1);
        return nextPromise;
      };
      const midPromise = m({ req, next, ctx });
      // wait until BOTH next and current have resolved.
      await Promise.all([nextPromise, midPromise]);
    };
    try {
      await runMiddleware(0);
    } catch (e) {
      // error!
      req.internalServerError(e);
    }
    try {
      await r.respond(toStdResponse(res));
    } catch (e) {
      this.#options.errorHandler(e);
    }
    await ctx.done();
  }
}

function toStdResponse(r: Response): StdResponse {
  // only the body is "wrong"
  // stdreponse has undefined | Uint8Array | Reader | string
  const ok =
    r.body === undefined ||
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
