import { deferred } from "https://deno.land/std/async/mod.ts";

export type ServerTimingMetric = {
  // metric name, required
  metric: string;
  durationMs?: number;
};

export class ServerTiming {
  #metrics: ServerTimingMetric[] = [];
  #pending: Promise<unknown>[] = [];

  public log(metric: string) {
    this.#metrics.push({ metric });
  }

  public time(metric: string) {
    const pending = deferred();
    this.#pending.push(pending);
    const start = Date.now();
    let done = false;
    return () => {
      if (done) return;
      done = true;
      this.#metrics.push({ metric, durationMs: Date.now() - start });
      this.#pending.splice(this.#pending.indexOf(pending), 1);
      pending.resolve();
    };
  }

  public setHeaders(headers: Headers) {
    this.writeToHeaders(headers);
    if (this.#pending.length) {
      headers.append("trailers", "server-timing");
    }
  }

  public setTrailers(headers: Headers) {
    if (this.#pending.length) {
      throw new Error("pending server timings are not yet resolved");
    }
    this.writeToHeaders(headers);
  }

  private writeToHeaders(headers: Headers) {
    const metrics = this.#metrics.slice();
    this.#metrics.length = 0;
    metrics.forEach(({ metric, durationMs }) => {
      let dur = durationMs === undefined
        ? ""
        : `;dur=${(durationMs / 1000).toFixed(3).replace(/.?0+$/, "")}`;
      headers.append("server-timing", `${metric}${dur}`);
    });
  }
}
