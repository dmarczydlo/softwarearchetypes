export function randomStringWithPrefixOf(prefix: string): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${result}`;
}

export function randomElementOf<T>(collection: T[]): T {
    return collection[Math.floor(Math.random() * collection.length)];
}
