# web

A simple web framework similar to Koa in js land, but with native
support for my `context` object, allowing cancellation among other
things.

## roadmap

This is in very early stages, so the `example.ts` files and the types
are probably the best place other than the code itself to see how it
works.

These are the "features" I plan:

- [x] request/response cycle
- [x] async request middleware
- [x] blessed middleware composition
- [-] inbuild body parsing
  - [ ] deflate/gzip/etc.. support
  - [x] raw / text / json decoding
- [x] blessed middleware for routing
  - [x] path_to_regexp routing params
- [x] mount middleware at `/prefix`
- [ ] Graceful shutdown (stop listening, wait for inflight to complete)
- [x] `x-real-ip`,`x-forwarded-for` support
- [ ] signed cookie support
- [x] full origin/host/protocol inference (`x-forwarded-host`)
- [ ] content-type / accept parsing
- [ ] server timing support
- [ ] blessed error library (? I like `@hapi/boom`)
- [ ] body validation (?)
- [x] status middleware
- [x] `X-Clacks-Overhead` ~middleware~ native!
- [x] Server header (default to Cern...)
- [ ] Websocket support (?)
- [ ] EventSource (SSE) support (?)
- [ ] See what `helmet` does for other frameworks
- [ ] rate-limiter middleware
- [ ] static file server middleware (deno has a stdlib here, but it's not directly usable)
- [ ] metrics export (middleware?)
  - [ ] statsd style (push)
  - [ ] prometheus style (pull)

## documentation

I need another list for the completion of documentation for these modules.

Of course, I'll let myself off for the moment, as pretty much all of the APIs are in flux...

## thoughts

can I extend the middleware as a promise API to include middleware as
generators / async generators? Is there any benefit? What could I achieve with it that I couldn't with plain async functions?
(I'm thinking about crankshaft here.)
