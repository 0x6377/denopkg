import { mount } from "./middleware.ts";
import { web, Middleware } from "../mod.ts";

const app = web();

const m: Middleware = ({ req, next, ctx }) => {
  console.log({
    URL: req.URL.href,
    originalURL: req.originalURL.href,
    id: ctx.id,
  });
  return next();
};

app.use(m);
app.use(mount("/foo", m));
app.use(m);

app.listen(":8080");
