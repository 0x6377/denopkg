# mount middleware

This allows you to "mount" another middleware at a specific point in
your application, routing all calls to the path prefix to the middleware.

In order to make it transparent to the middleware we re-write the
pathname of the URL. This means that nested mounts and routers work
as expected. However it does mean that the path in `req.URL` is not
always accurate. If you need to access the "original" url, there is
a property on the request `req.originalURL` which is readonly, and
therefore guarranteed to represent the original inbound request. Be
careful to use the correct one for the correct case.

i.e. the modified URL should be used for routing decisions, but the
originalURL for logging or creating relative URLs.

## usage

```ts
const m = someMiddleware();

app.use(mount("/some-path", m));
```
