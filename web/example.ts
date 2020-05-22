import { web } from "./mod.ts";

const app = web();

// run the app for only 10 seconds.
//app.context.setDeadline(10_000);

app.use(({ req, ctx }) => {
  req.ok({ id: ctx.id });
});

await app.listen(":3000");
