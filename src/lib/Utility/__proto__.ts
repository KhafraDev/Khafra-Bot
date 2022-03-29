const deprecated = ['__proto__', '__defineGetter__', '__defineSetter__'];

for (const property of deprecated) {
    Object.defineProperty(Object.prototype, property, { value: null });
}