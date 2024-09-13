import { List } from "./readonly";

type State<T> = {
    isTransient?: boolean;
    stack: readonly T[];
};

type OnChangeStack<T> = (nextStack: readonly T[]) => void;

export class HistoryController<T> {
    private EMPTY_STACK = [];

    #currentState: State<T> | null = null;
    #stackListeners: OnChangeStack<T>[] = [];

    private setCurrentState(state: State<T>) {
        this.#currentState = state;
        this.#stackListeners.forEach((listener) => listener(state.stack));
    }

    constructor() {
        this.#currentState = window.history.state;
        window.addEventListener("popstate", (event) => {
            const prevState = this.#currentState;
            const nextState = event.state;

            if (nextState?.isTransient) {
                const isForward =
                    (nextState?.stack?.length ?? 0) >
                    (prevState?.stack?.length ?? 0);

                if (isForward) {
                    window.history.forward();
                } else {
                    window.history.back();
                }
            }

            this.setCurrentState(nextState);
        });
    }

    subscribeToStackChange(listener: OnChangeStack<T>) {
        this.#stackListeners.push(listener);
        return () => {
            this.#stackListeners = this.#stackListeners.filter(
                (it) => it !== listener,
            );
        };
    }

    getCurrentStack(): readonly T[] {
        if (!this.#currentState) return this.EMPTY_STACK;
        return this.#currentState.stack;
    }

    push(value: T, url = window.location.href) {
        this.setCurrentState({
            stack: List.push(this.#currentState?.stack ?? [], value),
        });
        window.history.pushState(this.#currentState, "", url);
    }

    pop() {
        window.history.back();
        this.setCurrentState(window.history.state);
    }

    drop() {
        const nextStack = List.pop(this.#currentState?.stack ?? []);

        window.history.back();

        setTimeout(() => {
            window.history.replaceState(
                { stack: nextStack, isTransient: true },
                "",
                window.location.href,
            );
        }, 50);

        setTimeout(() => {
            this.setCurrentState({
                stack: nextStack,
            });
            window.history.pushState(
                this.#currentState,
                "",
                window.location.href,
            );
        }, 100);
    }
}
