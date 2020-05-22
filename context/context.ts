import { v4 } from "https://deno.land/std/uuid/mod.ts";

export interface Context {
  // a unique id.
  id: string;
  // when this context was initialised (epoch millis)
  creation: number;
  // how long it has been alive in milliseconds
  lifetime: number;
  // return the "top-level" context
  top(): this;
  // create a "sub-context"
  child(): this;
  // wait for this context to end.
  // the promise resolves "after" Done
  wait(): Promise<DoneReason>;
  // end this context, naturally (unless already done).
  // returns the reason.
  done(): Promise<DoneReason>;
  // make this cancellable
  cancellation(): () => void;
  // set a timeout deadline
  setDeadline(ms: number): void;
  clearDeadline(): void;
}

export enum DoneReason {
  ParentDone, // when a parent is "done" it propagates to the children
  Cancelled, // when a context is cancelled
  DeadlineExceeded, // when a deadline that has been set is exceeded
  Shutdown, // when one is done naturally.
}

type IdFn = () => string;

const defaultIdGenerator = v4.generate;

// this is for a public, private method...
const $beforeDone = Symbol();
const $isDone = Symbol();

// here is a partial implementation - it's easier to add the final
// two methods in the creation function.
class ContextImpl implements Omit<Context, "child" | "top"> {
  readonly creation = Date.now();
  #reason: Promise<DoneReason>;
  #deferral = (x: DoneReason) => {};
  #deadline: number = -1;
  #callbacks: Array<() => Promise<void> | void> = [];
  [$isDone]: false;

  constructor(public readonly id: string, parent?: ContextImpl) {
    this.#reason = new Promise((resolve) => {
      this.#deferral = async (reason) => {
        if (this[$isDone]) {
          return;
        }
        const callbacks = this.#callbacks;
        this.#callbacks = [];
        await Promise.all(callbacks.map((fn) => fn()));
        this.clearDeadline();
        resolve(reason);
      };
    });
    parent?.[$beforeDone](() => this.#deferral(DoneReason.ParentDone));
  }

  public [$beforeDone](cb: () => Promise<void> | void): void {
    if (this[$isDone]) {
      throw new Error("Cannot register callback on finished context");
    }
    this.#callbacks.push(cb);
  }

  public get lifetime(): number {
    return Date.now() - this.creation;
  }

  public wait(): Promise<DoneReason> {
    return this.#reason;
  }
  public async done(): Promise<DoneReason> {
    this.#deferral(DoneReason.Shutdown);
    return this.wait();
  }

  public cancellation(): () => void {
    return () => this.#deferral(DoneReason.Cancelled);
  }

  public setDeadline(ms: number) {
    if (this[$isDone]) {
      return;
    }
    this.#deadline = setTimeout(
      () => this.#deferral(DoneReason.DeadlineExceeded),
      ms
    );
  }
  public clearDeadline() {
    clearTimeout(this.#deadline);
  }
}

const noEnhancer = (x: Context) => x;

/**
 * Create a potentially enhanced Context object.
 *
 * Some serious typescript crazy hoops to jump through here!
 */
function create<Ctx extends Context>(args: {
  id?: IdFn;
  enhancer: (c: Context) => Ctx;
}): Ctx;
function create(args?: { id?: IdFn }): Context;
function create<Ctx extends Context = Context>(
  args: {
    id?: IdFn;
    enhancer?: (c: Context) => Ctx;
  } = {}
): Ctx | Context {
  const createChild = enhancedChild(args.enhancer ?? noEnhancer);
  const id = args.id ?? defaultIdGenerator;
  const top = createChild();
  return top;

  function enhancedChild<C extends Context>(
    en: (c: Context) => C
  ): (parent?: ContextImpl) => C {
    return (parent) => {
      const impl = new ContextImpl(id(), parent);
      return en(
        Object.assign(impl, {
          child() {
            if (impl[$isDone]) {
              throw new Error("Cannot create a child of a closed context");
            }
            return createChild(impl);
          },
          top: () => top,
        })
      );
    };
  }
}

export { create };
