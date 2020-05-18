export enum Level {
  ALL = 0,
  TRACE = 10,
  VERBOSE = 20,
  INFO = 30,
  DEBUG = 40,
  WARN = 50,
  ERROR = 60,
  SILENT = Infinity,
}

const levelNames = {
  [Level.TRACE]: "trace",
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
