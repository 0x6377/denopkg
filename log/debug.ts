let allDisabled = false;
let allEnabled = false;

// initialise with the "complete" tags.
// we try/catch this
let initialised = false;
function initialiseEnv() {
  if (initialised) {
    return;
  }
  initialised = true;
  let env: string | undefined;
  try {
    env = Deno.env.get("LOG_DEBUG");
  } catch {
    // don't worry just turn everything off.
    allDisabled = true;
    return;
  }
  if (!env) {
    allDisabled = true;
    return;
  }
  const parts = env.split(",");
  if (parts.includes("*")) {
    // that's everything!
    allEnabled = true;
    return;
  }
  const prefix = new Set<string>();
  parts.forEach((tag) => {
    if (tag.endsWith("*")) {
      prefix.add(tag.slice(0, -1));
    } else {
      enabled.add(tag);
    }
  });
  prefixes.push(...prefix);
}

const prefixes = [] as string[];
const enabled = new Set<string>();

export function tagEnabled(tag: string): boolean {
  initialiseEnv();
  // check our cache first, and yes, I know
  // environment variables in a running process
  // _CAN_ change, but in practice they don't.

  // if all are disabled, this is easy
  if (allDisabled) {
    return false;
  }
  // if a total wildcard, easy too
  if (allEnabled) {
    return true;
  }
  // check the explicitly enabled
  if (enabled.has(tag)) {
    return true;
  }
  // finally, does the tag match any prefix?
  return prefixes.some((prefix) => tag.startsWith(prefix));
}
