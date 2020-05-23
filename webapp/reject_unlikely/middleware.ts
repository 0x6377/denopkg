import { Middleware, Status } from "../mod.ts";

// this is a middleware to handle unusual HTTP methods.

// these are the method we recognize
const knownMethods = [
  "OPTIONS",
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "DELETE",
  "TRACE",
  "CONNECT",
  "PATCH",
] as const;

type KnownMethod = typeof knownMethods[number];

export type UnlikelyOptions = {
  // reject methods not in the major RFCs.
  // those are listed above
  // default: true
  rejectUnknown: boolean;

  // should we reject TRACE requests?
  // (answer: we should)
  // default: true
  rejectTrace: boolean;

  // should we reject CONNECT requests?
  // (answer: probably)
  // default: true
  rejectConnect: boolean;
};

const defaultOptions: UnlikelyOptions = {
  rejectUnknown: true,
  rejectTrace: true,
  rejectConnect: true,
};

export function rejectUnlikelyMethods(
  opts: Partial<UnlikelyOptions> = {},
): Middleware {
  const options = { ...defaultOptions, ...opts };
  return ({ req, next }) => {
    switch (req.method as KnownMethod) {
      case "CONNECT":
        if (options.rejectConnect) {
          return req.response(Status.NotImplemented);
        }
        break;
      case "TRACE":
        if (options.rejectTrace) {
          return req.response(Status.NotImplemented);
        }
        break;
      default:
        if (
          options.rejectUnknown &&
          !knownMethods.includes(req.method as any)
        ) {
          return req.response(Status.NotImplemented);
        }
        break;
    }
    // if we got to here we are good to go.
    return next();
  };
}
