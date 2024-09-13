/* eslint-disable no-restricted-globals */
import { useSyncExternalStore } from "react";
import { english, generateMnemonic } from "viem/accounts";
import { HistoryController } from "./HistoryController";
import "./App.css";

const randomWord = () => generateMnemonic(english).split(" ").at(0)!;

const historyController = new HistoryController<string>();

export default function App() {
    const stack = useSyncExternalStore(
        (listener) => historyController.subscribeToStackChange(listener),
        () => historyController.getCurrentStack(),
    );

    return (
        <div className="App">
            <button onClick={() => historyController.pop()}>←</button>
            <button onClick={() => historyController.push(randomWord())}>
                →
            </button>
            <br />
            <br />
            <button
                disabled={stack.length <= 1}
                onClick={() => historyController.drop()}
            >
                Drop state
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
