import { create, DoneReason } from "./context.ts";
const ctx = create();
const child = ctx.child();
await ctx.done();
console.log("waiting for child");
const childReason = await child.wait();
const parentReason = await ctx.wait();
// the cancel should be the reason

console.log("child:", DoneReason[childReason]);
console.log("parent:", DoneReason[parentReason]);
