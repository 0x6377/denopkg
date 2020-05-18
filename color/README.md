# colors

Again `deno/std` has some colors, but I didn't like them. I wanted
to be able to chain them. Like this:

```ts
import { red, bold, underline } from "https://deno.0x6377.dev/color/mod.ts";

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
```
