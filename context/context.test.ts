import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { create, DoneReason } from "./context.ts";

Deno.test("it should clean up", async () => {
  const ctx = create();
  const child = ctx.child();
  //child.setDeadline(50);
  const cancel = ctx.cancellation();
  ctx.setDeadline(50);
  cancel();
  await ctx.done();
  const childReason = await child.wait();
  const parentReason = await ctx.wait();
  // the cancel should be the reason
  assertEquals(parentReason, DoneReason.Cancelled);
  assertEquals(childReason, DoneReason.ParentDone);
});
