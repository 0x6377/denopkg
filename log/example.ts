import { create, Level } from "./mod.ts";
import { textFormatter, TimeStyle } from "./fmt/text.ts";
//import { jsonFormatter } from "./fmt/json.ts";
import { LevelNames } from "./levels.ts";

const log = create(
  {
    level: Level.ALL,
    formatter: textFormatter({
      time: TimeStyle.Kitchen,
    }),
    //formatter: jsonFormatter({ style: "default" }),
  },
  {
    host: "localhost",
  },
);

log.info({ version: Deno.version });

function logTest(level: LevelNames) {
  log[level](
    { level, priority: level[(level.toUpperCase() as unknown) as Level] },
    "this is the '%s' level.",
    level,
  );
}

logTest("verbose");
logTest("info");
logTest("warn");
logTest("error");
logTest("debug");

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

// an ENV based log.
const debug = log.debuglog("test:log");

debug(
  { only: "with env" },
  "Only logged when LOG_DEBUG=test:log or LOG_DEBUG=*, etc...",
);

await log.flush();
