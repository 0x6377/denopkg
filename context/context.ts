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
  wait(): Promise<DoneReason>;
  // end this context, naturally.
  done(): Promise<void>;
  // make this cancellable
  cancellation(): () => void;
  // set a timeout deadline
  setDeadline(ms: number): void;
  clearDeadline(): void;
}

export enum DoneReason {
  Cancelled, // when a context is cancelled
  DeadlineExceeded, // when a deadline that has been set is exceeded
  Shutdown, // when one is done naturally.
}

type IdFn = () => string;

// create a new top level context.
export function createContext<Ctx extends Context>(
  idGenerator: IdFn,
  enhancer: (c: Context) => Ctx
): Ctx {
  const parent = child();
  return parent;

  function child(): Ctx {
    return enhancer(
      Object.assign(new ContextImpl(idGenerator(), parent), {
        child,
        top: () => parent,
      })
    );
  }
}

class ContextImpl implements Omit<Context, "child" | "top"> {
  readonly creation = Date.now();
  #reason: Promise<DoneReason>;
  #deferral = (x: DoneReason) => {};
  #deadline: number = -1;

  constructor(public readonly id: string, private readonly parent?: Context) {
    this.#reason = new Promise((resolve) => {
      this.#deferral = resolve;
    });
  }

  public get lifetime(): number {
    return Date.now() - this.creation;
  }

  public wait(): Promise<DoneReason> {
    return this.#reason;
  }
  public async done(): Promise<void> {
    return this.#deferral(DoneReason.Shutdown);
  }

  public cancellation(): () => void {
    return () => this.#deferral(DoneReason.Cancelled);
  }

  public setDeadline(ms: number) {
    setTimeout(() => this.#deferral(DoneReason.DeadlineExceeded), ms);
  }
  public clearDeadline() {
    clearTimeout(this.#deadline);
  }
}
