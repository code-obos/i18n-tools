export function camelCase(str: string): string {
    return str.replace(/[\W_]+(\w)?/g, (_, ch: string) => (ch ? ch.toUpperCase() : ''));
}

export function normalizeId(id: string): string {
    return id.replace(/[\\/]/g, '.');
}
