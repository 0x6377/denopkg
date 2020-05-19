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

let lastId = 0;
export function monotonicId(): string {
  return `#${lastId++}`;
}

// this is for a public, private method...
const $parentDone = Symbol();

// here is a partial implementation - it's easier to add the final
// two methods in the creation function.
class ContextImpl implements Omit<Context, "child" | "top"> {
  readonly creation = Date.now();
  #reason: Promise<DoneReason>;
  #deferral = (x: DoneReason) => {};
  #deadline: number = -1;

  constructor(
    public readonly id: string,
    private readonly children: Array<ContextImpl>
  ) {
    this.#reason = new Promise((resolve) => {
      this.#deferral = async (reason) => {
        // cancel all children first
        this.clearDeadline();
        await Promise.all(children.map((child) => child[$parentDone]()));
        resolve(reason);
      };
    });
  }

  public [$parentDone](): Promise<DoneReason> {
    this.#deferral(DoneReason.ParentDone);
    return this.wait();
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
  const child = enhancedChild(args.enhancer ?? noEnhancer);
  const id = args.id ?? monotonicId;
  const top = child();
  return top;

  function enhancedChild<C extends Context>(en: (c: Context) => C): () => C {
    return () => {
      const children: Array<ContextImpl> = [];
      const ctx = en(
        Object.assign(new ContextImpl(id(), children), {
          child: enhancedChild(en),
          top: () => top,
        })
      );
      return ctx;
    };
  }
}

export { create };
