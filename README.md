# Deno Packages

Probably all served from a root at https://deno.0x6377.dev/

## development

In order to develop these, sometimes you need to cross-reference them.
This works nicely in a monorepo environment with a constant import map.

```sh
$ echo "{\"imports\":{\"https://deno.0x6377.dev/\":\"$(pwd)\"}}" > importmap.json
```

Then you can run deno with the `--importmap` argument:

```sh
$ deno run --importmap importmap.json log/example.ts
```

This allows you to use the local versions of all the 0x6377 modules.
