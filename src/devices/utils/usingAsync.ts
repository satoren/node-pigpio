export interface Closable {
    close(): Promise<void> | void;
}

export function usingAsync<T extends Closable[]>(closable: [...T], action: (...r: [...T]) => Promise<void>): Promise<void>;
export function usingAsync<T extends Closable>(closable: T, action: (r: T) => Promise<void>): Promise<void>;
export async function usingAsync (closable: Closable | Closable[], action: (...r: Closable[]) => Promise<void>): Promise<void> {
    const closableArray = closable instanceof Array ? closable : [closable]
    try {
        await action(...closableArray)
    } finally {
        const closables = closableArray.map(c => c.close()).filter(c => c != null) as Promise<void>[]
        await Promise.all(closables)
    }
}
