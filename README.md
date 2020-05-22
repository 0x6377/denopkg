# Deno Packages

All served from a root at https://deno.0x6377.dev/

These are a mix of mainly web server based pieces. Because I like to
write that sort of thing.

Pretty much all of them are heavily inspired by packages I know and love,
particularly: Koa for the `web` one, pino for the `log` one, chalk for the `colors`
one (although it is much less complete than that). The `context` one is more or
less my own and although it has some ideas from the Golang `context` package, the
API bears no resemblance at all.

Of all of them the `context` package is the one I like the best, and will always
reach for it for _any_ non-trivial application, and most trivial ones.

## development

In order to develop these, sometimes you need to cross-reference them.
This works nicely in a monorepo environment without an import map as
I can use relative paths. As they will be served with the same capability, it really doesn't matter.

As for PRs and contributions, I doubt there will be enough interest... but I don't expect anything, nor will I likely merge anything, certainly not for the time being. I quite like it all being mine. I may take your ideas if you give them however...
