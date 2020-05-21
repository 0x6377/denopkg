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
  - [ ] mount router at `/prefix`
- [ ] Graceful shutdown (stop listening, wait for inflight to complete)
- [ ] `x-real-ip`,`x-forwarded-for/proto` support
- [ ] signed cookie support
- [ ] full origin/host/protocol inference (`x-forwarded-host`)
- [ ] content-type /accept parsing
- [ ] blessed error library (?)
- [ ] body validation (?)
- [ ] status middleware
- [ ] `X-Clacks-Overhead` middleware
- [ ] Server header (default to Cern...)
- [ ] Websocket support (?)
- [ ] EventSource (SSE) support (?)
- [ ] See what `helmet` does for other frameworks
- [ ] rate-limiter middleware
- [ ] static file server middleware
- [ ] metrics export
  - [ ] statsd style (push)
  - [ ] prometheus style (pull)
