
type EventTypeMapper = {
    [key: string]: unknown
}

export interface TypedEventEmitter<T extends EventTypeMapper> {
    addListener<E extends keyof T>(event: keyof T, listener: (args: T[E]) => void): this;
    on<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
    once<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
    removeListener<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
    off<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
    emit<E extends keyof T>(event: E, args: T[E]): boolean;

    removeAllListeners<E extends keyof T>(event?: E): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners<E extends keyof T>(event: E): ((args: T[E]) => void)[];
    rawListeners<E extends keyof T>(event: E): ((args: T[E]) => void)[];
    listenerCount<E extends keyof T>(event: E): number;
    // Added in Node 6...
    prependListener<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
    prependOnceListener<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
    eventNames(): Array<keyof T>;
}

export interface TypedEventTarget<T extends EventTypeMapper> {
    addListener<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
    on<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
    once<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
    removeListener<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
    off<E extends keyof T>(event: E, listener: (args: T[E]) => void): this;
}

export interface MonoTypedEventListener<T> {
    (event: T): Promise<void> | void;
}
export interface MonoTypedEventTarget<T> {
    on: (listener: MonoTypedEventListener<T>)=> void
    once : (listener: MonoTypedEventListener<T>)=> void
    off :(listener: MonoTypedEventListener<T>)=> void
}

export class MonoTypedEventEmitter<T> {
    private listeners: MonoTypedEventListener<T>[] = [];
    private listenersOncer: MonoTypedEventListener<T>[] = [];

    on = (listener: MonoTypedEventListener<T>): void => {
        this.listeners.push(listener)
    }

    once = (listener: MonoTypedEventListener<T>): void => {
        this.listenersOncer.push(listener)
    }

    off = (listener: MonoTypedEventListener<T>): void => {
        const callbackIndex = this.listeners.indexOf(listener)
        if (callbackIndex > -1) this.listeners.splice(callbackIndex, 1)
    }

    emit = async (event: T): Promise<void> => {
        const emitted = [...this.listeners.map((listener) => listener(event)), ...this.listenersOncer.map((listener) => listener(event))]
        this.listenersOncer = []
        await Promise.all(emitted)
    }
}
