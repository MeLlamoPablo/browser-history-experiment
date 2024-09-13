/* eslint-disable no-restricted-globals */
import { useEffect, useRef, useState } from "react";
import { english, generateMnemonic } from "viem/accounts";
import "./App.css";

const randomWord = () => generateMnemonic(english).split(" ").at(0)!;

export default function App() {
    const previousStack = useRef<string[] | null>(null);
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

            if (event.state?.stack?.at(-1)?.includes("(duplicate)")) {
                const isForward =
                    (event.state?.stack?.length ?? 0) >
                    (previousStack.current?.length ?? 0);

                if (isForward) {
                    history.forward();
                } else {
                    history.back();
                }
            }

            const stack = event.state?.stack ?? [];
            setStack(stack);
            previousStack.current = stack;
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
                        previousStack.current = nextStack;
                        return nextStack;
                    });
                }}
            >
                →
            </button>
            <br />
            <br />
            <button
                disabled={stack.length <= 1}
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
                disabled={stack.length <= 1}
                onClick={() => {
                    const nextStack = [...stack];
                    nextStack.pop();
                    const last = nextStack.pop() ?? "";
                    history.back();

                    setTimeout(() => {
                        let originalStack = [
                            ...nextStack,
                            `${last} (duplicate)`,
                        ];
                        history.replaceState(
                            { stack: originalStack },
                            "",
                            location.href,
                        );
                        previousStack.current = originalStack;
                    }, 50);

                    setTimeout(() => {
                        const duplicateStack = [...nextStack, last];
                        history.pushState(
                            { stack: duplicateStack },
                            "",
                            location.href,
                        );
                        setStack(duplicateStack);
                        previousStack.current = duplicateStack;
                    }, 100);
                }}
            >
                Block state (push-duplicate method)
            </button>
            <br />
            <ul>
                {stack.map((word, i) => (
                    <li key={i}>{word.replace(" (duplicate)", "")}</li>
                ))}
            </ul>
        </div>
    );
}
