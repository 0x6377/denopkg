// the data, "codes" are from:
// https://github.com/chalk/ansi-styles/blob/cbc3de8b0d9822f3a9e2cebe154502d071fc13b1/index.js
import { ColorFn, createStyle } from "./fn.ts";
export { ColorFn };

// modifiers
export const reset = createStyle(0, 0);
// 21 isn't widely supported and 22 does the same thing
export const bold = createStyle(1, 22);
export const dim = createStyle(2, 22);
export const italic = createStyle(3, 23);
export const underline = createStyle(4, 24);
export const inverse = createStyle(7, 27);
export const hidden = createStyle(8, 28);
export const strikethrough = createStyle(9, 29);

// colors
export const black = createStyle(30, 39);
export const red = createStyle(31, 39);
export const green = createStyle(32, 39);
export const yellow = createStyle(33, 39);
export const blue = createStyle(34, 39);
export const magenta = createStyle(35, 39);
export const cyan = createStyle(36, 39);
export const white = createStyle(37, 39);

// Bright color
export const blackBright = createStyle(90, 39);
export const gray = createStyle(90, 39);
export const grey = createStyle(90, 39);
export const redBright = createStyle(91, 39);
export const greenBright = createStyle(92, 39);
export const yellowBright = createStyle(93, 39);
export const blueBright = createStyle(94, 39);
export const magentaBright = createStyle(95, 39);
export const cyanBright = createStyle(96, 39);
export const whiteBright = createStyle(97, 39);

// backgrounds
export const bgBlack = createStyle(40, 49);
export const bgRed = createStyle(41, 49);
export const bgGreen = createStyle(42, 49);
export const bgYellow = createStyle(43, 49);
export const bgBlue = createStyle(44, 49);
export const bgMagenta = createStyle(45, 49);
export const bgCyan = createStyle(46, 49);
export const bgWhite = createStyle(47, 49);

// Bright backgrounds
export const bgBlackBright = createStyle(100, 49);
export const bgGray = createStyle(100, 49);
export const bgGrey = createStyle(100, 49);
export const bgRedBright = createStyle(101, 49);
export const bgGreenBright = createStyle(102, 49);
export const bgYellowBright = createStyle(103, 49);
export const bgBlueBright = createStyle(104, 49);
export const bgMagentaBright = createStyle(105, 49);
export const bgCyanBright = createStyle(106, 49);
export const bgWhiteBright = createStyle(107, 49);
