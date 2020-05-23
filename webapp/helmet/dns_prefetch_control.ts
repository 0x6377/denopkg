import { Middleware } from "../mod.ts";

// @see: https://github.com/helmetjs/dns-prefetch-control

export type DnsPrefetchControlOptions = {
  allow: boolean;
};

const defaultOptions = { allow: true };

export function dnsPreftechControl(
  opts: Partial<DnsPrefetchControlOptions> = {},
): Middleware {
  const options = { ...defaultOptions, ...opts };
  const value = options.allow ? "on" : "off";
  return ({ req, next }) => {
    req.set("x-dns-prefetch-control", value);
    return next();
  };
}
