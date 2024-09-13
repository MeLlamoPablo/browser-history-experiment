/* eslint-disable no-restricted-globals */
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

            if (
                previousState.current?.at(-1)?.includes("(duplicate)") &&
                event.state?.stack?.at(-1)?.includes("(original)")
            ) {
                history.back();
                return;
            }

            if (
                !previousState.current?.at(-1)?.includes("(original)") &&
                event.state?.stack?.at(-1)?.includes("(original)")
            ) {
                history.forward();
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
                    history.back();

                    setTimeout(() => {
                        let originalStack = [
                            ...nextStack,
                            `${last} (original)`,
                        ];
                        history.replaceState(
                            { stack: originalStack },
                            "",
                            location.href,
                        );
                        previousState.current = originalStack;
                    }, 50);

                    setTimeout(() => {
                        const duplicateStack = [
                            ...nextStack,
                            `${last} (duplicate)`,
                        ];
                        history.pushState(
                            { stack: duplicateStack },
                            "",
                            location.href,
                        );
                        setStack(duplicateStack);
                        previousState.current = duplicateStack;
                    }, 100);
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
