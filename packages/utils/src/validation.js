export function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
export function isUrl(value) {
    try {
        new URL(value);
        return true;
    }
    catch {
        return false;
    }
}
export function isRequired(value) {
    if (value === null || value === undefined)
        return false;
    if (typeof value === "string")
        return value.trim().length > 0;
    if (Array.isArray(value))
        return value.length > 0;
    return true;
}
export function minLength(value, min) {
    return value.length >= min;
}
export function maxLength(value, max) {
    return value.length <= max;
}
export function isAlphanumeric(value) {
    return /^[a-zA-Z0-9]+$/.test(value);
}
export function isCamelCase(value) {
    return /^[a-z][a-zA-Z0-9]*$/.test(value);
}
//# sourceMappingURL=validation.js.map