// this is a fixed size token bucket.
// we grant tokens and then when returned we pass them on
// it is an async "max inflight" limiter.

import { Deferred, deferred } from "https://deno.land/std/async/mod.ts";

type Token = { return(): void };

type TokenBucket = {
  get(): Promise<Token>;
};

export function createTokenBucket(size: number): TokenBucket {
  let count = 0;
  const waiting: Array<Deferred<Token>> = [];
  const token = () => {
    let returned = false;
    return {
      return() {
        if (returned) {
          throw new Error("Cannot double return a token!");
        }
        returned = true;
        const next = waiting.shift();
        if (next) {
          next.resolve(token());
        } else {
          count--;
        }
      },
    };
  };
  return {
    async get() {
      if (count < size) {
        count++;
        return token();
      }
      // we need to wait
      const pending = deferred<Token>();
      waiting.push(pending);
      return pending;
    },
  };
}
