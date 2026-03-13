export function getEnv(key, defaultValue) {
    const value = process.env[key] ?? defaultValue;
    if (value === undefined)
        throw new Error(`Missing required environment variable: ${key}`);
    return value;
}
export function isDev() {
    return process.env.NODE_ENV === "development";
}
export function isProd() {
    return process.env.NODE_ENV === "production";
}
export function isTest() {
    return process.env.NODE_ENV === "test";
}
//# sourceMappingURL=env.js.map