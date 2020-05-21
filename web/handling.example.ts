import { web, Middleware } from "./mod.ts";
import { create } from "../context/mod.ts";

const parent = create();
const app = web(parent);

let indent = 0;

const m = (id: any): Middleware => {
  const space = "|".repeat(indent++);
  return async ({ next }) => {
    console.log(space, "middleware", id, "before");
    await next();
    console.log(space, "middleware", id, "after");
  };
};

app.use(m("first"));

app.use(m("second, first in a stack"), async (h) => {
  // we should skip middleware 3
  console.log("to skip a middleware we have to embed it");
  if (Math.random() < 0.5) {
    console.log("calling the skippable");
    await skippable(h);
  } else {
    console.log("NOT calling the skippable");
    await h.next();
  }
});

const skippable = m("randomly skipped");

app.use(m("third middleware"));

app.use(m("final stack"), (h) => {
  console.log("final stack, final middleware, no `next` call");
  h.req.ok("boom");
});

await app.listen(":3000");
