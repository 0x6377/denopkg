import { red, bold, underline } from "./mod.ts";
import { setColorEnabled } from "./fn.ts";

const boldRed = red.with(bold);
const boldUnderline = underline.with(bold);
const boldRedUnderline = boldRed.with(underline);

function print() {
  console.log(
    `
${red("just red")}
${bold("just bold")}
${boldRed("and bold red")}
${boldUnderline("bold and underline")}
${boldRedUnderline("all of them")}
`
  );
}
console.log("Default color choice:");
print();

setColorEnabled(true);
console.log("Force Enabled Color:");
print();

setColorEnabled(false);
console.log("Force Disabled Color:");
print();

setColorEnabled("reset");
console.log("Reset to default Color:");
print();
