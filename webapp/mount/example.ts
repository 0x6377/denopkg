import { mount } from "./middleware.ts";
import { webapp, Middleware } from "../mod.ts";

const app = webapp();

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

app.listen(":6377");
