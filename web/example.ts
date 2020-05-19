import { web } from "./handling.ts";
import { create } from "../context/mod.ts";

const parent = create();
const app = web(parent);

// run the app for only 10 seconds.
parent.setDeadline(10_000);

app.use(({ req, ctx }) => {
  req.ok({ id: ctx.id });
});

await app.listen(":3000");
