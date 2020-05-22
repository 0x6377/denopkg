// This is bascially https://github.com/helmetjs/helmet
// for `web`.

import { compose, Middleware } from "../mod.ts";
import { frameguard, FrameguardOptions } from "./frameguard.ts";
import {
  DnsPrefetchControlOptions,
  dnsPreftechControl,
} from "./dns_prefetch_control.ts";
import { noSniff } from "./no_sniff.ts";

export type HelmetOptions = {
  frameguard: boolean | FrameguardOptions;
  dnsPrefetchControl: boolean | Partial<DnsPrefetchControlOptions>;
  noSniff: boolean;
};

const defaultOptions: HelmetOptions = {
  frameguard: true,
  dnsPrefetchControl: true,
  noSniff: true,
};

export function helmet(opts: Partial<HelmetOptions> = {}) {
  const options = { ...defaultOptions, ...opts };

  // pick middlewares
  const stack: Middleware[] = [];

  // helper to add to our stack
  function configure<O>(x: boolean | O, m: (o?: O) => Middleware) {
    // disabled
    if (x === false) return;
    // default options
    if (x === true) return stack.push(m());
    // custom options
    stack.push(m(x));
  }

  configure(options.frameguard, frameguard);
  configure(options.dnsPrefetchControl, dnsPreftechControl);
  configure(options.noSniff, noSniff);

  // compose them all together
  return compose(...stack);
}
