import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { create, DoneReason } from "./context.ts";

Deno.test("it should clean up", async () => {
  const ctx = create();
  const child = ctx.child();
  await ctx.done();
  const childReason = await child.wait();
  const parentReason = await ctx.wait();
  // the cancel should be the reason
  assertEquals(parentReason, DoneReason.Shutdown);
  assertEquals(childReason, DoneReason.ParentDone);
});

Deno.test("cancellation", async () => {
  const ctx = create();
  const cancel = ctx.cancellation();
  setTimeout(cancel, 0);
  assertEquals(await ctx.wait(), DoneReason.Cancelled);
});

Deno.test("deadline", async () => {
  const ctx = create();
  ctx.setDeadline(1);
  assertEquals(await ctx.wait(), DoneReason.DeadlineExceeded);
});
