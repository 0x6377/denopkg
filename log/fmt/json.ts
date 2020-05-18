import { LogFormatter } from "../fmt.ts";
import { getLevelName } from "../levels.ts";

/**
 * JSON Lines Formatter: Output for machines
 *
 * @TODO safe serialisation (i.e. no cycles)
 * @TODO pino/graylog format addapters
 */
export const jsonFormatter: () => LogFormatter = () => {
  const encoder = new TextEncoder();
  return ({ level, time, meta, msg }) => {
    return encoder.encode(JSON.stringify({ level, time, msg, meta }) + "\n");
  };
};
