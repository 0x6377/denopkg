import { create, Level } from "https://deno.0x6377.dev/log/mod.ts";
import {
  textFormatter,
  TimeStyle,
} from "https://deno.0x6377.dev/log/fmt/text.ts";
import { LevelNames } from "./levels.ts";

const log = create(
  {
    level: Level.ALL,
    formatter: textFormatter({
      time: TimeStyle.Kitchen,
    }),
  },
  {
    host: "localhost",
  }
);

log.info({ version: Deno.version });

function logTest(level: LevelNames) {
  log[level](
    { level, priority: level[(level.toUpperCase() as unknown) as Level] },
    "this is the '%s' level.",
    level
  );
}

logTest("trace");
logTest("verbose");
logTest("info");
logTest("debug");
logTest("warn");
logTest("error");

const child = log.child({ child: 1 });
child.debug("child at debug level at: %v", new Date().toISOString());

// bind after child should not inherit
log.bind({ bound: true });
log.warn("At level: %s", "warn");

child.debug("child should not have prop 'bound'");

// a new child should.
log.child({ child: 2 }).error("This would be bad if it didn't have 'bound'");

log.verbose(`this text
is over a few lines
and so has line
breaks in it
which should be handled nicely..
`);

await log.flush();
