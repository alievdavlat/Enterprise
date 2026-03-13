export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined)
    throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}
