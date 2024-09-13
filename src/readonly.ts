export const USE_FREEZE = process.env.NODE_ENV !== "production";

/** A namespace for extra functions on readonly arrays. These functions take a readonly array, but return a
 * regular array. Once the result is assigned to a readonly variable, these arrays should not be mutated
 * further. These function can be used the same as built-in Array methods like `concat`, `slice` or `map` and
 * `filter`. */
export namespace List {
    /** Appends one or many new elements to the end of the list. Always returns a copy. */
    export function push<T>(ls: readonly T[], ...elements: T[]): readonly T[] {
        return ls.concat(elements);
    }

    /** Removes the last element from the list. Always returns a copy. */
    export function pop<T>(a: readonly T[]): readonly T[] {
        return a.slice(0, -1);
    }

    /** Appends one or many new elements to the beginning of the list. Always returns a copy. */
    export function unshift<T>(
        ls: readonly T[],
        ...elements: T[]
    ): readonly T[] {
        return elements.concat(ls);
    }

    /** Insert a new element into the array. Always returns a copy. */
    export function insert<T>(
        a: readonly T[],
        index: number,
        replacement: T,
    ): readonly T[] {
        const length = a.length;
        if (index < 0 || index > length)
            throw Error("index out of range: " + index);

        const copy = a.slice();
        copy.splice(index, 0, replacement);
        return copy;
    }

    /** Replace an element in the array. Always returns a copy. */
    export function replace<T>(
        a: readonly T[],
        index: number,
        replacement: T | T[],
    ): readonly T[] {
        const length = a.length;
        if (index < 0 || index >= length)
            throw Error("index out of range: " + index);

        const itemsToAdd = Array.isArray(replacement)
            ? replacement
            : [replacement];
        const copy = a.slice();
        copy.splice(index, 1, ...itemsToAdd);
        return copy;
    }

    /** Remove an element from the array. Always returns a copy. */
    export function remove<T>(a: readonly T[], index: number): readonly T[] {
        const length = a.length;
        if (index < 0 || index >= length)
            throw Error("index out of range: " + index);

        const copy = a.slice();
        copy.splice(index, 1);
        return copy;
    }

    /** Moves an element in the array. Always returns a copy. */
    export function move<T>(
        a: readonly T[],
        from: number,
        to: number,
    ): readonly T[] {
        const length = a.length;
        if (from < 0 || from >= length)
            throw Error("from index out of range: " + from);
        if (to < 0 || to >= length) throw Error("to index out of range: " + to);

        const copy = a.slice();
        if (to === from) return copy;

        // `copy` is a copy of `a`, and we already check above that `from` does not go out of bound. The cast here
        // is to appease TS.
        const element = copy[from] as T;
        if (from < to) {
            copy.splice(to + 1, 0, element);
            copy.splice(from, 1);
        } else {
            copy.splice(from, 1);
            copy.splice(to, 0, element);
        }
        return copy;
    }

    /** Takes two lists and returns a list of pairs, matching up a[0] with b[0], ..., a[n] with b[n], until
     * one of the list runs out of elements. */
    export function zip<T1, T2>(
        a: readonly T1[],
        b: readonly T2[],
    ): readonly [T1, T2][] {
        const res: [T1, T2][] = [];
        const length = Math.min(a.length, b.length);
        for (let i = 0; i < length; i++) {
            // By picking the minimum length we ensure that a[i]/b[i] won't go out of bound, so the type cast should be
            // safe. We can't early return if the value is undefined, since T1/T2 could be undefined.
            res.push([a[i] as T1, b[i] as T2]);
        }
        return res;
    }

    /** Updates an element of an array via a inline body, returns a copy of the array with one element
     * replaced. */
    export function update<T>(
        a: readonly T[],
        index: number,
        body: (currentElement: T) => T,
    ): readonly T[] {
        const res = a.slice();
        const targetElement = res[index];
        if (targetElement === undefined) return res;
        res[index] = body(targetElement);
        return res;
    }

    /**
     * Removes any duplicate values from an array and returns a new array
     * @param a the array to inspect
     */
    export function unique<T>(a: readonly T[]): readonly T[] {
        return Array.from(new Set(a));
    }

    /**
     * Returns a readonly array including any values that does not already exist
     * @param a the array to extend
     * @param collections the arrays to merge
     */
    export function union<T>(
        a: readonly T[],
        ...collections: ConcatArray<T>[]
    ) {
        return Array.from(
            new Set([...a, ...collections.flat()]),
        ) as readonly T[];
    }

    /**
     * Returns a readonly array that has only those elements for which the predicate returned true.
     */
    export function filter<T>(
        a: readonly T[],
        predicate: (element: T) => boolean,
    ): readonly T[] {
        return a.filter(predicate);
    }
}

/** Can be used to create writable placeholders for updates. */
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

const objectHasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwnProperty(object: unknown, property: string) {
    return objectHasOwnProperty.call(object, property);
}

/** A namespace for a few function that help in the creation and updating of objects that are fully readonly.
 * Best not used directly, but inside objects that have all their fields set to readonly. */
export namespace ValueObject {
    /** Morphs any object into an object like the template, by deleting extra fields, setting missing fields
     * to defaults, and switching the prototype. Can be used on objects deserialized using JSON. */
    export function morphUsingTemplate<T extends {}>(
        values: Record<string, unknown>,
        template: T,
    ): T {
        // Delete any unknown fields
        for (const field of Object.keys(values)) {
            if (!hasOwnProperty(template, field)) {
                delete values[field];
            }
        }

        // Fill in any missing fields
        for (const field of Object.keys(template)) {
            if (values[field] === undefined) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                values[field] = (template as any)[field];
            }
        }

        Object.setPrototypeOf(values, Object.getPrototypeOf(template));
        if (USE_FREEZE) {
            Object.freeze(values);
        }
        return values as T;
    }

    /** Intended to mutate the object once, can be used in the constructor of the object. */
    export function writeOnce<T>(
        object: Writeable<T>,
        values?: Record<string, unknown>,
    ): void {
        if (values) {
            Object.assign(object, values);
        }
        if (USE_FREEZE) {
            Object.freeze(object);
        }
    }

    /** Update the current object by making a copy and applying the values to that object. Should be used to create type-safe versions. */
    export function update<T>(
        object: Readonly<T>,
        values: Record<string, unknown>,
    ): T {
        const result = Object.assign(
            Object.create(Object.getPrototypeOf(object)),
            object,
            values,
        );
        if (USE_FREEZE) {
            Object.freeze(result);
        }
        return result;
    }
}

export namespace ReadonlySet {
    export function add<T>(set: ReadonlySet<T>, ...items: T[]): ReadonlySet<T> {
        return new Set<T>([...set, ...items]);
    }

    export function remove<T>(
        set: ReadonlySet<T>,
        ...items: T[]
    ): ReadonlySet<T> {
        const result = new Set<T>(set);
        for (const item of items) {
            result.delete(item);
        }

        return result;
    }

    export function union<T>(...sets: ReadonlySet<T>[]): ReadonlySet<T> {
        const result = new Set<T>();
        for (const set of sets) {
            for (const item of set) {
                result.add(item);
            }
        }

        return result;
    }

    export function toggle<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T> {
        if (set.has(item)) {
            return ReadonlySet.remove(set, item);
        }
        return ReadonlySet.add(set, item);
    }
}

export namespace ReadonlyMap {
    export function set<K, V>(
        map: ReadonlyMap<K, V>,
        key: K,
        value: V,
    ): ReadonlyMap<K, V> {
        const result = new Map<K, V>(map);
        result.set(key, value);

        return result;
    }

    export function remove<K, V>(
        map: ReadonlyMap<K, V>,
        key: K,
    ): ReadonlyMap<K, V> {
        const result = new Map<K, V>(map);
        result.delete(key);

        return result;
    }
}
