import { Middleware } from "../handling.ts";
import { Context } from "../../context/mod.ts";
import { Status } from "../mod.ts";
import { JSONany } from "../json.ts";

type Promisable<T> = Promise<T> | T;

type HealthChecker<T, Ctx extends Context> = (
  ctx: Ctx
) => Promisable<HealthCheckResult<T>>;

export type HealthCheckResult<T extends JSONany> = {
  ok: boolean;
  status: T;
};

export type HealthCheckOptions = {
  // if this <= 0: we run on demand (as called)
  // if this > 0: we run the check on a schedule
  // (ie. every X milliseconds) and cache the result.
  // Useful if the check itself takes time, or you
  // wish to alert seperately.
  // default = 0;
  runFrequency: number;

  // the URL path of the status endpoint
  // set to falsey to disable the endpoint
  // default: "/.well-known/web/status"
  statusEndpoint: string | false;

  // the URL path of the uptime endpoint
  // this doesn't run the full check, but
  // simply returns OK if the server is running.
  // This is good for load-balancers
  // set to falsey to disable the endpoint
  // default "/_ping";
  pingEndpoint: string | false;
};

const defaultOptions: HealthCheckOptions = {
  runFrequency: 0,
  statusEndpoint: "/.well-known/web/status",
  pingEndpoint: "/_ping",
};

export function healthcheckMiddleware<T extends JSONany, Ctx extends Context>(
  parent: Ctx, // so we can watch for shutdown
  checker: HealthChecker<T, Ctx>,
  opts: Partial<HealthCheckOptions> = {}
): Middleware<Ctx> {
  const options = Object.assign({}, defaultOptions, opts);
  const getHealthCheck: typeof checker =
    options.runFrequency > 0
      ? periodicChecker(parent, options.runFrequency, checker)
      : checker;
  return async ({ req, next, ctx }) => {
    if (options.statusEndpoint && req.URL.pathname === options.statusEndpoint) {
      // this function _should_ not fail, it should always catch and return
      // a _bad_ status
      const status = await getHealthCheck(ctx);
      return req.response(
        status.ok ? Status.OK : Status.ServiceUnavailable,
        status
      );
    }
  };
}

function periodicChecker<T extends JSONany, Ctx extends Context>(
  parent: Ctx,
  periodMs: number,
  checker: HealthChecker<T, Ctx>
): HealthChecker<T, Ctx> {
  let shutdown = false;
  let status: Promisable<HealthCheckResult<T>> = checker(parent);
  async function coroutine() {
    while (true) {
      await pause(periodMs);
      if (shutdown) return;
      // check should _not_ reject
      const next = await checker(parent);
      // we wait for the promise to resolve before switching
      status = next;
      if (shutdown) return;
    }
  }
  // start that routine
  coroutine();
  // always return the current status or pending promise
  return () => status;
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
