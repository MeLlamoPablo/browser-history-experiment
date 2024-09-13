import { useEffect, useRef, useState } from "react";
import { english, generateMnemonic } from "viem/accounts";
import "./App.css";

const randomWord = () => generateMnemonic(english).split(" ").at(0)!;

export default function App() {
    const previousState = useRef<string[] | null>(null);
    const [stack, setStack] = useState<string[]>([]);

    useEffect(() => {
        setStack(window.history.state?.stack ?? []);
    }, []);

    useEffect(() => {
        function popState(event: PopStateEvent) {
            if (event.state?.stack?.at(-1)?.includes("!")) {
                history.back();
                return;
            }

            const stack = event.state?.stack ?? [];
            setStack(stack);
            previousState.current = stack;
        }

        window.addEventListener("popstate", popState);

        return () => {
            window.removeEventListener("popstate", popState);
        };
    }, []);

    return (
        <div className="App">
            <button
                onClick={() => {
                    history.back();
                }}
            >
                ←
            </button>
            <button
                onClick={() => {
                    setStack((s) => {
                        const nextStack = [...s, randomWord()];
                        history.pushState(
                            { stack: nextStack },
                            "",
                            location.href,
                        );
                        previousState.current = nextStack;
                        return nextStack;
                    });
                }}
            >
                →
            </button>
            <br />
            <br />
            <button
                disabled={stack.length === 0}
                onClick={() => {
                    const stack = [...history.state.stack];
                    const last = stack.pop();
                    stack.push(`${last}!`);
                    history.replaceState({ stack }, "", location.href);
                    history.back();
                }}
            >
                Block state (bounce method)
            </button>
            <br />
            <br />
            <button
                disabled={stack.length === 0}
                onClick={() => {
                    const nextStack = [...stack];
                    nextStack.pop();
                    const last = nextStack.pop();
                    nextStack.push(`${last} (duplicate)`);
                    history.back();
                    setTimeout(() => {
                        history.pushState(
                            { stack: nextStack },
                            "",
                            location.href,
                        );
                        setStack(nextStack);
                    }, 50);
                }}
            >
                Block state (push-duplicate method)
            </button>
            <br />
            <ul>
                {stack.map((word, i) => (
                    <li key={i}>{word}</li>
                ))}
            </ul>
        </div>
    );
}
