export function camelCase(str: string) {
    return str.split("_")
        .map(s => s.substr(0, 1).toLowerCase() + s.substr(1))
        .join("_");
}

export const NEWLINE = "\r\n";
