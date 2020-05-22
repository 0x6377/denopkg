import { ServerRequest, Status } from "https://deno.land/std/http/mod.ts";
import { TopLevelJSONable } from "./json.ts";
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

type ResponseBody =
  | Uint8Array
  | string
  | Deno.Reader
  | TopLevelJSONable
  | undefined;

export class Request {
  // this inbound Request
  #req: ServerRequest;
  #res: Response;
  #_ip: string | undefined;
  #_url: URL | undefined;
  #_originalURL: Readonly<URL> | undefined;
  #_method: string | undefined;

  constructor(
    req: ServerRequest,
    res: Response,
    public readonly options: Readonly<WebOptions>
  ) {
    this.#req = req;
    this.#res = res;
    console.log(this.#req);
  }

  public get(header: string): string | null {
    return this.#req.headers.get(header);
  }
  public set(header: string, value: string) {
    this.#res.headers.set(header, value);
  }
  public append(header: string, value: string) {
    this.#res.headers.append(header, value);
  }
  public delete(header: string) {
    this.#res.headers.delete(header);
  }

  public get method() {
    return this.#_method ?? (this.#_method = this.#req.method.toUpperCase());
  }

  // this is whatever was sent in the request. verbatim.
  public get URI(): string {
    return this.#req.url;
  }

  // This is the full URL of the request. constructed from the available data.
  // It tries to be as precise to what a user would have in the address bar
  // as possible.
  // it may not work when the requests are more unusual, such as a
  // CONNECT request which will likely only have an AUTHORITY.
  // TBH a server like this should probably not be handling
  // CONNECT requests.
  // `OPTIONS *` requests will have `/*` in the pathname.
  public get URL() {
    // lazily build the full URL object
    this.#_url ?? this.createURLs();
    return this.#_url!;
  }

  public get originalURL() {
    this.#_originalURL ?? this.createURLs();
    return this.#_originalURL!;
  }

  private createURLs() {
    // #req.url is the pathname only.
    // we need to build the full URL.
    // so we need the host header,
    // if trust proxy, try the x-forwarded-host
    let host =
      this.options.trustProxy && this.get(this.options.proxyHostHeader);
    host = host || this.get("host") || "unknown";
    const xfp = this.options.trustProxy
      ? this.get(this.options.proxyProtoHeader)
      : null;
    const proto = (xfp && xfp.split(/\s*,\s*/, 1)[0]) || "http";
    // RFC 7230, section 5.3: Must treat
    //    GET /index.html HTTP/1.1
    //    Host: www.google.com
    // and
    //    GET http://www.google.com/index.html HTTP/1.1
    //    Host: doesntmatter
    // the same. In the second case, any Host line is ignored.

    // Also in a CONNECT call we should get an authority
    // which is just host and port.

    let parseable = this.#req.url;
    if (/https?:\/\/.+/.test(this.#req.url)) {
      // probably a full URL.
      // no change.
    } else if (/^[^\/]+:\d+$/.test(this.#req.url)) {
      // probably just the authority
      parseable = `http://${parseable}`;
    } else {
      // it's just the path.
      if (parseable[0] === "/") {
        parseable = `http://host${parseable}`;
      } else {
        parseable = `http://host/${parseable}`;
      }
    }
    const url = new URL(parseable);
    url.protocol = proto;
    url.host = host;
    this.#_originalURL = new URL(url);
    this.#_url = new URL(url);
  }

  public get ip(): string {
    return this.#_ip ?? (this.#_ip = this.getIP());
  }

  private getIP(): string {
    let ip: string = "";
    if (this.options.trustProxy) {
      ip = (this.get(this.options.proxyIpHeader) ?? "").split(/\s*,\s*/, 1)[0];
    }
    if (!ip) {
      const addr = this.#req.conn.remoteAddr;
      ip = "hostname" in addr ? addr.hostname : "";
    }
    return ip;
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

  public async json(): Promise<TopLevelJSONable> {
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
