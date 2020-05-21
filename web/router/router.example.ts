import { web } from "../mod.ts";
import { create } from "../../context/mod.ts";
import { getRouteParams, createRouter } from "./middleware.ts";

const parent = create();
const app = web(parent);
const router = createRouter();

router.get("/foo/:bar", ({ req, ctx }) => {
  const { bar } = getRouteParams(ctx);
  req.ok({ bar });
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

app.listen(":3001");
