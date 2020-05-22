export type WebOptions = {
  // max size of request body to read.
  maxBodySize: number;

  // should we trast XFF XFP headers?
  trustProxy: boolean;

  // environment, development or production
  // controls a few things, but most importantly
  // the hiding of stack traces on errors.
  env: "development" | "production";

  // change or disable the x-powered-by header
  xPoweredBy: string | false;

  // the error handler used to report errors, either in handlers
  // or that we could not write to the response
  errorHandler: (e: Error) => void;

  // This is a handle to add debug logging if you want it.
  debug: (...args: any[]) => void;

  // Disable the X-Clacks-Overhead header
  noClacksOverhead?: boolean;

  // Disable the DMX header
  xNotGonGiveItToYa?: boolean;

  // max inflight requests. If this value > 0 then
  // we ensure that the server is only handling this
  // many requests concurrently.
  // defaults to: 0 (unlimited)
  maxInflightRequests: number;

  // where to look for proxy ip headers.
  proxyIpHeader: string;
  // where to look for proxy proto
  proxyProtoHeader: string;
  proxyHostHeader: string;
};

export const defaultWebOptions: WebOptions = {
  maxBodySize: 4 * 1024 * 1024,
  maxInflightRequests: 0,
  trustProxy: false,
  xPoweredBy: "0x6377",
  proxyIpHeader: "x-forwarded-for",
  proxyProtoHeader: "x-forwarded-proto",
  proxyHostHeader: "x-forwarded-host",
  env: "development",
  errorHandler: console.error,
  debug: () => {},
};
