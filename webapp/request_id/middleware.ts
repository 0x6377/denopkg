import { getterSetter } from "../../context/mod.ts";
import { Middleware } from "../mod.ts";

const [getRequestId, set] = getterSetter((ctx) => ctx.id);

export { getRequestId };

export const requestId: (header?: string) => Middleware = (
  header: string | false = "x-request-id"
) => ({ req, ctx }) => {
  let id: string;
  if (!header) {
    id = ctx.id;
  } else {
    id = req.get(header) ?? ctx.id;
  }
  set(ctx, id);
};
