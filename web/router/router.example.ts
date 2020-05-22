import { web } from "../mod.ts";
import { getRouteParams, createRouter } from "./middleware.ts";

const app = web({
  maxInflightRequests: 3,
});
const router = createRouter();

router.get("/foo/:bar", ({ req, ctx }) => {
  const { bar } = getRouteParams(ctx);
  req.ok({ bar });
  // add a test delay
  return new Promise((r) => setTimeout(r, 5000));
});

router.post("/bar/:foo", ({ req, ctx }) => {
  const { foo } = getRouteParams(ctx);
  req.ok({ foo });
});

router.put("/quux/:secret", ({ ctx, req, next }) => {
  const { secret } = getRouteParams(ctx);
  if (secret !== "supersecretpassword") {
    req.response(403, { uh: "uh uh" });
    return next();
  } else {
    req.ok({ access: "granted!" });
  }
});

app.use(router);

app.listen(":6377");
