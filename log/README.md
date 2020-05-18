# log module

Deno has a `std/log` module, but it's not quite how I like it.

This logger fits in with my sensibilities better; explicitly:

- All logs must be written to a `Deno.Writer` interface, I agree with `pino` in that
  logs should be written to sdout, and shipped by a sidecar. I almost hard-coded `Deno.stdout`
  but some level of flexibility should be possible. In theory one could write some sort
  of HTTP transport (don't!) or add multiple handler support (less bad).
- There is no `getLogger` function. I personally do not like global loggers, if you
  want one, then create a singleton in a file and import from there. I prefer the _context_
  approach where the logger is attached to a context that has some request lifecycle
  significance. This allow one to easily create child loggers for each context and add
  unique ids for each flow.
- Because I basically always want a child logger, the interface is designed around shared
  log meta-data.

### Usage

```ts
import { create, Level } from "https://deno.0x6377.dev/log/mod.ts";
import { jsonFormatter } from "https://deno.0x6377.dev/log/fmt/json.ts";
import { textFormatter } from "https://deno.0x6377.dev/log/fmt/text.ts";

const log = create({
  level: Level.VERBOSE,
  formatter: Deno.isatty(Deno.stderr)
    ? textFormatter()
    : jsonFormatter()
  sink: Deno.stderr
}, {
  host: Deno.hostname()
});

log.verbose({ count: 10 }, "Lo, a group of walrus approaches")
log.info("Actually, it was %d walrus.", 10);


// if you need to do anything to clean up after all logs have finish
await log.flush();
```
