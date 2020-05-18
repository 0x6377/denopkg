import { Level } from "./levels.ts";

export type RecordMeta = { [k: string]: any };

export type LogRecord = Readonly<{
  level: Level;
  time: number;
  msg: string;
  meta: RecordMeta;
}>;

// Formats a log into bytes to be written
export type LogFormatter = (record: LogRecord) => Uint8Array;
