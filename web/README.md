# web

A simple web framework similar to Koa in js land, but with native
support for my `context` object, allowing cancellation among other
things.

## usage

```ts
import { createApp } from "https://deno.0x6377.dev/web/mod.ts";

const app = createApp();

app.get("/foo/:bar", async (req, ctx, next }) => {
  console.log("params", req.params);
  console.log("URL", req.URL);
  console.log("content-type", req.get("content-type"));
  console.log("request-id", ctx.id);
  if(params.bar === "bar") {
    const res: Response = req.response;
    res.body = "bingo!";
  } else {
    await next();
    console.log("after `next()`");
  }
})


```
