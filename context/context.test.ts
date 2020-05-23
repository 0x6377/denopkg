import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { create, DoneReason } from "./context.ts";

function assertDoneReason(actual: DoneReason, expected: DoneReason) {
  assertEquals(
    actual,
    expected,
    `Expected reason: '${DoneReason[expected]}', got '${DoneReason[actual]}'`,
  );
}

Deno.test("it should clean up", async () => {
  const ctx = create();
  const child = ctx.child();
  await ctx.done();
  const childReason = await child.wait();
  const parentReason = await ctx.wait();
  // the cancel should be the reason
  assertDoneReason(parentReason, DoneReason.Shutdown);
  assertDoneReason(childReason, DoneReason.ParentDone);
});

Deno.test("cancellation", async () => {
  const ctx = create();
  const cancel = ctx.cancellation();
  setTimeout(cancel, 0);
  const r = await ctx.wait();
  assertDoneReason(r, DoneReason.Cancelled);
});

Deno.test("deadline", async () => {
  const ctx = create();
  ctx.setDeadline(1);
  assertDoneReason(await ctx.wait(), DoneReason.DeadlineExceeded);
});
