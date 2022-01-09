interface Options {
    interval: number
}

export abstract class Timer {
    public constructor (public options: Options) {}

    public abstract setInterval (): NodeJS.Timer;

    public abstract action (...items: unknown[]): Promise<void>;
}