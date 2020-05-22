import { Middleware } from "../mod.ts";

// @see: https://github.com/helmetjs/frameguard

export type FrameguardOptions =
  | {
      action: "DENY" | "SAMEORIGIN";
    }
  | {
      action: "ALLOW-FROM";
      domain: string;
    };

const defaultOptions = {
  action: "SAMEORIGIN",
} as const;

export function frameguard(
  opts: FrameguardOptions = defaultOptions
): Middleware {
  if (opts.action === "ALLOW-FROM" && !opts.domain) {
    throw new Error("Domain parameter must not be empty when using ALLOW-FROM");
  }
  const value =
    opts.action === "ALLOW-FROM"
      ? `${opts.action} ${opts.domain}`
      : opts.action;
  return ({ req, next }) => {
    req.set("x-frame-options", value);
  };
}
