export type WebOptions = {
  // max size of request body to read.
  maxBodySize: number;

  // should we trast XFF XFP headers?
  trustProxy: boolean;

  // environment, development or production
  // controls a few things, but most importantly
  // the hiding of stack traces on errors.
  env: "development" | "production";

  // the error handler used to report errors, either in handlers
  // or that we could not write to the response
  errorHandler: (e: Error) => void;
};

export const defaultWebOptions: WebOptions = {
  maxBodySize: 4 * 1024 * 1024,
  trustProxy: false,
  env: "development",
  errorHandler: console.error,
};
