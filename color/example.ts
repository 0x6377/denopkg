import { red, bold, underline } from "./mod.ts";

const boldRed = red.with(bold);
const boldUnderline = underline.with(bold);
const boldRedUnderline = boldRed.with(underline);

console.log(
  `${red("just red")}
${bold("just bold")}
${boldRed("and bold red")}
${boldUnderline("bold and underline")}
${boldRedUnderline("all of them")}`
);
