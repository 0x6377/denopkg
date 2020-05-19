export enum Level {
  ALL = -Infinity,
  VERBOSE = 20,
  INFO = 30,
  WARN = 50,
  ERROR = 60,
  SILENT = 98,
  // NB Debug level is HIGHER than silent!
  DEBUG = 99,
}

const levelNames = {
  [Level.VERBOSE]: "verbose",
  [Level.INFO]: "info",
  [Level.DEBUG]: "debug",
  [Level.WARN]: "warn",
  [Level.ERROR]: "error",
} as const;

export type LevelNames = typeof levelNames[number];

export function getLevelName(level: Level): LevelNames {
  return levelNames[level];
}
