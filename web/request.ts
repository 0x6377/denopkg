import { ServerRequest, Status } from "https://deno.land/std/http/mod.ts";
import { JSONvalue } from "./json.ts";
import { WebOptions } from "./options.ts";

/**
 * i.e. the bit that happens immediately after
 * for await (const req of server) {
 *   const request = setupRequest(); // <-- this bit
 *   await app.dispatch(request); // <-- userland code
 *   sendResponse(request); // <-- probably this bit as well
 * }
 *
 * Deno server provides a "ServerRequest" and a "Response" object.
 *
 */
export type Response = {
  status: Status;
  headers: Headers;
  body: ResponseBody;
};

type ResponseBody = Uint8Array | string | Deno.Reader | JSONvalue | undefined;

export class Request {
  // this inbound Request
  #req: ServerRequest;
  #res: Response;
  #_url: URL | undefined;
  #_method: string | undefined;

  constructor(
    req: ServerRequest,
    res: Response,
    public readonly options: Readonly<WebOptions>
  ) {
    this.#req = req;
    this.#res = res;
  }

  public get(header: string): string | null {
    return this.#req.headers.get(header);
  }
  public set(header: string, value: string) {
    this.#res.headers.set(header, value);
  }
  public del(header: string) {
    this.#res.headers.delete(header);
  }

  public get method() {
    return this.#_method ?? (this.#_method = this.#req.method.toLowerCase());
  }

  public get URL() {
    // lazily build the full URL object
    return this.#_url ?? (this.#_url = this.createURL());
  }

  private createURL() {
    // #req.url is the pathname only.
    // we need to build the full URL.
    // so we need the host header,
    const host = this.get("host") ?? "0.0.0.0";
    const xfp = this.options.trustProxy ? this.get("x-forwarded-proto") : null;
    const proto = xfp && xfp.toLowerCase() === "https" ? "https" : "http";

    const constructed = `${proto}://${host}${this.#req.url}`;
    console.log(constructed);
    return new URL(constructed);
  }

  public get contentLength() {
    return this.#req.contentLength;
  }
  public get reader(): Deno.Reader {
    return this.#req.body;
  }

  public raw(): Promise<Uint8Array> {
    // 4Mb max body size
    return readBody(this.#req, 4 * 1024 * 1024);
  }

  // utf8 only!
  public async text(): Promise<string> {
    // read all raw into text-encoder and dump
    return new TextDecoder().decode(await this.raw());
  }

  public async json(): Promise<JSONvalue> {
    return JSON.parse(await this.text());
  }

  public noContent() {
    this.response(Status.NoContent);
  }
  public notFound() {
    this.response(Status.NotFound, "Not Found");
  }
  public ok(body: ResponseBody) {
    this.response(Status.OK, body);
  }

  public internalServerError(err: Error) {
    let text = "Internal Server Error";
    if (this.options.env === "development") {
      text += `\n\n${err.stack}`;
    }
    this.response(Status.InternalServerError, text);
  }

  public redirect(url: URL, { permanent = false }: { permanent?: boolean }) {
    this.set("location", url.toString());
    this.response(
      permanent ? Status.PermanentRedirect : Status.TemporaryRedirect,
      `Redirecting to: ${url}`
    );
  }

  public response(status: Status, body?: ResponseBody) {
    this.#res.body = body;
    this.#res.status = status;
  }
}

// we could make a free-pool of buffers of max-size
// and reset them after each request
async function readBody(
  req: ServerRequest,
  maxBodySize: number
): Promise<Uint8Array> {
  const bufSize = req.contentLength ?? maxBodySize;
  if (bufSize > maxBodySize) {
    throw new Error("body too big");
  }
  const buf = new Uint8Array(bufSize);
  let bufSlice = buf;
  let totRead = 0;
  while (true) {
    const nread = await req.body.read(bufSlice);
    if (nread === null) break;
    totRead += nread;
    if (totRead >= bufSize) break;
    bufSlice = bufSlice.subarray(nread);
  }
  return buf;
}
